"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Downloader = void 0;
const path = __importStar(require("path"));
const fse = __importStar(require("fs-extra"));
const axios_1 = __importDefault(require("axios"));
const __1 = require("..");
const autodesk_sdkmanager_1 = require("@aps_sdk/autodesk-sdkmanager");
const model_derivative_1 = require("@aps_sdk/model-derivative");
const authentication_1 = require("@aps_sdk/authentication");
class Downloader {
    constructor(authenticationProvider, host, region) {
        this.authenticationProvider = authenticationProvider;
        this.sdkManager = autodesk_sdkmanager_1.SdkManagerBuilder.create().build();
        this.modelDerivativeClient = new model_derivative_1.ModelDerivativeClient(this.sdkManager);
    }
    download(urn, options) {
        const context = {
            log: (options === null || options === void 0 ? void 0 : options.log) || ((message) => { }),
            outputDir: (options === null || options === void 0 ? void 0 : options.outputDir) || '.',
            cancelled: false,
            failOnMissingAssets: !!(options === null || options === void 0 ? void 0 : options.failOnMissingAssets)
        };
        return {
            ready: this._download(urn, context),
            cancel: () => { context.cancelled = true; }
        };
    }
    async _downloadDerivative(urn, derivativeUrn) {
        const accessToken = await this.authenticationProvider.getToken([authentication_1.Scopes.ViewablesRead]);
        const downloadInfo = await this.modelDerivativeClient.getDerivativeUrl(accessToken, derivativeUrn, urn);
        const response = await axios_1.default.get(downloadInfo.url, { responseType: 'arraybuffer', decompress: false });
        return response.data;
    }
    async _download(urn, context) {
        context.log(`Downloading derivative ${urn}`);
        const accessToken = await this.authenticationProvider.getToken([authentication_1.Scopes.ViewablesRead]);
        const manifest = await this.modelDerivativeClient.getManifest(accessToken, urn);
        const urnDir = path.join(context.outputDir || '.', urn);
        const derivatives = [];
        function collectDerivatives(derivative) {
            if (derivative.type === 'resource' && derivative.role === 'graphics' && derivative.mime === 'application/autodesk-svf') {
                derivatives.push(derivative);
            }
            if (derivative.children) {
                for (const child of derivative.children) {
                    collectDerivatives(child);
                }
            }
        }
        for (const derivative of manifest.derivatives) {
            if (derivative.children) {
                for (const child of derivative.children) {
                    collectDerivatives(child);
                }
            }
        }
        for (const derivative of derivatives) {
            if (context.cancelled) {
                return;
            }
            const guid = derivative.guid;
            context.log(`Downloading viewable ${guid}`);
            const guidDir = path.join(urnDir, guid);
            fse.ensureDirSync(guidDir);
            const svf = await this._downloadDerivative(urn, encodeURI(derivative.urn));
            fse.writeFileSync(path.join(guidDir, 'output.svf'), new Uint8Array(svf));
            const reader = await __1.SvfReader.FromDerivativeService(urn, guid, this.authenticationProvider);
            const manifest = await reader.getManifest();
            for (const asset of manifest.assets) {
                if (context.cancelled) {
                    return;
                }
                if (!asset.URI.startsWith('embed:')) {
                    context.log(`Downloading asset ${asset.URI}`);
                    try {
                        const assetData = await reader.getAsset(asset.URI);
                        const assetPath = path.join(guidDir, asset.URI);
                        const assetFolder = path.dirname(assetPath);
                        fse.ensureDirSync(assetFolder);
                        fse.writeFileSync(assetPath, assetData);
                    }
                    catch (err) {
                        if (context.failOnMissingAssets) {
                            throw err;
                        }
                        else {
                            context.log(`Could not download asset ${asset.URI}`);
                        }
                    }
                }
            }
        }
    }
}
exports.Downloader = Downloader;

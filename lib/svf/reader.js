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
exports.Reader = exports.Scene = void 0;
const path = __importStar(require("path"));
const fse = __importStar(require("fs-extra"));
const adm_zip_1 = __importDefault(require("adm-zip"));
const axios_1 = __importDefault(require("axios"));
const util_1 = require("util");
const autodesk_sdkmanager_1 = require("@aps_sdk/autodesk-sdkmanager");
const model_derivative_1 = require("@aps_sdk/model-derivative");
const authentication_1 = require("@aps_sdk/authentication");
const propdb_reader_1 = require("../common/propdb-reader");
const fragments_1 = require("./fragments");
const geometries_1 = require("./geometries");
const materials_1 = require("./materials");
const meshes_1 = require("./meshes");
const SVF = __importStar(require("./schema"));
const IMF = __importStar(require("../common/intermediate-format"));
class Scene {
    constructor(svf) {
        this.svf = svf;
    }
    getMetadata() {
        return this.svf.metadata.metadata;
    }
    getNodeCount() {
        return this.svf.fragments.length;
    }
    getNode(id) {
        const frag = this.svf.fragments[id];
        const node = {
            kind: IMF.NodeKind.Object,
            dbid: frag.dbID,
            geometry: frag.geometryID,
            material: frag.materialID
        };
        if (frag.transform) {
            if ('matrix' in frag.transform) {
                const { matrix, t } = frag.transform;
                node.transform = {
                    kind: IMF.TransformKind.Matrix,
                    elements: [
                        matrix[0], matrix[1], matrix[2], 0,
                        matrix[3], matrix[4], matrix[5], 0,
                        matrix[6], matrix[7], matrix[8], 0,
                        t ? t.x : 0, t ? t.y : 0, t ? t.z : 0, 1
                    ]
                };
            }
            else {
                node.transform = { kind: IMF.TransformKind.Decomposed };
                if ('q' in frag.transform) {
                    node.transform.rotation = frag.transform.q;
                }
                if ('s' in frag.transform) {
                    node.transform.scale = frag.transform.s;
                }
                if ('t' in frag.transform) {
                    node.transform.translation = frag.transform.t;
                }
            }
        }
        return node;
    }
    getGeometryCount() {
        return this.svf.geometries.length;
    }
    getGeometry(id) {
        const meta = this.svf.geometries[id];
        const mesh = this.svf.meshpacks[meta.packID][meta.entityID];
        if (mesh) {
            if ('isLines' in mesh) {
                const geom = {
                    kind: IMF.GeometryKind.Lines,
                    getIndices: () => mesh.indices,
                    getVertices: () => mesh.vertices,
                    getColors: () => mesh.colors,
                    getBounds: () => mesh.bounds
                };
                return geom;
            }
            else if ('isPoints' in mesh) {
                const geom = {
                    kind: IMF.GeometryKind.Points,
                    getVertices: () => mesh.vertices,
                    getColors: () => mesh.colors
                };
                return geom;
            }
            else {
                const geom = {
                    kind: IMF.GeometryKind.Mesh,
                    getIndices: () => mesh.indices,
                    getVertices: () => mesh.vertices,
                    getNormals: () => mesh.normals,
                    getColors: () => mesh.colors,
                    getUvChannelCount: () => mesh.uvcount,
                    getUvs: (channel) => mesh.uvmaps[channel].uvs
                };
                return geom;
            }
        }
        return { kind: IMF.GeometryKind.Empty };
    }
    getMaterialCount() {
        return this.svf.materials.length;
    }
    getMaterial(id) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const _mat = this.svf.materials[id];
        const mat = {
            kind: IMF.MaterialKind.Physical,
            diffuse: { x: 0, y: 0, z: 0 },
            metallic: (_mat === null || _mat === void 0 ? void 0 : _mat.metal) ? 1.0 : 0.0,
            opacity: (_a = _mat === null || _mat === void 0 ? void 0 : _mat.opacity) !== null && _a !== void 0 ? _a : 1.0,
            roughness: (_mat === null || _mat === void 0 ? void 0 : _mat.glossiness) ? (20.0 / _mat.glossiness) : 1.0,
            scale: { x: (_d = (_c = (_b = _mat === null || _mat === void 0 ? void 0 : _mat.maps) === null || _b === void 0 ? void 0 : _b.diffuse) === null || _c === void 0 ? void 0 : _c.scale.texture_UScale) !== null && _d !== void 0 ? _d : 1.0, y: (_g = (_f = (_e = _mat === null || _mat === void 0 ? void 0 : _mat.maps) === null || _e === void 0 ? void 0 : _e.diffuse) === null || _f === void 0 ? void 0 : _f.scale.texture_VScale) !== null && _g !== void 0 ? _g : 1.0 }
        };
        if (_mat === null || _mat === void 0 ? void 0 : _mat.diffuse) {
            mat.diffuse.x = _mat.diffuse[0];
            mat.diffuse.y = _mat.diffuse[1];
            mat.diffuse.z = _mat.diffuse[2];
        }
        if ((_mat === null || _mat === void 0 ? void 0 : _mat.metal) && _mat.specular && _mat.glossiness) {
            mat.diffuse.x = _mat.specular[0];
            mat.diffuse.y = _mat.specular[1];
            mat.diffuse.z = _mat.specular[2];
            mat.roughness = 60 / _mat.glossiness;
        }
        if ((_h = _mat === null || _mat === void 0 ? void 0 : _mat.maps) === null || _h === void 0 ? void 0 : _h.diffuse) {
            mat.maps = mat.maps || {};
            mat.maps.diffuse = _mat.maps.diffuse.uri;
        }
        return mat;
    }
    getImage(uri) {
        return this.svf.images[uri];
    }
}
exports.Scene = Scene;
/**
 * Utility class for parsing & reading SVF content from Model Derivative service
 * or from local file system.
 *
 * The class can only be instantiated using one of the two async static methods:
 * {@link Reader.FromFileSystem}, or {@link Reader.FromDerivativeService}.
 * After that, you can parse the entire SVF into memory using {@link parse}, or parse
 * individual SVF objects using methods like {@link readFragments} or {@link enumerateGeometries}.
 *
 * @example
 * const authProvider = new TwoLeggedAuthenticationProvider(APS_CLIENT_ID, APS_CLIENT_SECRET);
 * const reader = await Reader.FromDerivativeService(MODEL_URN, VIEWABLE_GUID, authProvider);
 * const scene = await reader.read(); // Read entire scene into an intermediate, in-memory representation
 * console.log(scene);
 *
 * @example
 * const reader = await Reader.FromFileSystem('path/to/output.svf');
 * // Enumerate fragments (without building a list of all of them)
 * for await (const fragment of reader.enumerateFragments()) {
 *   console.log(fragment);
 * }
 */
class Reader {
    constructor(svf, resolve) {
        this.resolve = resolve;
        const zip = new adm_zip_1.default(svf);
        const manifestEntry = zip.getEntry('manifest.json');
        const metadataEntry = zip.getEntry('metadata.json');
        if (!manifestEntry) {
            throw new Error('Missing SVF asset: manifest.js');
        }
        if (!metadataEntry) {
            throw new Error('Missing SVF asset: metadata.js');
        }
        const manifest = JSON.parse(manifestEntry.getData().toString());
        const metadata = JSON.parse(metadataEntry.getData().toString());
        const embedded = {};
        zip.getEntries().filter(entry => entry.name !== 'manifest.json' && entry.name !== 'metadata.json').forEach((entry) => {
            embedded[entry.name] = entry.getData();
        });
        this.svf = { manifest, metadata, embedded };
    }
    /**
     * Instantiates new reader for an SVF on local file system.
     * @async
     * @param {string} filepath Path to the *.svf file.
     * @returns {Promise<Reader>} Reader for the provided SVF.
     */
    static async FromFileSystem(filepath) {
        const svf = fse.readFileSync(filepath);
        const baseDir = path.dirname(filepath);
        const resolve = async (uri) => {
            const buffer = fse.readFileSync(path.join(baseDir, uri));
            return buffer;
        };
        return new Reader(svf, resolve);
    }
    /**
     * Instantiates new reader for an SVF in APS Model Derivative service.
     * @async
     * @param {string} urn APS model URN.
     * @param {string} guid APS viewable GUID. The viewable(s) can be found in the manifest
     * with type: 'resource', role: 'graphics', and mime: 'application/autodesk-svf'.
     * @param {IAuthenticationProvider} authenticationProvider Authentication provider for accessing the Model Derivative service.
     * @param {string} host Optional host URL to be used by all APS calls.
     * @param {string} region Optional region to be used by all APS calls.
     * @returns {Promise<Reader>} Reader for the provided SVF.
     */
    static async FromDerivativeService(urn, guid, authenticationProvider, host, region) {
        urn = urn.replace(/=/g, '');
        const sdkManager = autodesk_sdkmanager_1.SdkManagerBuilder.create().build();
        const modelDerivativeClient = new model_derivative_1.ModelDerivativeClient(sdkManager);
        const accessToken = await authenticationProvider.getToken([authentication_1.Scopes.ViewablesRead]);
        const manifest = await modelDerivativeClient.getManifest(accessToken, urn);
        let foundDerivative = null;
        function findDerivative(derivative) {
            if (derivative.type === 'resource' && derivative.role === 'graphics' && derivative.guid === guid) {
                foundDerivative = derivative;
            }
            if (derivative.children) {
                for (const child of derivative.children) {
                    findDerivative(child);
                }
            }
        }
        for (const derivative of manifest.derivatives) {
            if (derivative.children) {
                for (const child of derivative.children) {
                    findDerivative(child);
                }
            }
        }
        if (!foundDerivative) {
            throw new Error(`Viewable '${guid}' not found.`);
        }
        async function downloadDerivative(urn, derivativeUrn) {
            const accessToken = await authenticationProvider.getToken([authentication_1.Scopes.ViewablesRead]);
            const downloadInfo = await modelDerivativeClient.getDerivativeUrl(accessToken, derivativeUrn, urn);
            const response = await axios_1.default.get(downloadInfo.url, { responseType: 'arraybuffer', decompress: false });
            return response.data;
        }
        const svfUrn = foundDerivative.urn;
        const svf = await downloadDerivative(urn, encodeURI(svfUrn));
        const baseUri = svfUrn.substr(0, svfUrn.lastIndexOf('/'));
        const resolve = async (uri) => {
            const buffer = await downloadDerivative(urn, encodeURI(path.join(baseUri, uri)));
            return buffer;
        };
        return new Reader(svf, resolve);
    }
    /**
     * Reads the entire scene and all its referenced assets into memory.
     * In cases where a more granular control is needed (for example, when trying to control
     * memory consumption), consider parsing the different SVF elements individually,
     * using methods like {@link readFragments}, {@link enumerateGeometries}, etc.
     * @async
     * @param {IReaderOptions} [options] Additional reading options.
     * @returns {Promise<IMF.IScene>} Intermediate, in-memory representation of the loaded scene.
     */
    async read(options) {
        let output = {
            metadata: await this.getMetadata(),
            fragments: [],
            geometries: [],
            meshpacks: [],
            materials: [],
            properties: null,
            images: {}
        };
        let tasks = [];
        const log = (options && options.log) || function (msg) { };
        log(`Reading fragments...`);
        output.fragments = await this.readFragments();
        log(`Reading fragments: done`);
        log(`Reading geometries...`);
        output.geometries = await this.readGeometries();
        log(`Reading geometries: done`);
        log(`Reading materials...`);
        output.materials = await this.readMaterials();
        log(`Reading materials: done`);
        if (!(options && options.skipPropertyDb)) {
            tasks.push((async () => {
                log(`Reading property database...`);
                output.properties = await this.getPropertyDb();
                log(`Reading property database: done`);
            })());
        }
        if (options && options.filter) {
            const fragments = output.fragments;
            const geometries = output.geometries;
            const packIds = new Set();
            for (let i = 0, len = fragments.length; i < len; i++) {
                const fragment = fragments[i];
                if (options.filter(fragment.dbID, i)) {
                    packIds.add(geometries[fragment.geometryID].packID);
                }
            }
            for (const packId of packIds.values()) {
                tasks.push((async (id) => {
                    log(`Reading meshpack #${id}...`);
                    output.meshpacks[id] = await this.readMeshPack(id);
                    log(`Reading meshpack #${id}: done`);
                })(packId));
            }
        }
        else {
            for (let i = 0, len = this.getMeshPackCount(); i < len; i++) {
                tasks.push((async (id) => {
                    log(`Reading meshpack #${id}...`);
                    output.meshpacks[id] = await this.readMeshPack(id);
                    log(`Reading meshpack #${id}: done`);
                })(i));
            }
        }
        for (const img of this.listImages()) {
            tasks.push((async (uri) => {
                log(`Downloading image ${uri}...`);
                const { normalizedUri, imageData } = await this.loadImage(uri);
                output.images[normalizedUri] = imageData;
                log(`Downloading image ${uri}: done`);
            })(img));
        }
        await Promise.all(tasks);
        return new Scene(output);
    }
    findAsset(query) {
        return this.svf.manifest.assets.find(asset => {
            return ((0, util_1.isNullOrUndefined)(query.type) || asset.type === query.type)
                && ((0, util_1.isNullOrUndefined)(query.uri) || asset.URI === query.uri);
        });
    }
    /**
     * Retrieves raw binary data of a specific SVF asset.
     * @async
     * @param {string} uri Asset URI.
     * @returns {Promise<Buffer>} Asset content.
     */
    async getAsset(uri) {
        return this.resolve(uri);
    }
    /**
     * Retrieves parsed SVF metadata.
     * @async
     * @returns {Promise<SVF.ISvfMetadata>} SVF metadata.
     */
    async getMetadata() {
        return this.svf.metadata;
    }
    /**
     * Retrieves parsed SVF manifest.
     * @async
     * @returns {Promise<SVF.ISvfManifest>} SVF manifest.
     */
    async getManifest() {
        return this.svf.manifest;
    }
    /**
     * Retrieves, parses, and iterates over all SVF fragments.
     * @async
     * @generator
     * @returns {AsyncIterable<SVF.IFragment>} Async iterator over parsed fragments.
     */
    async *enumerateFragments() {
        const fragmentAsset = this.findAsset({ type: SVF.AssetType.FragmentList });
        if (!fragmentAsset) {
            throw new Error(`Fragment list not found.`);
        }
        const buffer = await this.getAsset(fragmentAsset.URI);
        for (const fragment of (0, fragments_1.parseFragments)(buffer)) {
            yield fragment;
        }
    }
    /**
     * Retrieves, parses, and collects all SVF fragments.
     * @async
     * @returns {Promise<IFragment[]>} List of parsed fragments.
     */
    async readFragments() {
        const fragmentAsset = this.findAsset({ type: SVF.AssetType.FragmentList });
        if (!fragmentAsset) {
            throw new Error(`Fragment list not found.`);
        }
        const buffer = await this.getAsset(fragmentAsset.URI);
        return Array.from((0, fragments_1.parseFragments)(buffer));
    }
    /**
     * Retrieves, parses, and iterates over all SVF geometry metadata.
     * @async
     * @generator
     * @returns {AsyncIterable<SVF.IGeometryMetadata>} Async iterator over parsed geometry metadata.
     */
    async *enumerateGeometries() {
        const geometryAsset = this.findAsset({ type: SVF.AssetType.GeometryMetadataList });
        if (!geometryAsset) {
            throw new Error(`Geometry metadata not found.`);
        }
        const buffer = await this.getAsset(geometryAsset.URI);
        for (const geometry of (0, geometries_1.parseGeometries)(buffer)) {
            yield geometry;
        }
    }
    /**
     * Retrieves, parses, and collects all SVF geometry metadata.
     * @async
     * @returns {Promise<SVF.IGeometryMetadata[]>} List of parsed geometry metadata.
     */
    async readGeometries() {
        const geometryAsset = this.findAsset({ type: SVF.AssetType.GeometryMetadataList });
        if (!geometryAsset) {
            throw new Error(`Geometry metadata not found.`);
        }
        const buffer = await this.getAsset(geometryAsset.URI);
        return Array.from((0, geometries_1.parseGeometries)(buffer));
    }
    /**
     * Gets the number of available mesh packs.
     */
    getMeshPackCount() {
        let count = 0;
        this.svf.manifest.assets.forEach(asset => {
            if (asset.type === SVF.AssetType.PackFile && asset.URI.match(/^\d+\.pf$/)) {
                count++;
            }
        });
        return count;
    }
    /**
     * Retrieves, parses, and iterates over all meshes, lines, or points in a specific SVF meshpack.
     * @async
     * @generator
     * @returns {AsyncIterable<SVF.IMesh | SVF.ILines | SVF.IPoints | null>} Async iterator over parsed meshes,
     * lines, or points (or null values for unsupported mesh types).
     */
    async *enumerateMeshPack(packNumber) {
        const meshPackAsset = this.findAsset({ type: SVF.AssetType.PackFile, uri: `${packNumber}.pf` });
        if (!meshPackAsset) {
            throw new Error(`Mesh packfile ${packNumber}.pf not found.`);
        }
        const buffer = await this.getAsset(meshPackAsset.URI);
        for (const mesh of (0, meshes_1.parseMeshes)(buffer)) {
            yield mesh;
        }
    }
    /**
     * Retrieves, parses, and collects all meshes, lines, or points in a specific SVF meshpack.
     * @async
     * @param {number} packNumber Index of mesh pack file.
     * @returns {Promise<(SVF.IMesh | SVF.ILines | SVF.IPoints | null)[]>} List of parsed meshes,
     * lines, or points (or null values for unsupported mesh types).
     */
    async readMeshPack(packNumber) {
        const meshPackAsset = this.findAsset({ type: SVF.AssetType.PackFile, uri: `${packNumber}.pf` });
        if (!meshPackAsset) {
            throw new Error(`Mesh packfile ${packNumber}.pf not found.`);
        }
        const buffer = await this.getAsset(meshPackAsset.URI);
        return Array.from((0, meshes_1.parseMeshes)(buffer));
    }
    /**
     * Retrieves, parses, and iterates over all SVF materials.
     * @async
     * @generator
     * @returns {AsyncIterable<SVF.IMaterial | null>} Async iterator over parsed materials
     * (or null values for unsupported material types).
     */
    async *enumerateMaterials() {
        const materialsAsset = this.findAsset({ type: SVF.AssetType.ProteinMaterials, uri: `Materials.json.gz` });
        if (!materialsAsset) {
            throw new Error(`Materials not found.`);
        }
        const buffer = await this.getAsset(materialsAsset.URI);
        for (const material of (0, materials_1.parseMaterials)(buffer)) {
            yield material;
        }
    }
    /**
     * Retrieves, parses, and collects all SVF materials.
     * @async
     * @returns {Promise<(SVF.IMaterial | null)[]>} List of parsed materials (or null values for unsupported material types).
     */
    async readMaterials() {
        const materialsAsset = this.findAsset({ type: SVF.AssetType.ProteinMaterials, uri: `Materials.json.gz` });
        if (!materialsAsset) {
            throw new Error(`Materials not found.`);
        }
        const buffer = await this.getAsset(materialsAsset.URI);
        return Array.from((0, materials_1.parseMaterials)(buffer));
    }
    /**
     * Loads an image.
     * @param uri Image URI.
     */
    async loadImage(uri) {
        const normalizedUri = uri.toLowerCase().split(/[\/\\]/).join(path.sep);
        let imageData = null;
        // Sometimes, Model Derivative service URIs must be left unmodified...
        try {
            imageData = await this.getAsset(uri);
        }
        catch (err) { }
        // Sometimes, they must be lower-cased...
        if (!imageData) {
            try {
                imageData = await this.getAsset(uri.toLowerCase());
            }
            catch (err) { }
        }
        // And sometimes, they're just missing...
        if (!imageData) {
            imageData = undefined;
        }
        return { normalizedUri, imageData };
    }
    /**
     * Finds URIs of all image assets referenced in the SVF.
     * These can then be retrieved using {@link getAsset}.
     * @returns {string[]} Image asset URIs.
     */
    listImages() {
        return this.svf.manifest.assets
            .filter(asset => asset.type === SVF.AssetType.Image)
            .map(asset => asset.URI);
    }
    /**
     * Retrieves and parses the property database.
     * @async
     * @returns {Promise<PropDbReader>} Property database reader.
     */
    async getPropertyDb() {
        const idsAsset = this.findAsset({ type: SVF.AssetType.PropertyIDs });
        const offsetsAsset = this.findAsset({ type: SVF.AssetType.PropertyOffsets });
        const avsAsset = this.findAsset({ type: SVF.AssetType.PropertyAVs });
        const attrsAsset = this.findAsset({ type: SVF.AssetType.PropertyAttributes });
        const valsAsset = this.findAsset({ type: SVF.AssetType.PropertyValues });
        if (!idsAsset || !offsetsAsset || !avsAsset || !attrsAsset || !valsAsset) {
            throw new Error('Could not parse property database. Some of the database assets are missing.');
        }
        const buffers = await Promise.all([
            this.getAsset(idsAsset.URI),
            this.getAsset(offsetsAsset.URI),
            this.getAsset(avsAsset.URI),
            this.getAsset(attrsAsset.URI),
            this.getAsset(valsAsset.URI)
        ]);
        return new propdb_reader_1.PropDbReader(buffers[0], buffers[1], buffers[2], buffers[3], buffers[4]);
    }
}
exports.Reader = Reader;

import { ModelDerivativeClient } from '@aps_sdk/model-derivative';
import { SdkManager } from '@aps_sdk/autodesk-sdkmanager';
import { IAuthenticationProvider } from '../common/authentication-provider';
export interface IDownloadOptions {
    outputDir?: string;
    log?: (message: string) => void;
    failOnMissingAssets?: boolean;
}
export interface IDownloadTask {
    ready: Promise<void>;
    cancel: () => void;
}
export declare class Downloader {
    protected authenticationProvider: IAuthenticationProvider;
    protected sdkManager: SdkManager;
    protected modelDerivativeClient: ModelDerivativeClient;
    constructor(authenticationProvider: IAuthenticationProvider);
    download(urn: string, options?: IDownloadOptions): IDownloadTask;
    private _downloadDerivative;
    private _download;
}
//# sourceMappingURL=downloader.d.ts.map
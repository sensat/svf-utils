import { AuthenticationClient, Scopes } from "@aps_sdk/authentication";
import { SdkManager } from "@aps_sdk/autodesk-sdkmanager";
export interface IAuthenticationProvider {
    getToken(scopes: Scopes[]): Promise<string>;
}
export declare class BasicAuthenticationProvider implements IAuthenticationProvider {
    protected accessToken: string;
    constructor(accessToken: string);
    getToken(scopes: Scopes[]): Promise<string>;
}
export declare class TwoLeggedAuthenticationProvider implements IAuthenticationProvider {
    protected clientId: string;
    protected clientSecret: string;
    protected sdkManager: SdkManager;
    protected authenticationClient: AuthenticationClient;
    constructor(clientId: string, clientSecret: string);
    getToken(scopes: Scopes[]): Promise<string>;
}
//# sourceMappingURL=authentication-provider.d.ts.map
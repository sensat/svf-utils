/// <reference types="node" />
import { PropDbReader } from '../common/propdb-reader';
import * as SVF from './schema';
import * as IMF from '../common/intermediate-format';
import { IAuthenticationProvider } from '../common/authentication-provider';
/**
 * Entire content of SVF and its assets loaded in memory.
 */
export interface ISvfContent {
    metadata: SVF.ISvfMetadata;
    fragments: SVF.IFragment[];
    geometries: SVF.IGeometryMetadata[];
    meshpacks: (SVF.IMesh | SVF.ILines | SVF.IPoints | null)[][];
    materials: (SVF.IMaterial | null)[];
    properties: PropDbReader;
    images: {
        [uri: string]: Buffer;
    };
}
export declare class Scene implements IMF.IScene {
    protected svf: ISvfContent;
    constructor(svf: ISvfContent);
    getMetadata(): IMF.IMetadata;
    getNodeCount(): number;
    getNode(id: number): IMF.Node;
    getGeometryCount(): number;
    getGeometry(id: number): IMF.Geometry;
    getMaterialCount(): number;
    getMaterial(id: number): IMF.Material;
    getImage(uri: string): Buffer | undefined;
}
/**
 * Additional options when reading the entire SVF.
 */
export interface IReaderOptions {
    log?: (msg: string) => void;
    skipPropertyDb?: boolean;
    filter?: (dbid: number, fragid: number) => boolean;
}
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
export declare class Reader {
    protected resolve: (uri: string) => Promise<Buffer>;
    /**
     * Instantiates new reader for an SVF on local file system.
     * @async
     * @param {string} filepath Path to the *.svf file.
     * @returns {Promise<Reader>} Reader for the provided SVF.
     */
    static FromFileSystem(filepath: string): Promise<Reader>;
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
    static FromDerivativeService(urn: string, guid: string, authenticationProvider: IAuthenticationProvider, host?: string, region?: string): Promise<Reader>;
    protected svf: SVF.ISvfRoot;
    protected constructor(svf: Buffer, resolve: (uri: string) => Promise<Buffer>);
    /**
     * Reads the entire scene and all its referenced assets into memory.
     * In cases where a more granular control is needed (for example, when trying to control
     * memory consumption), consider parsing the different SVF elements individually,
     * using methods like {@link readFragments}, {@link enumerateGeometries}, etc.
     * @async
     * @param {IReaderOptions} [options] Additional reading options.
     * @returns {Promise<IMF.IScene>} Intermediate, in-memory representation of the loaded scene.
     */
    read(options?: IReaderOptions): Promise<IMF.IScene>;
    protected findAsset(query: {
        type?: SVF.AssetType;
        uri?: string;
    }): SVF.ISvfManifestAsset | undefined;
    /**
     * Retrieves raw binary data of a specific SVF asset.
     * @async
     * @param {string} uri Asset URI.
     * @returns {Promise<Buffer>} Asset content.
     */
    getAsset(uri: string): Promise<Buffer>;
    /**
     * Retrieves parsed SVF metadata.
     * @async
     * @returns {Promise<SVF.ISvfMetadata>} SVF metadata.
     */
    getMetadata(): Promise<SVF.ISvfMetadata>;
    /**
     * Retrieves parsed SVF manifest.
     * @async
     * @returns {Promise<SVF.ISvfManifest>} SVF manifest.
     */
    getManifest(): Promise<SVF.ISvfManifest>;
    /**
     * Retrieves, parses, and iterates over all SVF fragments.
     * @async
     * @generator
     * @returns {AsyncIterable<SVF.IFragment>} Async iterator over parsed fragments.
     */
    enumerateFragments(): AsyncIterable<SVF.IFragment>;
    /**
     * Retrieves, parses, and collects all SVF fragments.
     * @async
     * @returns {Promise<IFragment[]>} List of parsed fragments.
     */
    readFragments(): Promise<SVF.IFragment[]>;
    /**
     * Retrieves, parses, and iterates over all SVF geometry metadata.
     * @async
     * @generator
     * @returns {AsyncIterable<SVF.IGeometryMetadata>} Async iterator over parsed geometry metadata.
     */
    enumerateGeometries(): AsyncIterable<SVF.IGeometryMetadata>;
    /**
     * Retrieves, parses, and collects all SVF geometry metadata.
     * @async
     * @returns {Promise<SVF.IGeometryMetadata[]>} List of parsed geometry metadata.
     */
    readGeometries(): Promise<SVF.IGeometryMetadata[]>;
    /**
     * Gets the number of available mesh packs.
     */
    getMeshPackCount(): number;
    /**
     * Retrieves, parses, and iterates over all meshes, lines, or points in a specific SVF meshpack.
     * @async
     * @generator
     * @returns {AsyncIterable<SVF.IMesh | SVF.ILines | SVF.IPoints | null>} Async iterator over parsed meshes,
     * lines, or points (or null values for unsupported mesh types).
     */
    enumerateMeshPack(packNumber: number): AsyncIterable<SVF.IMesh | SVF.ILines | SVF.IPoints | null>;
    /**
     * Retrieves, parses, and collects all meshes, lines, or points in a specific SVF meshpack.
     * @async
     * @param {number} packNumber Index of mesh pack file.
     * @returns {Promise<(SVF.IMesh | SVF.ILines | SVF.IPoints | null)[]>} List of parsed meshes,
     * lines, or points (or null values for unsupported mesh types).
     */
    readMeshPack(packNumber: number): Promise<(SVF.IMesh | SVF.ILines | SVF.IPoints | null)[]>;
    /**
     * Retrieves, parses, and iterates over all SVF materials.
     * @async
     * @generator
     * @returns {AsyncIterable<SVF.IMaterial | null>} Async iterator over parsed materials
     * (or null values for unsupported material types).
     */
    enumerateMaterials(): AsyncIterable<SVF.IMaterial | null>;
    /**
     * Retrieves, parses, and collects all SVF materials.
     * @async
     * @returns {Promise<(SVF.IMaterial | null)[]>} List of parsed materials (or null values for unsupported material types).
     */
    readMaterials(): Promise<(SVF.IMaterial | null)[]>;
    /**
     * Loads an image.
     * @param uri Image URI.
     */
    loadImage(uri: string): Promise<{
        normalizedUri: string;
        imageData: Buffer | undefined;
    }>;
    /**
     * Finds URIs of all image assets referenced in the SVF.
     * These can then be retrieved using {@link getAsset}.
     * @returns {string[]} Image asset URIs.
     */
    listImages(): string[];
    /**
     * Retrieves and parses the property database.
     * @async
     * @returns {Promise<PropDbReader>} Property database reader.
     */
    getPropertyDb(): Promise<PropDbReader>;
}
//# sourceMappingURL=reader.d.ts.map
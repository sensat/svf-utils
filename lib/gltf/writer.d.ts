/// <reference types="node" />
/// <reference types="node" />
import * as fse from 'fs-extra';
import * as gltf from './schema';
import * as IMF from '../common/intermediate-format';
export interface IWriterOptions {
    maxBufferSize?: number; /** Approx. size limit (in bytes) of binary buffers with mesh data (5 << 20 by default) */
    ignoreMeshGeometry?: boolean; /** Don't output mesh geometry */
    ignoreLineGeometry?: boolean; /** Don't output line geometry */
    ignorePointGeometry?: boolean; /** Don't output point geometry */
    deduplicate?: boolean; /** Find and remove mesh geometry duplicates (increases the processing time) */
    skipUnusedUvs?: boolean; /** Skip unused tex coordinates. */
    center?: boolean; /** Move the model to origin. */
    log?: (msg: string) => void; /** Optional logging function. */
    filter?: (dbid: number, fragid: number) => boolean;
}
interface IWriterStats {
    materialsDeduplicated: number;
    meshesDeduplicated: number;
    accessorsDeduplicated: number;
    bufferViewsDeduplicated: number;
}
/**
 * Utility class for serializing parsed 3D content to local file system as glTF (2.0).
 */
export declare class Writer {
    protected options: Required<IWriterOptions>;
    protected baseDir: string;
    protected manifest: gltf.GlTf;
    protected bufferStream: fse.WriteStream | null;
    protected bufferSize: number;
    protected bufferViewCache: Map<string, gltf.BufferView>;
    protected meshHashes: Map<string, number>;
    protected bufferViewHashes: Map<string, number>;
    protected accessorHashes: Map<string, number>;
    protected pendingTasks: Promise<void>[];
    protected activeSvfMaterials: number[];
    protected stats: IWriterStats;
    /**
     * Initializes the writer.
     * @param {IWriterOptions} [options={}] Additional writer options.
     */
    constructor(options?: IWriterOptions);
    /**
     * Outputs scene into glTF.
     * @async
     * @param {IMF.IScene} imf Complete scene in intermediate, in-memory format.
     * @param {string} outputDir Path to output folder.
     */
    write(imf: IMF.IScene, outputDir: string): Promise<void>;
    protected reset(outputDir: string): void;
    protected postprocess(imf: IMF.IScene, gltfPath: string): Promise<void>;
    protected serializeManifest(manifest: gltf.GlTf, outputPath: string): void;
    protected createScene(imf: IMF.IScene): gltf.Scene;
    protected createNode(fragment: IMF.IObjectNode, imf: IMF.IScene, outputUvs: boolean): gltf.Node;
    protected addMesh(mesh: gltf.Mesh): number;
    protected createMeshGeometry(geometry: IMF.IMeshGeometry, imf: IMF.IScene, outputUvs: boolean): gltf.Mesh;
    protected createLineGeometry(geometry: IMF.ILineGeometry, imf: IMF.IScene): gltf.Mesh;
    protected createPointGeometry(geometry: IMF.IPointGeometry, imf: IMF.IScene): gltf.Mesh;
    protected addBufferView(bufferView: gltf.BufferView): number;
    protected createBufferView(data: Buffer): gltf.BufferView;
    protected addAccessor(accessor: gltf.Accessor): number;
    protected createAccessor(bufferViewID: number, componentType: number, count: number, type: string, min?: number[], max?: number[]): gltf.Accessor;
    protected createMaterial(mat: IMF.Material | null, imf: IMF.IScene): gltf.MaterialPbrMetallicRoughness;
    protected createTexture(uri: string, imf: IMF.IScene): gltf.Texture;
    protected computeMeshHash(mesh: gltf.Mesh): string;
    protected computeBufferViewHash(bufferView: gltf.BufferView): string;
    protected computeAccessorHash(accessor: gltf.Accessor): string;
    protected computeBufferHash(buffer: Buffer): string;
    protected computeMaterialHash(material: IMF.IPhysicalMaterial | null): string;
    protected computeBoundsVec3(array: Float32Array): {
        min: number[];
        max: number[];
    };
    protected computeIndicesForPolylines(geometry: IMF.ILineGeometry): {
        indices: Uint16Array;
        drawMode: number;
    };
}
export {};
//# sourceMappingURL=writer.d.ts.map
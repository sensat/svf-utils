/// <reference types="node" />
import { IMesh, ILines, IPoints } from './schema';
/**
 * Parses meshes from a binary buffer, typically stored in files called '<number>.pf',
 * referenced in the SVF manifest as an asset of type 'Autodesk.CloudPlatform.PackFile'.
 * @generator
 * @param {Buffer} buffer Binary buffer to parse.
 * @returns {Iterable<IMesh | ILines | IPoints | null>} Instances of parsed meshes, or null values
 * if the mesh cannot be parsed (and to maintain the indices used in {@link IGeometry}).
 */
export declare function parseMeshes(buffer: Buffer): Iterable<IMesh | ILines | IPoints | null>;
//# sourceMappingURL=meshes.d.ts.map
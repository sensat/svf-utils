/// <reference types="node" />
import { IMaterial } from './schema';
/**
 * Parses materials from a binary buffer, typically stored in a file called 'Materials.json.gz',
 * referenced in the SVF manifest as an asset of type 'ProteinMaterials'.
 * @generator
 * @param {Buffer} buffer Binary buffer to parse.
 * @returns {Iterable<IMaterial | null>} Instances of parsed materials, or null if there are none (or are not supported).
 */
export declare function parseMaterials(buffer: Buffer): Iterable<IMaterial | null>;
//# sourceMappingURL=materials.d.ts.map
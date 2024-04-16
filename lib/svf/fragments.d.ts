/// <reference types="node" />
import { IFragment } from './schema';
/**
 * Parses fragments from a binary buffer, typically stored in a file called 'FragmentList.pack',
 * referenced in the SVF manifest as an asset of type 'Autodesk.CloudPlatform.FragmentList'.
 * @generator
 * @param {Buffer} buffer Binary buffer to parse.
 * @returns {Iterable<IFragment>} Instances of parsed fragments.
 */
export declare function parseFragments(buffer: Buffer): Iterable<IFragment>;
//# sourceMappingURL=fragments.d.ts.map
/// <reference types="node" />
import { IGeometryMetadata } from "./schema";
/**
 * Parses geometries from a binary buffer, typically stored in a file called 'GeometryMetadata.pf',
 * referenced in the SVF manifest as an asset of type 'Autodesk.CloudPlatform.GeometryMetadataList'.
 * @generator
 * @param {Buffer} buffer Binary buffer to parse.
 * @returns {Iterable<IGeometryMetadata>} Instances of parsed geometries.
 */
export declare function parseGeometries(buffer: Buffer): Iterable<IGeometryMetadata>;
//# sourceMappingURL=geometries.d.ts.map
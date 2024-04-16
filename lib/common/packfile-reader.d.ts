/// <reference types="node" />
import { InputStream } from './input-stream';
import { IVector3, IQuaternion, Matrix3x3, Transform } from '../svf/schema';
/**
 * Reader of "packfile" protocol used to encode various types of SVF assets,
 * for example, geometry metadata, or meshes.
 */
export declare class PackFileReader extends InputStream {
    protected _type: string;
    protected _version: number;
    protected _entries: any[];
    protected _types: any[];
    constructor(buffer: Buffer);
    parseContents(): void;
    numEntries(): number;
    seekEntry(i: number): any;
    getVector3D(): IVector3;
    getQuaternion(): IQuaternion;
    getMatrix3x3(): Matrix3x3;
    getTransform(): Transform | null;
}
//# sourceMappingURL=packfile-reader.d.ts.map
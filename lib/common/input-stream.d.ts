/// <reference types="node" />
/**
 * Simple binary stream reader. Used for parsing different types of SVF assets.
 */
export declare class InputStream {
    protected _buffer: Buffer;
    protected _offset: number;
    protected _length: number;
    get offset(): number;
    get length(): number;
    constructor(buffer: Buffer);
    seek(offset: number): void;
    getUint8(): number;
    getUint16(): number;
    getInt16(): number;
    getUint32(): number;
    getInt32(): number;
    getFloat32(): number;
    getFloat64(): number;
    getVarint(): number;
    getString(len: number): string;
}
//# sourceMappingURL=input-stream.d.ts.map
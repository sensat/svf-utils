"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputStream = void 0;
/**
 * Simple binary stream reader. Used for parsing different types of SVF assets.
 */
class InputStream {
    constructor(buffer) {
        this._buffer = buffer;
        this._offset = 0;
        this._length = buffer.length;
    }
    get offset() {
        return this._offset;
    }
    get length() {
        return this._length;
    }
    seek(offset) {
        this._offset = offset;
    }
    getUint8() {
        const val = this._buffer.readUInt8(this._offset);
        this._offset += 1;
        return val;
    }
    getUint16() {
        const val = this._buffer.readUInt16LE(this._offset);
        this._offset += 2;
        return val;
    }
    getInt16() {
        const val = this._buffer.readInt16LE(this._offset);
        this._offset += 2;
        return val;
    }
    getUint32() {
        const val = this._buffer.readUInt32LE(this._offset);
        this._offset += 4;
        return val;
    }
    getInt32() {
        const val = this._buffer.readInt32LE(this._offset);
        this._offset += 4;
        return val;
    }
    getFloat32() {
        const val = this._buffer.readFloatLE(this._offset);
        this._offset += 4;
        return val;
    }
    getFloat64() {
        const val = this._buffer.readDoubleLE(this._offset);
        this._offset += 8;
        return val;
    }
    getVarint() {
        let byte, val = 0, shift = 0;
        do {
            byte = this._buffer[this._offset++];
            val |= (byte & 0x7f) << shift;
            shift += 7;
        } while (byte & 0x80);
        return val;
    }
    getString(len) {
        const val = this._buffer.toString('utf8', this._offset, this._offset + len);
        this._offset += len;
        return val;
    }
}
exports.InputStream = InputStream;

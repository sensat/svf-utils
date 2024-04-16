"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackFileReader = void 0;
const zlib = __importStar(require("zlib"));
const input_stream_1 = require("./input-stream");
/**
 * Reader of "packfile" protocol used to encode various types of SVF assets,
 * for example, geometry metadata, or meshes.
 */
class PackFileReader extends input_stream_1.InputStream {
    constructor(buffer) {
        super((buffer[0] === 31 && buffer[1] === 139) ? zlib.gunzipSync(buffer) : buffer);
        this._entries = []; // offsets to individual entries in the pack file
        this._types = []; // types of all entries in the pack file
        this._type = this.getString(this.getVarint());
        this._version = this.getInt32();
        this.parseContents();
    }
    parseContents() {
        // Get offsets to TOC and type sets from the end of the file
        const originalOffset = this._offset;
        this.seek(this.length - 8);
        const entriesOffset = this.getUint32();
        const typesOffset = this.getUint32();
        // Populate entries
        this._entries = [];
        this.seek(entriesOffset);
        const entriesCount = this.getVarint();
        for (let i = 0; i < entriesCount; i++) {
            this._entries.push(this.getUint32());
        }
        // Populate type sets
        this.seek(typesOffset);
        const typesCount = this.getVarint();
        for (let i = 0; i < typesCount; i++) {
            const _class = this.getString(this.getVarint());
            const _type = this.getString(this.getVarint());
            this._types.push({
                _class,
                _type,
                version: this.getVarint()
            });
        }
        // Restore offset
        this.seek(originalOffset);
    }
    numEntries() {
        return this._entries.length;
    }
    seekEntry(i) {
        if (i >= this.numEntries()) {
            return null;
        }
        // Read the type index and populate the entry data
        const offset = this._entries[i];
        this.seek(offset);
        const type = this.getUint32();
        if (type >= this._types.length) {
            return null;
        }
        return this._types[type];
    }
    getVector3D() {
        return {
            x: this.getFloat64(),
            y: this.getFloat64(),
            z: this.getFloat64()
        };
    }
    getQuaternion() {
        return {
            x: this.getFloat32(),
            y: this.getFloat32(),
            z: this.getFloat32(),
            w: this.getFloat32()
        };
    }
    getMatrix3x3() {
        const elements = [];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                elements.push(this.getFloat32());
            }
        }
        return elements;
    }
    getTransform() {
        const xformType = this.getUint8();
        let q, t, s, matrix;
        switch (xformType) {
            case 0: // translation
                return { t: this.getVector3D() };
            case 1: // rotation & translation
                q = this.getQuaternion();
                t = this.getVector3D();
                s = { x: 1, y: 1, z: 1 };
                return { q, t, s };
            case 2: // uniform scale & rotation & translation
                const scale = this.getFloat32();
                q = this.getQuaternion();
                t = this.getVector3D();
                s = { x: scale, y: scale, z: scale };
                return { q, t, s };
            case 3: // affine matrix
                matrix = this.getMatrix3x3();
                t = this.getVector3D();
                return { matrix, t };
        }
        return null;
    }
}
exports.PackFileReader = PackFileReader;

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
exports.PropDbReader = void 0;
const zlib = __importStar(require("zlib"));
/**
 * Helper class for parsing and querying property database
 * stored in various 'objects_*.json.gz' assets in an SVF.
 */
class PropDbReader {
    /**
     * Initializes the property database reader.
     * @param {Buffer} ids Content of objects_ids.json.gz file.
     * @param {Buffer} offsets Content of objects_offs.json.gz file.
     * @param {Buffer} avs Content of objects_avs.json.gz file.
     * @param {Buffer} attrs Content of objects_attrs.json.gz file.
     * @param {Buffer} vals Content of objects_vals.json.gz file.
     */
    constructor(ids, offsets, avs, attrs, vals) {
        this._ids = JSON.parse(zlib.gunzipSync(ids).toString());
        this._offsets = JSON.parse(zlib.gunzipSync(offsets).toString());
        this._avs = JSON.parse(zlib.gunzipSync(avs).toString());
        this._attrs = JSON.parse(zlib.gunzipSync(attrs).toString());
        this._vals = JSON.parse(zlib.gunzipSync(vals).toString());
    }
    /**
     * Enumerates all properties (including internal ones such as "__child__" property
     * establishing the parent-child relationships) of given object.
     * @generator
     * @param {number} id Object ID.
     * @returns {Iterable<{ name: string; category: string; value: any }>} Name, category, and value of each property.
     */
    *enumerateProperties(id) {
        if (id > 0 && id < this._offsets.length) {
            const avStart = 2 * this._offsets[id];
            const avEnd = id == this._offsets.length - 1 ? this._avs.length : 2 * this._offsets[id + 1];
            for (let i = avStart; i < avEnd; i += 2) {
                const attrOffset = this._avs[i];
                const valOffset = this._avs[i + 1];
                const attr = this._attrs[attrOffset];
                const value = this._vals[valOffset];
                yield { name: attr[0], category: attr[1], value };
            }
        }
    }
    /**
     * Finds "public" properties of given object.
     * Additional properties like parent-child relationships are not included in the output.
     * @param {number} id Object ID.
     * @returns {{ [name: string]: any }} Dictionary of property names and values.
     */
    getProperties(id) {
        let props = {};
        for (const prop of this.enumerateProperties(id)) {
            if (prop.category && prop.category.match(/^__\w+__$/)) {
                // Skip internal attributes
            }
            else {
                props[prop.name] = prop.value;
            }
        }
        return props;
    }
    /**
     * Finds IDs of all children of given object.
     * @param {number} id Object ID.
     * @returns {number[]} Children IDs.
     */
    getChildren(id) {
        let children = [];
        for (const prop of this.enumerateProperties(id)) {
            if (prop.category === '__child__') {
                children.push(prop.value);
            }
        }
        return children;
    }
}
exports.PropDbReader = PropDbReader;

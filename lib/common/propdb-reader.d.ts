/// <reference types="node" />
/**
 * Helper class for parsing and querying property database
 * stored in various 'objects_*.json.gz' assets in an SVF.
 */
export declare class PropDbReader {
    protected _ids: number[];
    protected _offsets: number[];
    protected _avs: number[];
    protected _attrs: any[];
    protected _vals: any[];
    /**
     * Initializes the property database reader.
     * @param {Buffer} ids Content of objects_ids.json.gz file.
     * @param {Buffer} offsets Content of objects_offs.json.gz file.
     * @param {Buffer} avs Content of objects_avs.json.gz file.
     * @param {Buffer} attrs Content of objects_attrs.json.gz file.
     * @param {Buffer} vals Content of objects_vals.json.gz file.
     */
    constructor(ids: Buffer, offsets: Buffer, avs: Buffer, attrs: Buffer, vals: Buffer);
    /**
     * Enumerates all properties (including internal ones such as "__child__" property
     * establishing the parent-child relationships) of given object.
     * @generator
     * @param {number} id Object ID.
     * @returns {Iterable<{ name: string; category: string; value: any }>} Name, category, and value of each property.
     */
    enumerateProperties(id: number): Iterable<{
        name: string;
        category: string;
        value: any;
    }>;
    /**
     * Finds "public" properties of given object.
     * Additional properties like parent-child relationships are not included in the output.
     * @param {number} id Object ID.
     * @returns {{ [name: string]: any }} Dictionary of property names and values.
     */
    getProperties(id: number): {
        [name: string]: any;
    };
    /**
     * Finds IDs of all children of given object.
     * @param {number} id Object ID.
     * @returns {number[]} Children IDs.
     */
    getChildren(id: number): number[];
}
//# sourceMappingURL=propdb-reader.d.ts.map
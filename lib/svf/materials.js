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
exports.parseMaterials = void 0;
const zlib = __importStar(require("zlib"));
/**
 * Parses materials from a binary buffer, typically stored in a file called 'Materials.json.gz',
 * referenced in the SVF manifest as an asset of type 'ProteinMaterials'.
 * @generator
 * @param {Buffer} buffer Binary buffer to parse.
 * @returns {Iterable<IMaterial | null>} Instances of parsed materials, or null if there are none (or are not supported).
 */
function* parseMaterials(buffer) {
    if (buffer[0] === 31 && buffer[1] === 139) {
        buffer = zlib.gunzipSync(buffer);
    }
    if (buffer.byteLength > 0) {
        const json = JSON.parse(buffer.toString());
        for (const key of Object.keys(json.materials)) {
            const group = json.materials[key];
            const material = group.materials[group.userassets[0]];
            switch (material.definition) {
                case 'SimplePhong':
                    yield parseSimplePhongMaterial(group);
                    break;
                default:
                    console.warn('Unsupported material definition', material.definition);
                    yield null;
                    break;
            }
        }
    }
}
exports.parseMaterials = parseMaterials;
function parseSimplePhongMaterial(group) {
    let result = {};
    const material = group.materials[group.userassets[0]];
    result.diffuse = parseColorProperty(material, 'generic_diffuse', [0, 0, 0, 1]);
    result.specular = parseColorProperty(material, 'generic_specular', [0, 0, 0, 1]);
    result.ambient = parseColorProperty(material, 'generic_ambient', [0, 0, 0, 1]);
    result.emissive = parseColorProperty(material, 'generic_emissive', [0, 0, 0, 1]);
    result.glossiness = parseScalarProperty(material, 'generic_glossiness', 30);
    result.reflectivity = parseScalarProperty(material, 'generic_reflectivity_at_0deg', 0);
    result.opacity = 1.0 - parseScalarProperty(material, 'generic_transparency', 0);
    result.metal = parseBooleanProperty(material, 'generic_is_metal', false);
    if (material.textures) {
        result.maps = {};
        const diffuse = parseTextureProperty(material, group, 'generic_diffuse');
        if (diffuse) {
            result.maps.diffuse = diffuse;
        }
        const specular = parseTextureProperty(material, group, 'generic_specular');
        if (specular) {
            result.maps.specular = specular;
        }
        const alpha = parseTextureProperty(material, group, 'generic_alpha');
        if (alpha) {
            result.maps.alpha = alpha;
        }
        const bump = parseTextureProperty(material, group, 'generic_bump');
        if (bump) {
            if (parseBooleanProperty(material, 'generic_bump_is_normal', false)) {
                result.maps.normal = bump;
            }
            else {
                result.maps.bump = bump;
            }
        }
    }
    return result;
}
function parseBooleanProperty(material, prop, defaultValue) {
    if (material.properties.booleans && prop in material.properties.booleans) {
        return material.properties.booleans[prop];
    }
    else {
        return defaultValue;
    }
}
function parseScalarProperty(material, prop, defaultValue) {
    if (material.properties.scalars && prop in material.properties.scalars) {
        return material.properties.scalars[prop].values[0];
    }
    else {
        return defaultValue;
    }
}
function parseColorProperty(material, prop, defaultValue) {
    if (material.properties.colors && prop in material.properties.colors) {
        const color = material.properties.colors[prop].values[0];
        return [color.r, color.g, color.b, color.a];
    }
    else {
        return defaultValue;
    }
}
function parseTextureProperty(material, group, prop) {
    var _a, _b, _c, _d;
    if (material.textures && prop in material.textures) {
        const connection = material.textures[prop].connections[0];
        const texture = group.materials[connection];
        if (texture && texture.properties.uris && 'unifiedbitmap_Bitmap' in texture.properties.uris) {
            const uri = texture.properties.uris['unifiedbitmap_Bitmap'].values[0];
            // TODO: parse texture transforms aside from scale
            const texture_UScale = (_b = (_a = texture.properties.scalars) === null || _a === void 0 ? void 0 : _a.texture_UScale) === null || _b === void 0 ? void 0 : _b.values[0];
            const texture_VScale = (_d = (_c = texture.properties.scalars) === null || _c === void 0 ? void 0 : _c.texture_VScale) === null || _d === void 0 ? void 0 : _d.values[0];
            /*
            console.log('uri and scale', {
                uri: uri,
                u: texture_UScale,
                v: texture_VScale
            })
            */
            if (uri) {
                return { uri, scale: {
                        texture_UScale,
                        texture_VScale
                    } };
            }
        }
    }
    return null;
}

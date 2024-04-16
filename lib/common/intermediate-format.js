"use strict";
// Intermediate 3D format schema
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialKind = exports.GeometryKind = exports.NodeKind = exports.TransformKind = void 0;
var TransformKind;
(function (TransformKind) {
    TransformKind[TransformKind["Matrix"] = 0] = "Matrix";
    TransformKind[TransformKind["Decomposed"] = 1] = "Decomposed";
})(TransformKind = exports.TransformKind || (exports.TransformKind = {}));
var NodeKind;
(function (NodeKind) {
    NodeKind[NodeKind["Group"] = 0] = "Group";
    NodeKind[NodeKind["Object"] = 1] = "Object";
    NodeKind[NodeKind["Camera"] = 2] = "Camera";
    NodeKind[NodeKind["Light"] = 3] = "Light";
})(NodeKind = exports.NodeKind || (exports.NodeKind = {}));
var GeometryKind;
(function (GeometryKind) {
    GeometryKind[GeometryKind["Mesh"] = 0] = "Mesh";
    GeometryKind[GeometryKind["Lines"] = 1] = "Lines";
    GeometryKind[GeometryKind["Points"] = 2] = "Points";
    GeometryKind[GeometryKind["Empty"] = 3] = "Empty";
})(GeometryKind = exports.GeometryKind || (exports.GeometryKind = {}));
var MaterialKind;
(function (MaterialKind) {
    MaterialKind[MaterialKind["Physical"] = 0] = "Physical";
})(MaterialKind = exports.MaterialKind || (exports.MaterialKind = {}));

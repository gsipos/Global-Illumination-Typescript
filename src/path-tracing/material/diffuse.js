"use strict";
var vector_1 = require('../../general/vector');
var color_1 = require('../../general/color');
var halton_1 = require('../halton');
var constant_1 = require('../constant');
class DiffuseMaterial {
    constructor() {
        this.kd = new color_1.default();
    }
    BRDF() { return this.kd; }
    nextDirection(L, N, V) {
        var u = halton_1.default.UNIFORM(13);
        var v = halton_1.default.UNIFORM(17);
        var theta = Math.asin(Math.sqrt(u));
        var phi = constant_1.default.PI * 2.0 * v;
        var z = vector_1.default.ZUNIT;
        var y = vector_1.default.YUNIT;
        var O = vector_1.default.cross(N, z);
        if (vector_1.default.mag(O) < constant_1.default.EPSILON) {
            O = vector_1.default.cross(N, y);
        }
        O = vector_1.default.norm(O);
        var P = vector_1.default.cross(N, O);
        var toL = vector_1.default.plus(vector_1.default.times(Math.cos(theta), N), vector_1.default.plus(vector_1.default.times(Math.sin(theta) * Math.cos(phi), O), vector_1.default.times(Math.sin(theta) * Math.sin(phi), P)));
        L.assign(toL);
        var prob = Math.cos(theta) / constant_1.default.PI;
        return { direction: toL, probability: prob };
    }
    averageAlbedo() {
        return color_1.default.luminance(this.kd) * constant_1.default.PI;
    }
}
exports.DiffuseMaterial = DiffuseMaterial;
//# sourceMappingURL=diffuse.js.map
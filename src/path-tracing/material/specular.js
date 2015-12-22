"use strict";
var vector_1 = require('../../general/vector');
var color_1 = require('../../general/color');
var halton_1 = require('../halton');
var constant_1 = require('../constant');
class SpecularMaterial {
    constructor() {
        this.ks = new color_1.default();
        this.shine = 1;
    }
    BRDF(L, N, V) {
        var NL = vector_1.default.dot(N, L);
        var R = vector_1.default.minus(vector_1.default.times(NL * 2, N), L);
        var NV = vector_1.default.dot(N, V);
        var max;
        if (NV > NL)
            max = NV;
        else
            max = NL;
        var RVt = Math.abs(vector_1.default.dot(R, V));
        var RV = Math.pow(RVt, this.shine);
        var t = color_1.default.scale(RV / max, this.ks);
        return t;
    }
    nextDirection(L, N, V) {
        var z = vector_1.default.ZUNIT;
        var y = vector_1.default.YUNIT;
        var u = halton_1.default.UNIFORM(7);
        var v = halton_1.default.UNIFORM(11);
        var cosVR = Math.pow(u, 1.0 / (this.shine + 1));
        var sinVR = Math.sqrt(1.0 - (cosVR * cosVR));
        var O = vector_1.default.cross(V, z);
        if (vector_1.default.mag(O) < constant_1.default.EPSILON)
            O = vector_1.default.cross(V, y);
        var P = vector_1.default.cross(O, V);
        var R = vector_1.default.plus(vector_1.default.times(sinVR * Math.cos(2 * constant_1.default.PI * v), O), vector_1.default.plus(vector_1.default.times(sinVR * Math.sin(2 * constant_1.default.PI * v), P), vector_1.default.times(cosVR, V)));
        var toL = vector_1.default.minus(vector_1.default.times(vector_1.default.dot(N, R) * 2.0, N), R);
        L.assign(toL);
        var cosNL = vector_1.default.dot(N, L);
        if (cosNL < 0)
            return { probability: 0 };
        var prob = (this.shine + 2) / (2 * constant_1.default.PI) * Math.pow(cosVR, this.shine);
        return { direction: toL, probability: prob };
    }
    averageAlbedo() {
        return color_1.default.luminance(this.ks) * 2 * constant_1.default.PI / (this.shine + 2);
    }
}
exports.SpecularMaterial = SpecularMaterial;
//# sourceMappingURL=specular.js.map
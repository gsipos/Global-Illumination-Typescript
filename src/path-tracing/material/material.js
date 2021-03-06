"use strict";
var vector_1 = require('../../general/vector');
var color_1 = require('../../general/color');
var constant_1 = require('../constant');
var GeneralMaterial = require('./general-material');
var MaterialModel = GeneralMaterial.MaterialModel;
var diffuse_1 = require('./diffuse');
var specular_1 = require('./specular');
var ideal_refractor_1 = require('./ideal-refractor');
var ideal_reflector_1 = require('./ideal-reflector');
class Material {
    constructor() {
        this.cLe = new color_1.default();
        this.diff = new diffuse_1.default();
        this.spec = new specular_1.default();
        this.refract = new ideal_refractor_1.default();
        this.reflect = new ideal_reflector_1.default();
    }
    Le(V, N) {
        return this.cLe;
    }
    BRDF(L, N, V, selectedModel) {
        var t;
        var p;
        switch (selectedModel) {
            case MaterialModel.DIFFUSE: return this.diff.BRDF();
            case MaterialModel.SPECULAR: return this.spec.BRDF(L, N, V);
            case MaterialModel.REFRACTOR:
                var cost = -1 * vector_1.default.dot(N, L);
                if (cost > constant_1.default.EPSILON)
                    return color_1.default.scale(1 / cost, this.reflect.Kr);
                else
                    return new color_1.default();
            case MaterialModel.REFLECTOR:
                var cost = vector_1.default.dot(N, L);
                if (cost > constant_1.default.EPSILON)
                    return color_1.default.scale(1 / cost, this.reflect.Kr);
                else
                    return new color_1.default();
            case MaterialModel.ALL:
                t = this.diff.BRDF();
                p = this.spec.BRDF(L, N, V);
                t = color_1.default.plus(t, p);
                p = this.BRDF(L, N, V, MaterialModel.REFRACTOR);
                t = color_1.default.plus(t, p);
                return t;
        }
    }
    nextDirection(V, N, L, selectedModel, out) {
        switch (selectedModel) {
            case MaterialModel.DIFFUSE: return this.diff.nextDirection(L, N, V);
            case MaterialModel.SPECULAR: return this.spec.nextDirection(L, N, V);
            case MaterialModel.REFRACTOR: return this.refract.nextDirection(L, N, V, out);
            case MaterialModel.REFLECTOR: return this.reflect.nextDirection(L, N, V);
        }
        return { probability: 0 };
    }
}
exports.Material = Material;
//# sourceMappingURL=material.js.map
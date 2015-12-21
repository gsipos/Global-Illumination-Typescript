define(["require", "exports", '../../general/vector', '../../general/color'], function (require, exports, vector_1, color_1) {
    class IdealReflectorMaterial {
        constructor() {
            this.Kr = new color_1.default();
        }
        nextDirection(L, N, V) {
            var tmp = vector_1.default.minus(vector_1.default.times(vector_1.default.dot(N, V) * 2, N), V);
            L.assign(tmp);
            return { direction: tmp, probability: 1 };
        }
        averageAlbedo() { return color_1.default.luminance(this.Kr); }
    }
    exports.IdealReflectorMaterial = IdealReflectorMaterial;
});
//# sourceMappingURL=ideal-reflector.js.map
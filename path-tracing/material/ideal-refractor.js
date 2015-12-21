define(["require", "exports", '../../general/vector', '../../general/color', '../constant'], function (require, exports, vector_1, color_1, constant_1) {
    class IdealRefractorMaterial {
        constructor() {
            this.Kt = new color_1.default();
            this.Nt = 1;
        }
        nextDirection(L, N, V, out) {
            var cosa = vector_1.default.dot(N, V);
            var cn = out ? this.Nt : 1 / this.Nt;
            var disc = 1 - (1 - cosa * cosa) / (cn * cn);
            if (disc < constant_1.default.EPSILON)
                return { probability: 0 };
            var tempL = vector_1.default.minus(vector_1.default.times(cosa / cn - Math.sqrt(disc), N), vector_1.default.times(1 / cn, V));
            L.assign(vector_1.default.norm(tempL));
            return { direction: tempL.normalize(), probability: 1 };
        }
    }
    exports.IdealRefractorMaterial = IdealRefractorMaterial;
});
//# sourceMappingURL=ideal-refractor.js.map
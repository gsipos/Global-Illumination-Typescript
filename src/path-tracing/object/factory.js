define(["require", "exports", 'general/vector', 'general/color', 'path-tracing/material/material', 'path-tracing/object/plane', 'path-tracing/object/sphere'], function (require, exports, vector_1, color_1, material_1, plane_1, sphere_1) {
    (function (Directions) {
        Directions[Directions["UP"] = 0] = "UP";
        Directions[Directions["DOWN"] = 1] = "DOWN";
        Directions[Directions["FORWARD"] = 2] = "FORWARD";
        Directions[Directions["BACKWARD"] = 3] = "BACKWARD";
        Directions[Directions["RIGHT"] = 4] = "RIGHT";
        Directions[Directions["LEFT"] = 5] = "LEFT";
    })(exports.Directions || (exports.Directions = {}));
    var Directions = exports.Directions;
    class Factory {
        per2(a, b) {
            return (a + b) * 0.5;
        }
        createPlane(min, max, dir, mat) {
            var plane = new plane_1.default();
            plane.min = min;
            plane.max = max;
            plane.mat = mat;
            switch (dir) {
                case Directions.UP:
                    plane.normal = new vector_1.default(0, 0, 1);
                    plane.pnull = new vector_1.default(this.per2(max.x, min.x), this.per2(max.y, min.y), min.z);
                    break;
                case Directions.DOWN:
                    plane.normal = new vector_1.default(0, 0, -1);
                    plane.pnull = new vector_1.default(this.per2(max.x, min.x), this.per2(max.y, min.y), min.z);
                    break;
                case Directions.LEFT:
                    plane.normal = new vector_1.default(1, 0, 0);
                    plane.pnull = new vector_1.default(min.x, this.per2(max.y, min.y), this.per2(max.z, min.z));
                    break;
                case Directions.RIGHT:
                    plane.normal = new vector_1.default(-1, 0, 0);
                    plane.pnull = new vector_1.default(min.x, this.per2(max.y, min.y), this.per2(max.z, min.z));
                    break;
                case Directions.FORWARD:
                    plane.normal = new vector_1.default(0, -1, 0);
                    plane.pnull = new vector_1.default(this.per2(max.x, min.x), min.y, this.per2(max.z, min.z));
                    break;
                case Directions.BACKWARD:
                    plane.normal = new vector_1.default(0, 1, 0);
                    plane.pnull = new vector_1.default(this.per2(max.x, min.x), min.y, this.per2(max.z, min.z));
                    break;
            }
            plane.D();
            return plane;
        }
        createSphere(position, radius, mat) {
            var sphere = new sphere_1.default();
            sphere.pos = position;
            sphere.rad = radius;
            sphere.mat = mat;
            return sphere;
        }
        createMatGlass() {
            var mat = new material_1.default();
            mat.diff.kd = new color_1.default(0.0, 0.0, 0.0);
            mat.spec.ks = new color_1.default(2.0, 2.0, 2.0);
            mat.spec.shine = 50;
            mat.refract.Kt = new color_1.default(0.7, 0.7, 0.7);
            mat.reflect.Kr = new color_1.default(0.3, 0.3, 0.3);
            mat.refract.Nt = 1.52;
            return mat;
        }
        createMatMirror() {
            var mat = new material_1.default();
            mat.diff.kd = new color_1.default(0.1, 0.1, 0.1);
            mat.spec.ks = new color_1.default(2.0, 2.0, 2.0);
            mat.spec.shine = 200;
            mat.refract.Kt = new color_1.default(0.0, 0.0, 0.0);
            mat.reflect.Kr = new color_1.default(1.0, 1.0, 1.0);
            mat.refract.Nt = 1.52;
            return mat;
        }
        createMatGreyDiffuse() {
            var mat = new material_1.default();
            mat.diff.kd = new color_1.default(0.3, 0.3, 0.3);
            mat.spec.ks = new color_1.default(1.0, 1.0, 1.0);
            mat.spec.shine = 100;
            mat.refract.Kt = new color_1.default(0.0, 0.0, 0.0);
            mat.reflect.Kr = new color_1.default(0.0, 0.0, 0.0);
            mat.refract.Nt = 1.52;
            return mat;
        }
        createLight(c, energy) {
            var mat = new material_1.default();
            mat.diff.kd = c;
            mat.spec.ks = c;
            mat.cLe = color_1.default.scale(energy, c);
            mat.spec.shine = 500;
            mat.reflect.Kr = new color_1.default(0.0, 0.0, 0.0);
            mat.refract.Kt = new color_1.default(0.0, 0.0, 0.0);
            mat.refract.Nt = 1.5;
            return mat;
        }
    }
    exports.Factory = Factory;
});
//# sourceMappingURL=factory.js.map
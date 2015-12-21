define(["require", "exports", 'general/vector', 'path-tracing/constant', 'path-tracing/object/scene-object'], function (require, exports, vector_1, constant_1, SceneObj) {
    var IntersectionPoint = SceneObj.Intersection.Point;
    var IntersectionResult = SceneObj.Intersection.Result;
    class Sphere {
        getRandomOffset() {
            return 2 * this.rad * Math.random() - this.rad;
        }
        getDiscriminant(A, B, C) {
            return B * B - 4 * A * C;
        }
        intersect(r) {
            var A = r.directionSquared;
            var op = vector_1.default.minus(r.origin, this.pos);
            var B = 2 * vector_1.default.dot(r.direction, op);
            var C = vector_1.default.dot(op, op) - this.rad * this.rad;
            var D = this.getDiscriminant(A, B, C);
            if (D < 0)
                return IntersectionResult.FAILED;
            var sqrtD = Math.sqrt(D);
            var denominator = 1 / 2 * A;
            var t1 = (-B - sqrtD) * denominator;
            var tt;
            if (t1 > 0)
                tt = t1;
            else
                tt = (-B + sqrtD) * denominator;
            if (tt < constant_1.default.EPSILON)
                return IntersectionResult.FAILED;
            var hitpoint = r.getPointOnRay(tt);
            var normal = vector_1.default.times(1 / this.rad, vector_1.default.minus(hitpoint, this.pos));
            return new IntersectionResult(true, tt, new IntersectionPoint(hitpoint, normal, this.mat, this));
        }
        getRandomSurfacePoint() {
            return new vector_1.default(this.pos.x + this.getRandomOffset(), this.pos.y + this.getRandomOffset(), this.pos.z + this.getRandomOffset());
        }
    }
    exports.Sphere = Sphere;
});
//# sourceMappingURL=sphere.js.map
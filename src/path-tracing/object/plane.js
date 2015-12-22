var vector_1 = require('../../general/vector');
var constant_1 = require('../constant');
var SceneObj = require('./scene-object');
var IntersectionPoint = SceneObj.Intersection.Point;
var IntersectionResult = SceneObj.Intersection.Result;
class Plane {
    intersect(r) {
        var denominator = vector_1.default.dot(this.normal, r.direction);
        if (Math.abs(denominator) < constant_1.default.EPSILON)
            return IntersectionResult.FAILED;
        var numerator = -1 * (vector_1.default.dot(this.normal, r.origin) + this.sd);
        var temp = numerator / denominator;
        if (temp < constant_1.default.EPSILON)
            return IntersectionResult.FAILED;
        var hitPoint = r.getPointOnRay(temp);
        var v1 = vector_1.default.minus(hitPoint, this.min);
        var v2 = vector_1.default.minus(hitPoint, this.max);
        if ((hitPoint.x < this.min.x) && (Math.abs(v1.x) > constant_1.default.EPSILON))
            return IntersectionResult.FAILED;
        if ((hitPoint.y < this.min.y) && (Math.abs(v1.y) > constant_1.default.EPSILON))
            return IntersectionResult.FAILED;
        if ((hitPoint.z < this.min.z) && (Math.abs(v1.z) > constant_1.default.EPSILON))
            return IntersectionResult.FAILED;
        if ((hitPoint.x > this.max.x) && (Math.abs(v2.x) > constant_1.default.EPSILON))
            return IntersectionResult.FAILED;
        if ((hitPoint.y > this.max.y) && (Math.abs(v2.y) > constant_1.default.EPSILON))
            return IntersectionResult.FAILED;
        if ((hitPoint.z > this.max.z) && (Math.abs(v2.z) > constant_1.default.EPSILON))
            return IntersectionResult.FAILED;
        return new IntersectionResult(true, temp, new IntersectionPoint(hitPoint, this.normal, this.mat, this));
    }
    getRandomSurfacePoint() {
        var u = Math.random();
        var v = Math.random();
        var i = new vector_1.default(this.min.x + (this.max.x - this.min.x) * u, this.min.y + (this.max.y - this.min.y) * v, this.pnull.z);
        return i;
    }
    D() {
        this.sd = (-1.0 * this.normal.x * this.pnull.x - this.normal.y * this.pnull.y - this.normal.z * this.pnull.z);
        return this.sd;
    }
}
exports.Plane = Plane;
//# sourceMappingURL=plane.js.map
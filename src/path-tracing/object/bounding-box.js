var vector_1 = require('../../general/vector');
var SceneObj = require('./scene-object');
var IntersectionResult = SceneObj.Intersection.Result;
class BoundingBox {
    constructor(v1, v2) {
        this.innerObjects = [];
        this.parameters = [];
        this.parameters = [v1, v2];
    }
    boxIntersect(r, t0, t1) {
        var tmin = (this.parameters[r.sign[0]].x - r.origin.x) * r.invDirection.x;
        var tmax = (this.parameters[1 - r.sign[0]].x - r.origin.x) * r.invDirection.x;
        var tymin = (this.parameters[r.sign[1]].y - r.origin.y) * r.invDirection.y;
        var tymax = (this.parameters[1 - r.sign[1]].y - r.origin.y) * r.invDirection.y;
        if ((tmin > tymax) || (tymin > tmax))
            return false;
        if (tymin > tmin)
            tmin = tymin;
        if (tymax < tmax)
            tmax = tymax;
        var tzmin = (this.parameters[r.sign[2]].z - r.origin.z) * r.invDirection.z;
        var tzmax = (this.parameters[1 - r.sign[2]].z - r.origin.z) * r.invDirection.z;
        if ((tmin > tzmax) || (tzmin > tmax))
            return false;
        if (tzmin > tmin)
            tmin = tzmin;
        if (tzmax < tmax)
            tmax = tzmax;
        return ((tmin < t1) && (tmax > t0));
    }
    intersect(r) {
        if (!this.boxIntersect(r, 0.0, 1000.0))
            return IntersectionResult.FAILED;
        if (this.innerObjects.length === 0)
            return IntersectionResult.FAILED;
        var min;
        var interSections = this.innerObjects.map(object => object.intersect(r));
        interSections.forEach(result => {
            if (result.success && min && result.distance < min.distance) {
                min = result;
            }
        });
        if (min)
            return min;
        else
            return IntersectionResult.FAILED;
    }
    getRandomSurfacePoint() { return new vector_1.default(); }
}
exports.BoundingBox = BoundingBox;
//# sourceMappingURL=bounding-box.js.map
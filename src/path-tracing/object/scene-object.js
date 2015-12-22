var Intersection;
(function (Intersection) {
    class Result {
        constructor(success, distance, point) {
            this.success = success;
            this.distance = distance;
            this.point = point;
        }
    }
    Result.FAILED = new Result(false, 1000000);
    Intersection.Result = Result;
    class Point {
        constructor(hp, normal, material, object) {
            this.hp = hp;
            this.normal = normal;
            this.material = material;
            this.object = object;
        }
    }
    Intersection.Point = Point;
})(Intersection = exports.Intersection || (exports.Intersection = {}));
//# sourceMappingURL=scene-object.js.map
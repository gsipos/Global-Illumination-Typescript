var vector_1 = require('../general/vector');
class Ray {
    constructor(origin = new vector_1.default(), direction = new vector_1.default()) {
        this.origin = origin;
        this.direction = direction;
        this.sign = [];
        this.calcParams();
    }
    calcParams() {
        this.invDirection = new vector_1.default(1 / this.direction.x, 1 / this.direction.y, 1 / this.direction.z);
        this.sign[0] = this.invDirection.x < 0 ? 1 : 0;
        this.sign[1] = this.invDirection.y < 0 ? 1 : 0;
        this.sign[2] = this.invDirection.z < 0 ? 1 : 0;
        this.directionSquared = vector_1.default.dot(this.direction, this.direction);
    }
    getPointOnRay(distance) {
        return vector_1.default.plus(this.origin, vector_1.default.times(distance, this.direction));
    }
}
exports.Ray = Ray;
//# sourceMappingURL=ray.js.map
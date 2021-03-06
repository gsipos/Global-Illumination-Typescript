var vector_1 = require('../../general/vector');
var ray_1 = require('../ray');
var halton_1 = require('../halton');
class Camera {
    init() {
        this.dx = ((this.picmax.x - this.picmin.x) / this.width);
        this.dz = ((this.picmax.z - this.picmin.z) / this.height);
    }
    getray(i, j) {
        var casted = new ray_1.default(this.eye);
        var u = halton_1.default.UNIFORM(2);
        var v = halton_1.default.UNIFORM(3);
        var picPoint = new vector_1.default(this.picmin.x + this.dx * j + this.dx * u, this.picmin.y, this.picmin.z + this.dz * i + this.dz * v);
        casted.direction = vector_1.default.minus(picPoint, this.eye);
        casted.direction = vector_1.default.norm(casted.direction);
        casted.calcParams();
        return casted;
    }
}
exports.Camera = Camera;
//# sourceMappingURL=camera.js.map
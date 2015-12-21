import Vector from 'general/vector';
import Ray from 'path-tracing/ray';
import Halton from 'path-tracing/halton';

export default class Camera {
    private dx: number;
    private dz: number;

    public eye: Vector;
    public picmin: Vector;
    public picmax: Vector;
    public width: number;
    public height: number;

    public init() {
        this.dx = ((this.picmax.x - this.picmin.x) / this.width);
        this.dz = ((this.picmax.z - this.picmin.z) / this.height);
    }

    public getray(i: number, j: number): Ray {
        var casted: Ray = new Ray(this.eye);
        var u = Halton.UNIFORM(2);
        var v = Halton.UNIFORM(3);
        var picPoint: Vector = new Vector(
            this.picmin.x + this.dx * j + this.dx * u,
            this.picmin.y,
            this.picmin.z + this.dz * i + this.dz * v);
        casted.direction = Vector.minus(picPoint, this.eye);
        casted.direction = Vector.norm(casted.direction);
        casted.calcParams();
        return casted;
    }
}
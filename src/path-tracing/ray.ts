"use strict";
import Vector from '../general/vector';

export default class Ray {
    public invDirection: Vector;
    public directionSquared: number;
    public sign: number[] = [];
    constructor(public origin: Vector = new Vector(), public direction: Vector = new Vector()) {
        this.calcParams();
    }

    public calcParams() {
        this.invDirection = new Vector(1 / this.direction.x, 1 / this.direction.y, 1 / this.direction.z);
        this.sign[0] = this.invDirection.x < 0 ? 1 : 0;
        this.sign[1] = this.invDirection.y < 0 ? 1 : 0;
        this.sign[2] = this.invDirection.z < 0 ? 1 : 0;
        this.directionSquared = Vector.dot(this.direction, this.direction);
    }

    public getPointOnRay(distance: number): Vector {
        return Vector.plus(this.origin, Vector.times(distance, this.direction));
    }
}
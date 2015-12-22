"use strict";
import Vector from '../../general/vector';
import Color from '../../general/color';
import Ray from '../ray';
import Constant from '../constant';
import Halton from '../halton';

import Material from '../material/material';

import * as SceneObj from './scene-object';
import IntersectionPoint = SceneObj.Intersection.Point;
import IntersectionResult = SceneObj.Intersection.Result;
import SceneObject = SceneObj.SceneObject;

export default class Sphere implements SceneObject {
    public mat: Material;
    public pos: Vector;
    public rad: number;

    private getRandomOffset() {
        return 2 * this.rad * Math.random() - this.rad;
    }

    private getDiscriminant(A, B, C): number {
        return B * B - 4 * A * C;
    }

    public intersect(r: Ray): IntersectionResult {
        var A = r.directionSquared;
        var op = Vector.minus(r.origin, this.pos);
        var B = 2 * Vector.dot(r.direction, op);
        var C = Vector.dot(op, op) - this.rad * this.rad;
        var D = this.getDiscriminant(A, B, C);
        if (D < 0) return IntersectionResult.FAILED;
        var sqrtD = Math.sqrt(D);
        var denominator = 1 / 2 * A;
        var t1 = (-B - sqrtD) * denominator;
        var tt;
        if (t1 > 0) tt = t1;
        else tt = (-B + sqrtD) * denominator;

        if (tt < Constant.EPSILON) return IntersectionResult.FAILED;

        var hitpoint = r.getPointOnRay(tt);
        var normal = Vector.times(1 / this.rad, Vector.minus(hitpoint, this.pos));

        return new IntersectionResult(true, tt, new IntersectionPoint(hitpoint, normal, this.mat, this));
    }

    public getRandomSurfacePoint() {
        return new Vector(
            this.pos.x + this.getRandomOffset(),
            this.pos.y + this.getRandomOffset(),
            this.pos.z + this.getRandomOffset()
        );
    }
}

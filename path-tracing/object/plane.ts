import Vector from 'general/vector';
import Color from 'general/color';
import Ray from 'path-tracing/ray';
import Constant from 'path-tracing/constant';
import Halton from 'path-tracing/halton';

import Material from 'path-tracing/material/material';

import * as SceneObj from 'path-tracing/object/scene-object';
import IntersectionPoint = SceneObj.Intersection.Point;
import IntersectionResult = SceneObj.Intersection.Result;
import SceneObject = SceneObj.SceneObject;

export default class Plane implements SceneObject {
    private sd: number;

    public mat: Material;
    public normal: Vector;
    public pnull: Vector;
    public min: Vector;
    public max: Vector;

    public intersect(r: Ray): IntersectionResult {
        var denominator = Vector.dot(this.normal, r.direction);
        if (Math.abs(denominator) < Constant.EPSILON) return IntersectionResult.FAILED;

        var numerator = -1 * (Vector.dot(this.normal, r.origin) + this.sd);

        var temp = numerator / denominator;
        if (temp < Constant.EPSILON) return IntersectionResult.FAILED;

        var hitPoint = r.getPointOnRay(temp);

        var v1 = Vector.minus(hitPoint, this.min);
        var v2 = Vector.minus(hitPoint, this.max);
        if ((hitPoint.x < this.min.x) && (Math.abs(v1.x) > Constant.EPSILON)) return IntersectionResult.FAILED;
        if ((hitPoint.y < this.min.y) && (Math.abs(v1.y) > Constant.EPSILON)) return IntersectionResult.FAILED;
        if ((hitPoint.z < this.min.z) && (Math.abs(v1.z) > Constant.EPSILON)) return IntersectionResult.FAILED;
        if ((hitPoint.x > this.max.x) && (Math.abs(v2.x) > Constant.EPSILON)) return IntersectionResult.FAILED;
        if ((hitPoint.y > this.max.y) && (Math.abs(v2.y) > Constant.EPSILON)) return IntersectionResult.FAILED;
        if ((hitPoint.z > this.max.z) && (Math.abs(v2.z) > Constant.EPSILON)) return IntersectionResult.FAILED;

        return new IntersectionResult(true, temp, new IntersectionPoint(hitPoint, this.normal, this.mat, this));
    }

    public getRandomSurfacePoint(): Vector {
        var u = Math.random();
        var v = Math.random();
        var i: Vector = new Vector(
            this.min.x + (this.max.x - this.min.x) * u,
            this.min.y + (this.max.y - this.min.y) * v,
            this.pnull.z);
        return i;
    }

    public D() {
        this.sd = (-1.0 * this.normal.x * this.pnull.x - this.normal.y * this.pnull.y - this.normal.z * this.pnull.z);
        return this.sd;
    }
}
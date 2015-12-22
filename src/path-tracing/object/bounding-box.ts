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

export default class BoundingBox implements SceneObject {
    public mat: Material;
    public innerObjects: SceneObject[] = [];
    public parameters: Vector[] = [];

    constructor(v1: Vector, v2: Vector) {
        this.parameters = [v1, v2];
    }

    public boxIntersect(r: Ray, t0: number, t1: number): boolean {
        var tmin = (this.parameters[r.sign[0]].x - r.origin.x) * r.invDirection.x;
        var tmax = (this.parameters[1 - r.sign[0]].x - r.origin.x) * r.invDirection.x;
        var tymin = (this.parameters[r.sign[1]].y - r.origin.y) * r.invDirection.y;
        var tymax = (this.parameters[1 - r.sign[1]].y - r.origin.y) * r.invDirection.y;

        if ((tmin > tymax) || (tymin > tmax)) return false;
        if (tymin > tmin) tmin = tymin;
        if (tymax < tmax) tmax = tymax;

        var tzmin = (this.parameters[r.sign[2]].z - r.origin.z) * r.invDirection.z;
        var tzmax = (this.parameters[1 - r.sign[2]].z - r.origin.z) * r.invDirection.z;

        if ((tmin > tzmax) || (tzmin > tmax)) return false;
        if (tzmin > tmin) tmin = tzmin;
        if (tzmax < tmax) tmax = tzmax;
        return ((tmin < t1) && (tmax > t0));
    }

    public intersect(r: Ray): IntersectionResult {
        if (!this.boxIntersect(r, 0.0, 1000.0)) return IntersectionResult.FAILED;
        if (this.innerObjects.length === 0) return IntersectionResult.FAILED;

        var min: IntersectionResult;
        var interSections = this.innerObjects.map<IntersectionResult>(object => object.intersect(r));
        interSections.forEach(result => {
            if (result.success && min && result.distance < min.distance) {
                min = result;
            }
        });
        if (min) return min;
        else return IntersectionResult.FAILED;
    }

    getRandomSurfacePoint() { return new Vector(); }
}
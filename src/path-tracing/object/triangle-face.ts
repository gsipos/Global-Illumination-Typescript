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

export default class TriangleFace implements SceneObject {
    
    constructor(
        public A: Vector,
        public B: Vector,
        public C: Vector,
        public mat: Material
    ) { }

    public intersect(r: Ray): IntersectionResult {
        var edgeU = this.edgeU;
        var edgeV = this.edgeV;
        var triangleNormal = this.normal;
        
        if (triangleNormal === new Vector()) return IntersectionResult.FAILED;
        
        var w0 = Vector.minus(r.origin, this.A);
        var a = - Vector.dot(triangleNormal, w0);
        var b = Vector.dot(triangleNormal, r.direction);
        
        if (Math.abs(b) < Constant.EPSILON) return IntersectionResult.FAILED;
        
        var t = a / b;
        if (t < Constant.EPSILON) return IntersectionResult.FAILED;
        
        var hitpoint = r.getPointOnRay(t);
        
        var uu = Vector.dot(edgeU, edgeU);
        var uv = Vector.dot(edgeU, edgeV);
        var vv = Vector.dot(edgeV, edgeV);
        
        var w = Vector.minus(hitpoint, this.A);
        var wu = Vector.dot(w, edgeU);
        var wv = Vector.dot(w, edgeV);
        var D = uv * uv - uu * vv;
        var s = (uv * wv - vv * wu) / D;
        if (s < 0.0 || s > 1.0) return IntersectionResult.FAILED;
        var t2 = (uv * wu - uu * wv) / D;
        if (t2 < 0.0 || (s + t) > 1.0) return IntersectionResult.FAILED;
        
        return new IntersectionResult(true, t, new IntersectionPoint(hitpoint, triangleNormal, this.mat, this));
    }

    public getRandomSurfacePoint() {
        return new Vector(); //Only for light sources
    }
    
    public get edgeU() { return Vector.minus(this.B, this.A); }
    public get edgeV() { return Vector.minus(this.C, this.A); }
    public get normal() { return Vector.cross(this.edgeU, this.edgeV); }
}
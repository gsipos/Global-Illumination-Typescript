import Vector from 'general/vector';
import Color from 'general/color';

import Ray from 'path-tracing/ray';
import Constant from 'path-tracing/constant';

import Material from 'path-tracing/material/material';

import * as SceneObj from 'path-tracing/object/scene-object';
import SceneObject = SceneObj.SceneObject;

import Plane from 'path-tracing/object/plane';
import Sphere from 'path-tracing/object/sphere';
import BoundingBox from 'path-tracing/object/bounding-box';

export enum Directions {
    UP,
    DOWN,
    FORWARD,
    BACKWARD,
    RIGHT,
    LEFT
}

export default class Factory {
    private per2(a, b) {
        return (a + b) * 0.5;
    }

    public createPlane(min: Vector, max: Vector, dir: Directions, mat: Material) {
        var plane = new Plane();
        plane.min = min;
        plane.max = max;
        plane.mat = mat;

        switch (dir) {
            case Directions.UP:
                plane.normal = new Vector(0, 0, 1);
                plane.pnull = new Vector(this.per2(max.x, min.x), this.per2(max.y, min.y), min.z);
                break;
            case Directions.DOWN:
                plane.normal = new Vector(0, 0, -1);
                plane.pnull = new Vector(this.per2(max.x, min.x), this.per2(max.y, min.y), min.z);
                break;
            case Directions.LEFT:
                plane.normal = new Vector(1, 0, 0);
                plane.pnull = new Vector(min.x, this.per2(max.y, min.y), this.per2(max.z, min.z));
                break;
            case Directions.RIGHT:
                plane.normal = new Vector(-1, 0, 0);
                plane.pnull = new Vector(min.x, this.per2(max.y, min.y), this.per2(max.z, min.z));
                break;
            case Directions.FORWARD:
                plane.normal = new Vector(0, -1, 0);
                plane.pnull = new Vector(this.per2(max.x, min.x), min.y, this.per2(max.z, min.z));
                break;
            case Directions.BACKWARD:
                plane.normal = new Vector(0, 1, 0);
                plane.pnull = new Vector(this.per2(max.x, min.x), min.y, this.per2(max.z, min.z));
                break;
        }
        plane.D();
        return plane;

    }

    public createSphere(position: Vector, radius: number, mat: Material): Sphere {
        var sphere = new Sphere();
        sphere.pos = position;
        sphere.rad = radius;
        sphere.mat = mat;
        return sphere;
    }

    public createMatGlass() {
        var mat = new Material();
        mat.diff.kd = new Color(0.0, 0.0, 0.0);
        mat.spec.ks = new Color(2.0, 2.0, 2.0);
        mat.spec.shine = 50;
        mat.refract.Kt = new Color(0.7, 0.7, 0.7);
        mat.reflect.Kr = new Color(0.3, 0.3, 0.3);
        mat.refract.Nt = 1.52;
        return mat;
    }

    public createMatMirror() {
        var mat = new Material();
        mat.diff.kd = new Color(0.1, 0.1, 0.1);
        mat.spec.ks = new Color(2.0, 2.0, 2.0);
        mat.spec.shine = 200;
        mat.refract.Kt = new Color(0.0, 0.0, 0.0);
        mat.reflect.Kr = new Color(1.0, 1.0, 1.0);
        mat.refract.Nt = 1.52;
        return mat;
    }

    public createMatGreyDiffuse() {
        var mat = new Material();
        mat.diff.kd = new Color(0.3, 0.3, 0.3);
        mat.spec.ks = new Color(1.0, 1.0, 1.0);
        mat.spec.shine = 100;
        mat.refract.Kt = new Color(0.0, 0.0, 0.0);
        mat.reflect.Kr = new Color(0.0, 0.0, 0.0);
        mat.refract.Nt = 1.52;
        return mat;
    }

    public createLight(c: Color, energy: number) {
        var mat = new Material();
        mat.diff.kd = c;
        mat.spec.ks = c;
        mat.cLe = Color.scale(energy, c);
        mat.spec.shine = 500;
        mat.reflect.Kr = new Color(0.0, 0.0, 0.0);
        mat.refract.Kt = new Color(0.0, 0.0, 0.0);
        mat.refract.Nt = 1.5;
        return mat;
    }
}

import Vector from '../../general/vector';
import Color from '../../general/color';
import Ray from '../ray';
import Constant from '../constant';
import Halton from '../halton';

import Material from '../material/material';

import * as SceneObj from './scene-object';

export interface SceneObject {
    mat: Material;
    intersect(r: Ray): Intersection.Result;
    getRandomSurfacePoint(): Vector;
}

export namespace Intersection {
    export class Result {
        constructor(
            public success: boolean,
            public distance?: number,
            public point?: Point
        ) { }

        public static FAILED = new Result(false, 1000000);
    }

    export class Point {
        constructor(
            public hp: Vector,
            public normal: Vector,
            public material: Material,
            public object: SceneObject) { }
    }
}
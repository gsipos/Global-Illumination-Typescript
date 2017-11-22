"use strict";
import * as fs from 'fs';
//import parseObj from 'parse-obj';

import Vector from '../../general/vector';
import Ray from '../ray';
import Constant from '../constant';

import Material from '../material/material';

import * as SceneObj from './scene-object';
import IntersectionPoint = SceneObj.Intersection.Point;
import IntersectionResult = SceneObj.Intersection.Result;
import SceneObject = SceneObj.SceneObject;
import TriangleFace from './triangle-face';

interface ObjResult {
    vertexPositions: number[][];
    facePositions: number[][];
}

declare var parseObj; // TODO

export default class Mesh {
    public mat: Material;
    public position: Vector = new Vector(150,150,150);
    public scale: Vector = new Vector(1,1,1);


    public vertices: Vector[] = [];
    public faces: number[][] = [];
    public triangles: TriangleFace[] = [];

    public loadFromObj(filePath: string) {
        parseObj(fs.createReadStream(filePath), (err: string, result: ObjResult) => {
            if (err) {
                throw new Error("Error parsing OBJ file" + err);
            }
            this.processObj(result);
        })
    }

    private processObj(result: ObjResult) {
        this.faces = result.facePositions;

        this.vertices = result.vertexPositions.map(v => new Vector(v[0], v[1], v[2]));
        this.vertices.forEach(v => v.scale(this.scale).add(this.position));

        this.triangles = this.faces.map(face => new TriangleFace(this.vertices[face[0]], this.vertices[face[1]], this.vertices[face[2]], this.mat));
    }
}
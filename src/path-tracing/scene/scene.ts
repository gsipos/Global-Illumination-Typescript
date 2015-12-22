import Vector from '../../general/vector';
import Color from '../../general/color';

import Ray from '../ray';
import Constant from '../constant';
import Halton from '../halton';

import * as GeneralMaterial from '../material/general-material';
import BRDFSample = GeneralMaterial.BRDFSample;
import MaterialModel = GeneralMaterial.MaterialModel;

import Material from '../material/material';

import * as SceneObj from '../object/scene-object';
import IntersectionPoint = SceneObj.Intersection.Point;
import IntersectionResult = SceneObj.Intersection.Result;
import SceneObject = SceneObj.SceneObject;

import Plane from '../object/plane';
import Sphere from '../object/sphere';
import BoundingBox from '../object/bounding-box';

import Camera from './camera';

interface SelectedBRDFModel {
    model: MaterialModel;
    prob: number;
}

export class PixelSample {
    public color: Color = new Color();
    public sampleCount: number = 0;

    public add(pix: PixelSample) {
        this.color = Color.plus(this.color, pix.color);
        this.sampleCount += pix.sampleCount;
    }
}

export default class Scene {
    public maxTraceDepht: number;
    public lightSamples: number;
    public gatherWalks: number;
    public rawData: PixelSample[][] = [];
    public imageData: Color[][] = [];
    public camera: Camera = new Camera();
    public world: SceneObject[] = [];
    public lightSources: SceneObject[] = [];

    public lineProgress: number = 0;
    public gatherProgress: number = 0;
    public rowsToRender: number;

    constructor(height: number, width: number) {
        for (var i = 0; i < height; i++) {
            this.rawData[i] = [];
            this.imageData[i] = [];
            for (var j = 0; j < width; j++) {
                this.rawData[i][j] = new PixelSample();
                this.imageData[i][j] = new Color();
            }
        }
    }

    private selectBRDFModel(mat: Material): SelectedBRDFModel {
        var prob = Halton.UNIFORM(5);

        var ad = mat.diff.averageAlbedo();
        var as = mat.spec.averageAlbedo();
        var at = Color.luminance(mat.refract.Kt);
        var ar = Color.luminance(mat.reflect.Kr);

        prob -= ad;
        if (prob < 0.0) return { model: MaterialModel.DIFFUSE, prob: ad };
        prob -= as;
        if (prob < 0.0) return { model: MaterialModel.SPECULAR, prob: as };
        prob -= at;
        if (prob < 0.0) return { model: MaterialModel.REFRACTOR, prob: at };
        prob -= ar;
        if (prob < 0.0) return { model: MaterialModel.REFLECTOR, prob: ar };

        return { model: MaterialModel.NONE, prob: 0 };
    }

    private BRDFSampling(V: Vector, N: Vector, mat: Material, out: boolean): BRDFSample {
        var selectedModel = this.selectBRDFModel(mat);
        if (selectedModel.prob < Constant.EPSILON) return { direction: null, probability: 0, materialModel: selectedModel.model };
        var dirProp = mat.nextDirection(V, N, new Vector(), selectedModel.model, out);
        dirProp.probability *= selectedModel.prob;
        return { direction: dirProp.direction, probability: dirProp.probability * selectedModel.prob, materialModel: selectedModel.model, inAir: dirProp.inAir };
    }

    private shadowIntersect(r: Ray, p: number): boolean {
        return this.world.some(object => {
            var result = object.intersect(r);
            return result.success && result.distance < p;
        });
    }

    private directLightSource(p: IntersectionPoint, out: Vector): Color {
        p.normal.normalize();
        var s: Color = new Color();
        this.lightSources.forEach((object, index) => {
            var c: Color = new Color();
            for (var i = 0; i < this.lightSamples; i++) {
                var inVector = object.getRandomSurfacePoint();
                var shadowRay = new Ray(p.hp, Vector.norm(Vector.minus(inVector, p.hp)));
                var lightIntersect = object.intersect(shadowRay);

                if (!this.shadowIntersect(shadowRay, lightIntersect.distance)) {
                    var cost = Vector.dot(p.normal, shadowRay.direction);
                    if (cost > Constant.EPSILON) {
                        var w: Color = p.material.BRDF(shadowRay.direction, p.normal, out, MaterialModel.ALL);
                        var le = object.mat.cLe;
                        var c = Color.plus(Color.times(Color.scale(cost, w), le), c);
                    }
                }

            }
            c = Color.scale(1 / this.lightSamples, c);
            s = Color.plus(c, s);
        });
        return Color.scale(1 / this.lightSources.length, s);
    }

    private firstIntersect(ray: Ray): IntersectionResult {
        var minResult: IntersectionResult;

        this.world.forEach(object => {
            var aktResult = object.intersect(ray);
            if (aktResult.success && minResult && aktResult.distance < minResult.distance || !minResult) minResult = aktResult;
        });

        if (minResult) {
            return minResult;
        }
        return IntersectionResult.FAILED;
    }

    private trace(ray: Ray, d: number): Color {
        var color: Color = new Color();
        if (d > this.maxTraceDepht) return color;

        //var out = true;
        var firstIntersect = this.firstIntersect(ray);
        if (firstIntersect.success) {
            var hp = firstIntersect.point;
            hp.normal.normalize();
            ray.direction.normalize();
            var negDirection = Vector.times(-1, ray.direction);
            if (Vector.dot(hp.normal, negDirection) < 0) {
                hp.normal = Vector.times(-1, hp.normal);
            }
            if (d === 0) {
                color = hp.material.Le(negDirection, hp.normal);
            }

            var c = this.directLightSource(hp, negDirection);
            color = Color.plus(color, Color.legalize(c));
            var brdfSample = this.BRDFSampling(negDirection, hp.normal, hp.material, true);
            if (brdfSample.probability < Constant.EPSILON) return color;
            var newray = new Ray(hp.hp, brdfSample.direction.normalize());
            var cost = Vector.dot(hp.normal, newray.direction);
            if (cost < 0) cost = -cost;
            if (cost > Constant.EPSILON) {
                var w = hp.material.BRDF(newray.direction, hp.normal, negDirection, brdfSample.materialModel);
                w = Color.scale(cost, w);
                if (Color.luminance(w) > Constant.EPSILON) {
                    var tr = this.trace(newray, d + 1);
                    var inv_prob = 1 / brdfSample.probability;
                    color = Color.plus(color, Color.scale(inv_prob, Color.times(tr, w)));
                }
            }
        }
        return Color.legalize(color);
    }



    public getRowsToRender(): RowsToRender {
        var from, to;
        var stold = this.lineProgress;

        if (this.gatherProgress < this.gatherWalks) {
            if (this.lineProgress < this.camera.height) {
                this.lineProgress += this.rowsToRender;
                from = stold;
                to = stold + this.rowsToRender;
            } else {
                this.gatherProgress++;
                this.lineProgress = this.rowsToRender;
                from = 0;
                to = this.rowsToRender;
                console.info(this.gatherProgress, " / ", this.gatherWalks);
            }
            return { from: from, to: to, renderRows: true };
        }
        return { renderRows: false };
    }

    public renderFromTo(from, to) {
        for (var i = from; i < to; i++) {
            for (var j = 0; j < this.camera.width; j++) {
                var casted = this.camera.getray(i, j);
                var sample = this.trace(casted, 0);
                this.rawData[i][j].color = Color.plus(this.rawData[i][j].color, sample);
                this.rawData[i][j].sampleCount++;
            }
        }
    }

    public resetData() {
        this.rawData.forEach((row, idx) => row.forEach((pixel, idy) => this.rawData[idx][idy] = new PixelSample()));
    }

    public processImage() {
        this.rawData.forEach((row, rowIndex) => row.forEach((pixel, columnIndex) => {
            var color = Color.toDrawingColor(Color.scale(1 / pixel.sampleCount, pixel.color));
            this.imageData[rowIndex][columnIndex] = color;
        }));
    }

    public addPartialRawData(partData: PartialRawData) {
        for (var i = partData.from; i < partData.to; i++) {
            this.rawData[i].forEach((pixel, idx) => pixel.add(partData.data[i - partData.from][idx]));
        }
    }

    public getPartialRawData(from: number, to: number): PartialRawData {
        var data = this.rawData.slice(from, to);
        return { data: data, from: from, to: to };
    }
}

export interface PartialRawData {
    data: PixelSample[][];
    from: number;
    to: number;
}

interface RowsToRender {
    renderRows: boolean;
    from?: number;
    to?: number;
}

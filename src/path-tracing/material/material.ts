import Vector from '../../general/vector';
import Color from '../../general/color';

import Constant from '../constant';
import * as GeneralMaterial from './general-material';

import MaterialModel = GeneralMaterial.MaterialModel;
import DiffuseMaterial from './diffuse';
import SpecularMaterial from './specular';
import IdealRefractorMaterial from './ideal-refractor';
import IdealReflectorMaterial from './ideal-reflector';

export default class Material {
    public cLe: Color = new Color();
    public diff: DiffuseMaterial = new DiffuseMaterial();
    public spec: SpecularMaterial = new SpecularMaterial();
    public refract: IdealRefractorMaterial = new IdealRefractorMaterial();
    public reflect: IdealReflectorMaterial = new IdealReflectorMaterial();

    public Le(V: Vector, N: Vector) {
        return this.cLe;
    }

    public BRDF(L: Vector, N: Vector, V: Vector, selectedModel: MaterialModel): Color {
        var t: Color;
        var p: Color;

        switch (selectedModel) {
            case MaterialModel.DIFFUSE: return this.diff.BRDF();
            case MaterialModel.SPECULAR: return this.spec.BRDF(L, N, V);
            case MaterialModel.REFRACTOR:
                var cost = -1 * Vector.dot(N, L);
                if (cost > Constant.EPSILON) return Color.scale(1 / cost, this.reflect.Kr);
                else return new Color();
            case MaterialModel.REFLECTOR:
                var cost = Vector.dot(N, L);
                if (cost > Constant.EPSILON) return Color.scale(1 / cost, this.reflect.Kr);
                else return new Color();
            case MaterialModel.ALL:
                t = this.diff.BRDF();
                p = this.spec.BRDF(L, N, V);
                t = Color.plus(t, p);
                p = this.BRDF(L, N, V, MaterialModel.REFRACTOR);
                t = Color.plus(t, p);
                return t;
        }
    }

    public nextDirection(V, N, L, selectedModel: MaterialModel, out: boolean): GeneralMaterial.BRDFSample {
        switch (selectedModel) {
            case MaterialModel.DIFFUSE: return this.diff.nextDirection(L, N, V);
            case MaterialModel.SPECULAR: return this.spec.nextDirection(L, N, V);
            case MaterialModel.REFRACTOR: return this.refract.nextDirection(L, N, V, out);
            case MaterialModel.REFLECTOR: return this.reflect.nextDirection(L, N, V);
        }
        return { probability: 0 };
    }
}
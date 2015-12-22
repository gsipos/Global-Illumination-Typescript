"use strict";
import Vector from '../../general/vector';
import Color from '../../general/color';
import Halton from '../halton';
import Constant from '../constant';

import * as GeneralMaterial from './general-material';
import BRDFSample = GeneralMaterial.BRDFSample;
import MaterialModel = GeneralMaterial.MaterialModel;

export default class SpecularMaterial {
    public ks: Color = new Color();
    public shine: number = 1;

    public BRDF(L: Vector, N: Vector, V: Vector): Color {
        var NL = Vector.dot(N, L);
        var R: Vector = Vector.minus(Vector.times(NL * 2, N), L);
        var NV = Vector.dot(N, V);
        var max: number;
        if (NV > NL) max = NV;
        else max = NL;

        var RVt = Math.abs(Vector.dot(R, V));
        var RV = Math.pow(RVt, this.shine);
        var t: Color = Color.scale(RV / max, this.ks);
        return t;
    }

    public nextDirection(L: Vector, N: Vector, V: Vector): BRDFSample {
        var z = Vector.ZUNIT;
        var y = Vector.YUNIT;
        var u = Halton.UNIFORM(7);
        var v = Halton.UNIFORM(11);
        var cosVR = Math.pow(u, 1.0 / (this.shine + 1));
        var sinVR = Math.sqrt(1.0 - (cosVR * cosVR));
        var O: Vector = Vector.cross(V, z);
        if (Vector.mag(O) < Constant.EPSILON) O = Vector.cross(V, y);
        var P: Vector = Vector.cross(O, V);
        var R: Vector = Vector.plus(
            Vector.times(sinVR * Math.cos(2 * Constant.PI * v), O),
            Vector.plus(
                Vector.times(sinVR * Math.sin(2 * Constant.PI * v), P),
                Vector.times(cosVR, V))
        );
        var toL: Vector = Vector.minus(
            Vector.times(Vector.dot(N, R) * 2.0, N),
            R
        );
        L.assign(toL);
        var cosNL = Vector.dot(N, L);
        if (cosNL < 0) return { probability: 0 };
        var prob = (this.shine + 2) / (2 * Constant.PI) * Math.pow(cosVR, this.shine);
        return { direction: toL, probability: prob };
    }

    public averageAlbedo(): number {
        return Color.luminance(this.ks) * 2 * Constant.PI / (this.shine + 2);
    }
}
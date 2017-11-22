"use strict";
import Vector from '../../general/vector';
import Color from '../../general/color';
import Halton from '../halton';
import Constant from '../constant';

import * as GeneralMaterial from './general-material';
import BRDFSample = GeneralMaterial.BRDFSample;
import MaterialModel = GeneralMaterial.MaterialModel;


export default class DiffuseMaterial {
    public kd: Color = new Color();

    public BRDF(): Color { return this.kd; }

    public nextDirection(L: Vector, N: Vector, V: Vector): BRDFSample {
        var u = Halton.UNIFORM(13);
        var v = Halton.UNIFORM(17);
        var theta = Math.asin(Math.sqrt(u));
        var phi = Constant.PI * 2.0 * v;
        var z: Vector = Vector.ZUNIT;
        var y: Vector = Vector.YUNIT;
        var O: Vector = Vector.cross(N, z);
        if (Vector.mag(O) < Constant.EPSILON) {
            O = Vector.cross(N, y);
        }
        O = Vector.norm(O);
        var P: Vector = Vector.cross(N, O);
        var toL = Vector.plus(
            Vector.times(Math.cos(theta), N),
            Vector.plus(
                Vector.times(Math.sin(theta) * Math.cos(phi), O),
                Vector.times(Math.sin(theta) * Math.sin(phi), P))
        );
        L.assign(toL);
        var prob = Math.cos(theta) / Constant.PI;
        return { direction: toL, probability: prob };
    }

    public averageAlbedo() {
        return Color.luminance(this.kd) * Constant.PI;
    }
}

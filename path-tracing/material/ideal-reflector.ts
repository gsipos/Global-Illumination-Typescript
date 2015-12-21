import Vector from '../../general/vector';
import Color from '../../general/color';

import * as GeneralMaterial from 'path-tracing/material/general-material';

export default class IdealReflectorMaterial {
    public Kr: Color = new Color();

    public nextDirection(L: Vector, N: Vector, V: Vector): GeneralMaterial.BRDFSample {
        var tmp: Vector = Vector.minus(
            Vector.times(Vector.dot(N, V) * 2, N),
            V
        );
        L.assign(tmp);
        return { direction: tmp, probability: 1 };
    }

    public averageAlbedo() { return Color.luminance(this.Kr); }
}
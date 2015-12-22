import Vector from '../../general/vector';
import Color from '../../general/color';
import Constant from '../constant';

import * as GeneralMaterial from './general-material';

export default class IdealRefractorMaterial {
    public Kt: Color = new Color();
    public Nt: number = 1;

    public nextDirection(L: Vector, N: Vector, V: Vector, out: boolean): GeneralMaterial.BRDFSample {
        var cosa = Vector.dot(N, V);
        var cn = out ? this.Nt : 1 / this.Nt;
        var disc = 1 - (1 - cosa * cosa) / (cn * cn);
        if (disc < Constant.EPSILON) return { probability: 0 };

        var tempL: Vector = Vector.minus(
            Vector.times(cosa / cn - Math.sqrt(disc), N),
            Vector.times(1 / cn, V)
        );
        L.assign(Vector.norm(tempL));
        return { direction: tempL.normalize(), probability: 1 };
    }
}

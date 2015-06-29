module GlobalIllumination {
    export class Constant {
        public static get EPSILON() { return 0.000001; }
        public static get PI() { return 3.14159265; }
    }

    enum Directions {
        UP,
        DOWN,
        FORWARD,
        BACKWARD,
        RIGHT,
        LEFT
    }

    class Vector {

        constructor(public x: number = 0, public y: number = 0, public z: number = 0) { }

        static times(k: number, v: Vector) { return new Vector(k * v.x, k * v.y, k * v.z); }
        static minus(v1: Vector, v2: Vector) { return new Vector(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z); }
        static plus(v1: Vector, v2: Vector) { return new Vector(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z); }
        static dot(v1: Vector, v2: Vector) { return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z; }
        static mag(v: Vector) { return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z); }

        static norm(v: Vector) {
            var mag = Vector.mag(v);
            var div = (mag === 0) ? Infinity : 1.0 / mag;
            return Vector.times(div, v);
        }

        static cross(v1: Vector, v2: Vector) {
            return new Vector(v1.y * v2.z - v1.z * v2.y,
                v1.z * v2.x - v1.x * v2.z,
                v1.x * v2.y - v1.y * v2.x);
        }

        public assign(v: Vector) {
            this.x = v.x;
            this.y = v.y,
            this.z = v.z;
        }

        public normalize(): Vector {
            var mag = Vector.mag(this);
            var div = (mag === 0) ? Infinity : 1.0 / mag;
            this.x *= div;
            this.y *= div;
            this.y *= div;
            return this;
        }

        static ZUNIT = new Vector(0, 0, 1);
        static YUNIT = new Vector(0, 1, 0);
    }

    export class Color {

        constructor(public r: number = 0, public g: number = 0, public b: number = 0) { }

        static scale(k: number, v: Color) { return new Color(k * v.r, k * v.g, k * v.b); }
        static plus(v1: Color, v2: Color) { return new Color(v1.r + v2.r, v1.g + v2.g, v1.b + v2.b); }
        static times(v1: Color, v2: Color) { return new Color(v1.r * v2.r, v1.g * v2.g, v1.b * v2.b); }

        static white = new Color(1.0, 1.0, 1.0);
        static grey = new Color(0.5, 0.5, 0.5);
        static black = new Color(0.0, 0.0, 0.0);

        static toDrawingColor(c: Color) {
            var legalize = d => d > 1 ? 1 : d;
            return {
                r: Math.floor(legalize(c.r) * 255),
                g: Math.floor(legalize(c.g) * 255),
                b: Math.floor(legalize(c.b) * 255)
            }
        }

        static legalize(c: Color) {
            var legalize = d => d > 1 ? 1 : d;
            return new Color(legalize(c.r), legalize(c.g), legalize(c.b));
        }

        static luminance(c: Color): number { return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; }
    }

    class Ray {
        public invDirection: Vector;
        public directionSquared: number;
        public sign: number[] = [];
        constructor(public origin: Vector = new Vector(), public direction: Vector = new Vector()) {
            this.calcParams();
        }

        public calcParams() {
            this.invDirection = new Vector(1 / this.direction.x, 1 / this.direction.y, 1 / this.direction.z);
            this.sign[0] = this.invDirection.x < 0 ? 1 : 0;
            this.sign[1] = this.invDirection.y < 0 ? 1 : 0;
            this.sign[2] = this.invDirection.z < 0 ? 1 : 0;
            this.directionSquared = Vector.dot(this.direction, this.direction);
        }

        public getPointOnRay(distance: number): Vector {
            return Vector.plus(this.origin, Vector.times(distance, this.direction));
        }
    }

    class Halton {
        public value: number;
        public invBase: number;
        public base: number;

        public calcNumber(i: number, base: number): number {
            this.base = base;
            var f: number = 1.0 / base;
            this.invBase = f;
            this.value = 0.0;
            while (i > 0) {
                this.value = this.value + f * i % base;
                i = i / base;
                f = f * this.invBase;
            }
            return this.value;
        }

        public next(): number {
            var r: number = 1.0 - this.value - 0.000000000001;
            if (this.invBase < r) {
                this.value = this.value + this.invBase;
            } else {
                var h = this.invBase;
                var hh = h;
                do {
                    var hh = h;
                    h = h * this.invBase;
                } while (h >= r);
                this.value = this.value + hh + h - 1.0;
            }
            return this.value;
        }

        static collection: Halton[] = [];

        static UNIFORM(i: number): number {
            return Math.random(); //TODO
        }
    }

    interface BRDFSample {
        materialModel?: MaterialModel;
        direction?: Vector;
        probability: number;
        inAir?: boolean;
    }

    class DiffuseMaterial {
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

    class SpecularMaterial {
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

    class IdealRefractorMaterial {
        public Kt: Color = new Color();
        public Nt: number = 1;

        public nextDirection(L: Vector, N: Vector, V: Vector, out: boolean): BRDFSample {
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

    class IdealReflectorMaterial {
        public Kr: Color = new Color();

        public nextDirection(L: Vector, N: Vector, V: Vector): BRDFSample {
            var tmp: Vector = Vector.minus(
                Vector.times(Vector.dot(N, V) * 2, N),
                V
                );
            L.assign(tmp);
            return { direction: tmp, probability: 1 };
        }

        public averageAlbedo() { return Color.luminance(this.Kr); }
    }

    enum MaterialModel {
        DIFFUSE,
        SPECULAR,
        REFRACTOR,
        REFLECTOR,
        ALL,
        NONE
    }

    class Material {
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

        public nextDirection(V, N, L, selectedModel: MaterialModel, out: boolean): BRDFSample {
            switch (selectedModel) {
                case MaterialModel.DIFFUSE: return this.diff.nextDirection(L, N, V);
                case MaterialModel.SPECULAR: return this.spec.nextDirection(L, N, V);
                case MaterialModel.REFRACTOR: return this.refract.nextDirection(L, N, V, out);
                case MaterialModel.REFLECTOR: return this.reflect.nextDirection(L, N, V);
            }
            return { probability: 0 };
        }
    }

    class IntersectionResult {
        constructor(public success: boolean, public distance?: number, public point?: IntersectionPoint) { }

        public static FAILED = new IntersectionResult(false, 1000000);
    }

    class IntersectionPoint {
        constructor(
            public hp: Vector,
            public normal: Vector,
            public material: Material,
            public object: SceneObject) { }
    }

    interface SceneObject {
        mat: Material;
        intersect(r: Ray): IntersectionResult
        getRandomSurfacePoint(): Vector;
    }

    class Plane implements SceneObject {
        private sd: number;

        public mat: Material;
        public normal: Vector;
        public pnull: Vector;
        public min: Vector;
        public max: Vector;

        public intersect(r: Ray): IntersectionResult {
            var denominator = Vector.dot(this.normal, r.direction);
            if (Math.abs(denominator) < Constant.EPSILON) return IntersectionResult.FAILED;

            var numerator = -1 * (Vector.dot(this.normal, r.origin) + this.sd);

            var temp = numerator / denominator;
            if (temp < Constant.EPSILON) return IntersectionResult.FAILED;

            var hitPoint = r.getPointOnRay(temp);

            var v1 = Vector.minus(hitPoint, this.min);
            var v2 = Vector.minus(hitPoint, this.max);
            if ((hitPoint.x < this.min.x) && (Math.abs(v1.x) > Constant.EPSILON)) return IntersectionResult.FAILED;
            if ((hitPoint.y < this.min.y) && (Math.abs(v1.y) > Constant.EPSILON)) return IntersectionResult.FAILED;
            if ((hitPoint.z < this.min.z) && (Math.abs(v1.z) > Constant.EPSILON)) return IntersectionResult.FAILED;
            if ((hitPoint.x > this.max.x) && (Math.abs(v2.x) > Constant.EPSILON)) return IntersectionResult.FAILED;
            if ((hitPoint.y > this.max.y) && (Math.abs(v2.y) > Constant.EPSILON)) return IntersectionResult.FAILED;
            if ((hitPoint.z > this.max.z) && (Math.abs(v2.z) > Constant.EPSILON)) return IntersectionResult.FAILED;

            return new IntersectionResult(true, temp, new IntersectionPoint(hitPoint, this.normal, this.mat, this));
        }

        public getRandomSurfacePoint(): Vector {
            var u = Math.random();
            var v = Math.random();
            var i: Vector = new Vector(
                this.min.x + (this.max.x - this.min.x) * u,
                this.min.y + (this.max.y - this.min.y) * v,
                this.pnull.z);
            return i;
        }

        public D() {
            this.sd = (-1.0 * this.normal.x * this.pnull.x - this.normal.y * this.pnull.y - this.normal.z * this.pnull.z);
            return this.sd;
        }
    }

    class Sphere implements SceneObject {
        public mat: Material;
        public pos: Vector;
        public rad: number;

        private getRandomOffset() {
            return 2 * this.rad * Math.random() - this.rad;
        }

        private getDiscriminant(A, B, C): number {
            return B * B - 4 * A * C;
        }

        public intersect(r: Ray): IntersectionResult {
            var A = r.directionSquared;
            var op = Vector.minus(r.origin, this.pos);
            var B = 2 * Vector.dot(r.direction, op);
            var C = Vector.dot(op, op) - this.rad * this.rad;
            var D = this.getDiscriminant(A, B, C);
            if (D < 0) return IntersectionResult.FAILED;
            var sqrtD = Math.sqrt(D);
            var denominator = 1 / 2 * A;
            var t1 = (-B - sqrtD) * denominator;
            var tt;
            if (t1 > 0) tt = t1;
            else tt = (-B + sqrtD) * denominator;

            if (tt < Constant.EPSILON) return IntersectionResult.FAILED;

            var hitpoint = r.getPointOnRay(tt);
            var normal = Vector.times(1 / this.rad, Vector.minus(hitpoint, this.pos));

            return new IntersectionResult(true, tt, new IntersectionPoint(hitpoint, normal, this.mat, this));
        }

        public getRandomSurfacePoint() {
            return new Vector(
                this.pos.x + this.getRandomOffset(),
                this.pos.y + this.getRandomOffset(),
                this.pos.z + this.getRandomOffset()
                );
        }
    }

    class BoundingBox implements SceneObject {
        public mat: Material;
        public innerObjects: SceneObject[] = [];
        public parameters: Vector[] = [];

        constructor(v1: Vector, v2: Vector) {
            this.parameters = [v1, v2];
        }

        public boxIntersect(r: Ray, t0: number, t1: number): boolean {
            var tmin = (this.parameters[r.sign[0]].x - r.origin.x) * r.invDirection.x;
            var tmax = (this.parameters[1 - r.sign[0]].x - r.origin.x) * r.invDirection.x;
            var tymin = (this.parameters[r.sign[1]].y - r.origin.y) * r.invDirection.y;
            var tymax = (this.parameters[1 - r.sign[1]].y - r.origin.y) * r.invDirection.y;

            if ((tmin > tymax) || (tymin > tmax)) return false;
            if (tymin > tmin) tmin = tymin;
            if (tymax < tmax) tmax = tymax;

            var tzmin = (this.parameters[r.sign[2]].z - r.origin.z) * r.invDirection.z;
            var tzmax = (this.parameters[1 - r.sign[2]].z - r.origin.z) * r.invDirection.z;

            if ((tmin > tzmax) || (tzmin > tmax)) return false;
            if (tzmin > tmin) tmin = tzmin;
            if (tzmax < tmax) tmax = tzmax;
            return ((tmin < t1) && (tmax > t0));
        }

        public intersect(r: Ray): IntersectionResult {
            if (!this.boxIntersect(r, 0.0, 1000.0)) return IntersectionResult.FAILED;
            if (this.innerObjects.length === 0) return IntersectionResult.FAILED;

            var min: IntersectionResult;
            var interSections = this.innerObjects.map<IntersectionResult>(object => object.intersect(r));
            interSections.forEach(result => {
                if (result.success && min && result.distance < min.distance) {
                    min = result;
                }
            });
            if (min) return min;
            else return IntersectionResult.FAILED;
        }

        getRandomSurfacePoint() { return new Vector(); }
    }

    class Camera {
        private dx: number;
        private dz: number;

        public eye: Vector;
        public picmin: Vector;
        public picmax: Vector;
        public width: number;
        public height: number;

        public init() {
            this.dx = ((this.picmax.x - this.picmin.x) / this.width);
            this.dz = ((this.picmax.z - this.picmin.z) / this.height);
        }

        public getray(i: number, j: number): Ray {
            var casted: Ray = new Ray(this.eye);
            var u = Halton.UNIFORM(2);
            var v = Halton.UNIFORM(3);
            var picPoint: Vector = new Vector(
                this.picmin.x + this.dx * j + this.dx * u,
                this.picmin.y,
                this.picmin.z + this.dz * i + this.dz * v);
            casted.direction = Vector.minus(picPoint, this.eye);
            casted.direction = Vector.norm(casted.direction);
            casted.calcParams();
            return casted;
        }
    }

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

    class Scene {
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
                    console.info(this.gatherProgress," / ",this.gatherWalks);
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

    class Factory {
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

    export class Renderer {
        public width = 800;
        public height = 800;
        public gatherWalk = 5000;
        public maxTraceDepth = 30;
        public lightSamples = 5;
        public rowsToRender = 50;

        private scene: Scene = new Scene(this.height, this.width);
        private ctx: CanvasRenderingContext2D;

        public initWorld() {
            var factory = new Factory();
            var scene = this.scene;
            scene.camera.width = this.width;
            scene.camera.height = this.height;
            scene.maxTraceDepht = this.maxTraceDepth;
            scene.lightSamples = this.lightSamples;
            scene.gatherWalks = this.gatherWalk;
            scene.rowsToRender = this.rowsToRender;
            scene.camera.eye = new Vector(150, 105, 150);

            scene.camera.picmax = new Vector(175, 130, 175);
            scene.camera.picmin = new Vector(125, 130, 125);
            scene.camera.init();

            var floor = factory.createPlane(new Vector(100, 100, 100), new Vector(200, 250, 100), Directions.UP, factory.createMatGreyDiffuse());
            scene.world.push(floor);

            var ceiling = factory.createPlane(new Vector(100, 100, 200), new Vector(200, 250, 200), Directions.DOWN, factory.createMatGreyDiffuse());
            scene.world.push(ceiling);

            var back = factory.createPlane(new Vector(100, 100, 100), new Vector(200, 100, 200), Directions.BACKWARD, factory.createMatGreyDiffuse());
            scene.world.push(back);

            var front = factory.createPlane(new Vector(100, 250, 100), new Vector(200, 250, 200), Directions.FORWARD, factory.createMatGreyDiffuse());
            scene.world.push(front);

            var leftMat = factory.createMatGreyDiffuse();
            leftMat.diff.kd = new Color(0.289, 0.211, 0.081);
            leftMat.spec.ks = new Color(1.4, 1, 0.41);
            leftMat.spec.shine = 100;
            var left = factory.createPlane(new Vector(100, 100, 100), new Vector(100, 251, 201), Directions.LEFT, leftMat);
            scene.world.push(left);

            var rightMat = factory.createMatGreyDiffuse();
            rightMat.diff.kd = new Color(0.03, 0.27, 0.28);
            rightMat.spec.ks = new Color(0.3, 2.7, 2.8);
            rightMat.spec.shine = 310;
            var right = factory.createPlane(new Vector(200, 100, 99), new Vector(200, 251, 201), Directions.RIGHT, rightMat);
            scene.world.push(right);

            var light = factory.createSphere(new Vector(150, 200, 190), 5, factory.createLight(new Color(0.3, 0.3, 0.3), 2));
            scene.world.push(light);
            scene.lightSources.push(light);

            var sphere1 = factory.createSphere(new Vector(130, 220, 170), 10, new Material());
            sphere1.mat.diff.kd = new Color(0.151, 0.311, 0.315);
            sphere1.mat.spec.ks = new Color(6.6, 2.2, 2.6);
            sphere1.mat.spec.shine = 50;
            scene.world.push(sphere1);

            var sphere2 = factory.createSphere(new Vector(170, 200, 120), 20, new Material());
            sphere2.mat.diff.kd = new Color(0.31, 0.30, 0.20);
            sphere2.mat.spec.ks = new Color(10.2, 10.6, 10.6);
            sphere2.mat.spec.shine = 200;
            scene.world.push(sphere2);

            scene.world.push(factory.createSphere(new Vector(130, 220, 120), 20, factory.createMatMirror()));

            var sphereBox = new BoundingBox(new Vector(104, 110, 105), new Vector(120, 240, 190));
            for (var i = 0; i < 5; i++) {
                for (var j = 0; j < 10; j++) {
                    var nsphere = factory.createSphere(new Vector(110, 130 + (j * 10), 110 + (i * 15)), 2.5, factory.createMatGlass());
                    sphereBox.innerObjects.push(nsphere);
                }
            }
            scene.world.push(sphereBox);
        }

        public renderImage(ctx: CanvasRenderingContext2D) {
            this.scene.processImage();
            var imgData = ctx.createImageData(this.height, this.width);
            for (var y = 0; y < this.height; y++) {
                for (var x = 0; x < this.width; x++) {
                    var color = this.scene.imageData[this.height-y-1][x];
                    var i = y * this.width * 4 + x * 4;
                    imgData.data[i + 0] = color.r;
                    imgData.data[i + 1] = color.g;
                    imgData.data[i + 2] = color.b;
                    imgData.data[i + 3] = 255;
                }
            }
            ctx.putImageData(imgData, 0, 0);
        }

        public renderRawData(ctx: CanvasRenderingContext2D) {
            do {
                var rowsToRender = this.scene.getRowsToRender();
                console.log(rowsToRender);
                if (rowsToRender.renderRows) {
                    this.scene.renderFromTo(rowsToRender.from, rowsToRender.to);
                }
            } while (rowsToRender.renderRows);
        }

        public renderPart(from: number, to: number): PartialRawData {
            this.scene.resetData();
            this.scene.renderFromTo(from, to);
            return this.scene.getPartialRawData(from, to);
        }

        private spawnWorker(): Worker {
            var worker = new Worker("render-worker.js");
            worker.onmessage = ev => {
                var data: PartialRawData = ev.data;
                this.scene.addPartialRawData(data);
                this.giveJobToWorker(worker);
            };
            return worker;
        }

        private giveJobToWorker(worker: Worker) {
            var job = this.scene.getRowsToRender();
            if (job.renderRows) {
                worker.postMessage(job);
            } else {
                worker.terminate();
            }
        }

        public renderWithWorkers() {
            for (var i = 0; i < 4; i++) {
                var worker = this.spawnWorker();
                this.giveJobToWorker(worker);
            }
        }

        public execute() {
            this.initWorld();
            var canv = document.createElement("canvas");
            canv.width = this.width;
            canv.height = this.height;
            document.body.appendChild(canv);
            this.ctx = canv.getContext("2d");
            this.renderWithWorkers();
            setInterval(() => this.renderImage(this.ctx), 2000);
        }
    }
}


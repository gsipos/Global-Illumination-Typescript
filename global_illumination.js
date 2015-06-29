var GlobalIllumination;
(function (GlobalIllumination) {
    var Constant = (function () {
        function Constant() {
        }
        Object.defineProperty(Constant, "EPSILON", {
            get: function () {
                return 0.000001;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constant, "PI", {
            get: function () {
                return 3.14159265;
            },
            enumerable: true,
            configurable: true
        });
        return Constant;
    })();
    GlobalIllumination.Constant = Constant;

    var Directions;
    (function (Directions) {
        Directions[Directions["UP"] = 0] = "UP";
        Directions[Directions["DOWN"] = 1] = "DOWN";
        Directions[Directions["FORWARD"] = 2] = "FORWARD";
        Directions[Directions["BACKWARD"] = 3] = "BACKWARD";
        Directions[Directions["RIGHT"] = 4] = "RIGHT";
        Directions[Directions["LEFT"] = 5] = "LEFT";
    })(Directions || (Directions = {}));

    var Vector = (function () {
        function Vector(x, y, z) {
            if (typeof x === "undefined") { x = 0; }
            if (typeof y === "undefined") { y = 0; }
            if (typeof z === "undefined") { z = 0; }
            this.x = x;
            this.y = y;
            this.z = z;
        }
        Vector.times = function (k, v) {
            return new Vector(k * v.x, k * v.y, k * v.z);
        };
        Vector.minus = function (v1, v2) {
            return new Vector(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
        };
        Vector.plus = function (v1, v2) {
            return new Vector(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
        };
        Vector.dot = function (v1, v2) {
            return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
        };
        Vector.mag = function (v) {
            return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
        };

        Vector.norm = function (v) {
            var mag = Vector.mag(v);
            var div = (mag === 0) ? Infinity : 1.0 / mag;
            return Vector.times(div, v);
        };

        Vector.cross = function (v1, v2) {
            return new Vector(v1.y * v2.z - v1.z * v2.y, v1.z * v2.x - v1.x * v2.z, v1.x * v2.y - v1.y * v2.x);
        };

        Vector.prototype.assign = function (v) {
            this.x = v.x;
            this.y = v.y, this.z = v.z;
        };

        Vector.prototype.normalize = function () {
            var mag = Vector.mag(this);
            var div = (mag === 0) ? Infinity : 1.0 / mag;
            this.x *= div;
            this.y *= div;
            this.y *= div;
            return this;
        };

        Vector.ZUNIT = new Vector(0, 0, 1);
        Vector.YUNIT = new Vector(0, 1, 0);
        return Vector;
    })();

    var Color = (function () {
        function Color(r, g, b) {
            if (typeof r === "undefined") { r = 0; }
            if (typeof g === "undefined") { g = 0; }
            if (typeof b === "undefined") { b = 0; }
            this.r = r;
            this.g = g;
            this.b = b;
        }
        Color.scale = function (k, v) {
            return new Color(k * v.r, k * v.g, k * v.b);
        };
        Color.plus = function (v1, v2) {
            return new Color(v1.r + v2.r, v1.g + v2.g, v1.b + v2.b);
        };
        Color.times = function (v1, v2) {
            return new Color(v1.r * v2.r, v1.g * v2.g, v1.b * v2.b);
        };

        Color.toDrawingColor = function (c) {
            var legalize = function (d) {
                return d > 1 ? 1 : d;
            };
            return {
                r: Math.floor(legalize(c.r) * 255),
                g: Math.floor(legalize(c.g) * 255),
                b: Math.floor(legalize(c.b) * 255)
            };
        };

        Color.legalize = function (c) {
            var legalize = function (d) {
                return d > 1 ? 1 : d;
            };
            return new Color(legalize(c.r), legalize(c.g), legalize(c.b));
        };

        Color.luminance = function (c) {
            return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
        };
        Color.white = new Color(1.0, 1.0, 1.0);
        Color.grey = new Color(0.5, 0.5, 0.5);
        Color.black = new Color(0.0, 0.0, 0.0);
        return Color;
    })();
    GlobalIllumination.Color = Color;

    var Ray = (function () {
        function Ray(origin, direction) {
            if (typeof origin === "undefined") { origin = new Vector(); }
            if (typeof direction === "undefined") { direction = new Vector(); }
            this.origin = origin;
            this.direction = direction;
            this.sign = [];
            this.calcParams();
        }
        Ray.prototype.calcParams = function () {
            this.invDirection = new Vector(1 / this.direction.x, 1 / this.direction.y, 1 / this.direction.z);
            this.sign[0] = this.invDirection.x < 0 ? 1 : 0;
            this.sign[1] = this.invDirection.y < 0 ? 1 : 0;
            this.sign[2] = this.invDirection.z < 0 ? 1 : 0;
            this.directionSquared = Vector.dot(this.direction, this.direction);
        };

        Ray.prototype.getPointOnRay = function (distance) {
            return Vector.plus(this.origin, Vector.times(distance, this.direction));
        };
        return Ray;
    })();

    var Halton = (function () {
        function Halton() {
        }
        Halton.prototype.calcNumber = function (i, base) {
            this.base = base;
            var f = 1.0 / base;
            this.invBase = f;
            this.value = 0.0;
            while (i > 0) {
                this.value = this.value + f * i % base;
                i = i / base;
                f = f * this.invBase;
            }
            return this.value;
        };

        Halton.prototype.next = function () {
            var r = 1.0 - this.value - 0.000000000001;
            if (this.invBase < r) {
                this.value = this.value + this.invBase;
            } else {
                var h = this.invBase;
                var hh = h;
                do {
                    var hh = h;
                    h = h * this.invBase;
                } while(h >= r);
                this.value = this.value + hh + h - 1.0;
            }
            return this.value;
        };

        Halton.UNIFORM = function (i) {
            return Math.random();
        };
        Halton.collection = [];
        return Halton;
    })();

    var DiffuseMaterial = (function () {
        function DiffuseMaterial() {
            this.kd = new Color();
        }
        DiffuseMaterial.prototype.BRDF = function () {
            return this.kd;
        };

        DiffuseMaterial.prototype.nextDirection = function (L, N, V) {
            var u = Halton.UNIFORM(13);
            var v = Halton.UNIFORM(17);
            var theta = Math.asin(Math.sqrt(u));
            var phi = Constant.PI * 2.0 * v;
            var z = Vector.ZUNIT;
            var y = Vector.YUNIT;
            var O = Vector.cross(N, z);
            if (Vector.mag(O) < Constant.EPSILON) {
                O = Vector.cross(N, y);
            }
            O = Vector.norm(O);
            var P = Vector.cross(N, O);
            var toL = Vector.plus(Vector.times(Math.cos(theta), N), Vector.plus(Vector.times(Math.sin(theta) * Math.cos(phi), O), Vector.times(Math.sin(theta) * Math.sin(phi), P)));
            L.assign(toL);
            var prob = Math.cos(theta) / Constant.PI;
            return { direction: toL, probability: prob };
        };

        DiffuseMaterial.prototype.averageAlbedo = function () {
            return Color.luminance(this.kd) * Constant.PI;
        };
        return DiffuseMaterial;
    })();

    var SpecularMaterial = (function () {
        function SpecularMaterial() {
            this.ks = new Color();
            this.shine = 1;
        }
        SpecularMaterial.prototype.BRDF = function (L, N, V) {
            var NL = Vector.dot(N, L);
            var R = Vector.minus(Vector.times(NL * 2, N), L);
            var NV = Vector.dot(N, V);
            var max;
            if (NV > NL)
                max = NV;
            else
                max = NL;

            var RVt = Math.abs(Vector.dot(R, V));
            var RV = Math.pow(RVt, this.shine);
            var t = Color.scale(RV / max, this.ks);
            return t;
        };

        SpecularMaterial.prototype.nextDirection = function (L, N, V) {
            var z = Vector.ZUNIT;
            var y = Vector.YUNIT;
            var u = Halton.UNIFORM(7);
            var v = Halton.UNIFORM(11);
            var cosVR = Math.pow(u, 1.0 / (this.shine + 1));
            var sinVR = Math.sqrt(1.0 - (cosVR * cosVR));
            var O = Vector.cross(V, z);
            if (Vector.mag(O) < Constant.EPSILON)
                O = Vector.cross(V, y);
            var P = Vector.cross(O, V);
            var R = Vector.plus(Vector.times(sinVR * Math.cos(2 * Constant.PI * v), O), Vector.plus(Vector.times(sinVR * Math.sin(2 * Constant.PI * v), P), Vector.times(cosVR, V)));
            var toL = Vector.minus(Vector.times(Vector.dot(N, R) * 2.0, N), R);
            L.assign(toL);
            var cosNL = Vector.dot(N, L);
            if (cosNL < 0)
                return { probability: 0 };
            var prob = (this.shine + 2) / (2 * Constant.PI) * Math.pow(cosVR, this.shine);
            return { direction: toL, probability: prob };
        };

        SpecularMaterial.prototype.averageAlbedo = function () {
            return Color.luminance(this.ks) * 2 * Constant.PI / (this.shine + 2);
        };
        return SpecularMaterial;
    })();

    var IdealRefractorMaterial = (function () {
        function IdealRefractorMaterial() {
            this.Kt = new Color();
            this.Nt = 1;
        }
        IdealRefractorMaterial.prototype.nextDirection = function (L, N, V, out) {
            var cosa = Vector.dot(N, V);
            var cn = out ? this.Nt : 1 / this.Nt;
            var disc = 1 - (1 - cosa * cosa) / (cn * cn);
            if (disc < Constant.EPSILON)
                return { probability: 0 };

            var tempL = Vector.minus(Vector.times(cosa / cn - Math.sqrt(disc), N), Vector.times(1 / cn, V));
            L.assign(Vector.norm(tempL));
            return { direction: tempL.normalize(), probability: 1 };
        };
        return IdealRefractorMaterial;
    })();

    var IdealReflectorMaterial = (function () {
        function IdealReflectorMaterial() {
            this.Kr = new Color();
        }
        IdealReflectorMaterial.prototype.nextDirection = function (L, N, V) {
            var tmp = Vector.minus(Vector.times(Vector.dot(N, V) * 2, N), V);
            L.assign(tmp);
            return { direction: tmp, probability: 1 };
        };

        IdealReflectorMaterial.prototype.averageAlbedo = function () {
            return Color.luminance(this.Kr);
        };
        return IdealReflectorMaterial;
    })();

    var MaterialModel;
    (function (MaterialModel) {
        MaterialModel[MaterialModel["DIFFUSE"] = 0] = "DIFFUSE";
        MaterialModel[MaterialModel["SPECULAR"] = 1] = "SPECULAR";
        MaterialModel[MaterialModel["REFRACTOR"] = 2] = "REFRACTOR";
        MaterialModel[MaterialModel["REFLECTOR"] = 3] = "REFLECTOR";
        MaterialModel[MaterialModel["ALL"] = 4] = "ALL";
        MaterialModel[MaterialModel["NONE"] = 5] = "NONE";
    })(MaterialModel || (MaterialModel = {}));

    var Material = (function () {
        function Material() {
            this.cLe = new Color();
            this.diff = new DiffuseMaterial();
            this.spec = new SpecularMaterial();
            this.refract = new IdealRefractorMaterial();
            this.reflect = new IdealReflectorMaterial();
        }
        Material.prototype.Le = function (V, N) {
            return this.cLe;
        };

        Material.prototype.BRDF = function (L, N, V, selectedModel) {
            var t;
            var p;

            switch (selectedModel) {
                case 0 /* DIFFUSE */:
                    return this.diff.BRDF();
                case 1 /* SPECULAR */:
                    return this.spec.BRDF(L, N, V);
                case 2 /* REFRACTOR */:
                    var cost = -1 * Vector.dot(N, L);
                    if (cost > Constant.EPSILON)
                        return Color.scale(1 / cost, this.reflect.Kr);
                    else
                        return new Color();
                case 3 /* REFLECTOR */:
                    var cost = Vector.dot(N, L);
                    if (cost > Constant.EPSILON)
                        return Color.scale(1 / cost, this.reflect.Kr);
                    else
                        return new Color();
                case 4 /* ALL */:
                    t = this.diff.BRDF();
                    p = this.spec.BRDF(L, N, V);
                    t = Color.plus(t, p);
                    p = this.BRDF(L, N, V, 2 /* REFRACTOR */);
                    t = Color.plus(t, p);
                    return t;
            }
        };

        Material.prototype.nextDirection = function (V, N, L, selectedModel, out) {
            switch (selectedModel) {
                case 0 /* DIFFUSE */:
                    return this.diff.nextDirection(L, N, V);
                case 1 /* SPECULAR */:
                    return this.spec.nextDirection(L, N, V);
                case 2 /* REFRACTOR */:
                    return this.refract.nextDirection(L, N, V, out);
                case 3 /* REFLECTOR */:
                    return this.reflect.nextDirection(L, N, V);
            }
            return { probability: 0 };
        };
        return Material;
    })();

    var IntersectionResult = (function () {
        function IntersectionResult(success, distance, point) {
            this.success = success;
            this.distance = distance;
            this.point = point;
        }
        IntersectionResult.FAILED = new IntersectionResult(false, 1000000);
        return IntersectionResult;
    })();

    var IntersectionPoint = (function () {
        function IntersectionPoint(hp, normal, material, object) {
            this.hp = hp;
            this.normal = normal;
            this.material = material;
            this.object = object;
        }
        return IntersectionPoint;
    })();

    var Plane = (function () {
        function Plane() {
        }
        Plane.prototype.intersect = function (r) {
            var denominator = Vector.dot(this.normal, r.direction);
            if (Math.abs(denominator) < Constant.EPSILON)
                return IntersectionResult.FAILED;

            var numerator = -1 * (Vector.dot(this.normal, r.origin) + this.sd);

            var temp = numerator / denominator;
            if (temp < Constant.EPSILON)
                return IntersectionResult.FAILED;

            var hitPoint = r.getPointOnRay(temp);

            var v1 = Vector.minus(hitPoint, this.min);
            var v2 = Vector.minus(hitPoint, this.max);
            if ((hitPoint.x < this.min.x) && (Math.abs(v1.x) > Constant.EPSILON))
                return IntersectionResult.FAILED;
            if ((hitPoint.y < this.min.y) && (Math.abs(v1.y) > Constant.EPSILON))
                return IntersectionResult.FAILED;
            if ((hitPoint.z < this.min.z) && (Math.abs(v1.z) > Constant.EPSILON))
                return IntersectionResult.FAILED;
            if ((hitPoint.x > this.max.x) && (Math.abs(v2.x) > Constant.EPSILON))
                return IntersectionResult.FAILED;
            if ((hitPoint.y > this.max.y) && (Math.abs(v2.y) > Constant.EPSILON))
                return IntersectionResult.FAILED;
            if ((hitPoint.z > this.max.z) && (Math.abs(v2.z) > Constant.EPSILON))
                return IntersectionResult.FAILED;

            return new IntersectionResult(true, temp, new IntersectionPoint(hitPoint, this.normal, this.mat, this));
        };

        Plane.prototype.getRandomSurfacePoint = function () {
            var u = Math.random();
            var v = Math.random();
            var i = new Vector(this.min.x + (this.max.x - this.min.x) * u, this.min.y + (this.max.y - this.min.y) * v, this.pnull.z);
            return i;
        };

        Plane.prototype.D = function () {
            this.sd = (-1.0 * this.normal.x * this.pnull.x - this.normal.y * this.pnull.y - this.normal.z * this.pnull.z);
            return this.sd;
        };
        return Plane;
    })();

    var Sphere = (function () {
        function Sphere() {
        }
        Sphere.prototype.getRandomOffset = function () {
            return 2 * this.rad * Math.random() - this.rad;
        };

        Sphere.prototype.getDiscriminant = function (A, B, C) {
            return B * B - 4 * A * C;
        };

        Sphere.prototype.intersect = function (r) {
            var A = r.directionSquared;
            var op = Vector.minus(r.origin, this.pos);
            var B = 2 * Vector.dot(r.direction, op);
            var C = Vector.dot(op, op) - this.rad * this.rad;
            var D = this.getDiscriminant(A, B, C);
            if (D < 0)
                return IntersectionResult.FAILED;
            var sqrtD = Math.sqrt(D);
            var denominator = 1 / 2 * A;
            var t1 = (-B - sqrtD) * denominator;
            var tt;
            if (t1 > 0)
                tt = t1;
            else
                tt = (-B + sqrtD) * denominator;

            if (tt < Constant.EPSILON)
                return IntersectionResult.FAILED;

            var hitpoint = r.getPointOnRay(tt);
            var normal = Vector.times(1 / this.rad, Vector.minus(hitpoint, this.pos));

            return new IntersectionResult(true, tt, new IntersectionPoint(hitpoint, normal, this.mat, this));
        };

        Sphere.prototype.getRandomSurfacePoint = function () {
            return new Vector(this.pos.x + this.getRandomOffset(), this.pos.y + this.getRandomOffset(), this.pos.z + this.getRandomOffset());
        };
        return Sphere;
    })();

    var BoundingBox = (function () {
        function BoundingBox(v1, v2) {
            this.innerObjects = [];
            this.parameters = [];
            this.parameters = [v1, v2];
        }
        BoundingBox.prototype.boxIntersect = function (r, t0, t1) {
            var tmin = (this.parameters[r.sign[0]].x - r.origin.x) * r.invDirection.x;
            var tmax = (this.parameters[1 - r.sign[0]].x - r.origin.x) * r.invDirection.x;
            var tymin = (this.parameters[r.sign[1]].y - r.origin.y) * r.invDirection.y;
            var tymax = (this.parameters[1 - r.sign[1]].y - r.origin.y) * r.invDirection.y;

            if ((tmin > tymax) || (tymin > tmax))
                return false;
            if (tymin > tmin)
                tmin = tymin;
            if (tymax < tmax)
                tmax = tymax;

            var tzmin = (this.parameters[r.sign[2]].z - r.origin.z) * r.invDirection.z;
            var tzmax = (this.parameters[1 - r.sign[2]].z - r.origin.z) * r.invDirection.z;

            if ((tmin > tzmax) || (tzmin > tmax))
                return false;
            if (tzmin > tmin)
                tmin = tzmin;
            if (tzmax < tmax)
                tmax = tzmax;
            return ((tmin < t1) && (tmax > t0));
        };

        BoundingBox.prototype.intersect = function (r) {
            if (!this.boxIntersect(r, 0.0, 1000.0))
                return IntersectionResult.FAILED;
            if (this.innerObjects.length === 0)
                return IntersectionResult.FAILED;

            var min;
            var interSections = this.innerObjects.map(function (object) {
                return object.intersect(r);
            });
            interSections.forEach(function (result) {
                if (result.success && min && result.distance < min.distance) {
                    min = result;
                }
            });
            if (min)
                return min;
            else
                return IntersectionResult.FAILED;
        };

        BoundingBox.prototype.getRandomSurfacePoint = function () {
            return new Vector();
        };
        return BoundingBox;
    })();

    var Camera = (function () {
        function Camera() {
        }
        Camera.prototype.init = function () {
            this.dx = ((this.picmax.x - this.picmin.x) / this.width);
            this.dz = ((this.picmax.z - this.picmin.z) / this.height);
        };

        Camera.prototype.getray = function (i, j) {
            var casted = new Ray(this.eye);
            var u = Halton.UNIFORM(2);
            var v = Halton.UNIFORM(3);
            var picPoint = new Vector(this.picmin.x + this.dx * j + this.dx * u, this.picmin.y, this.picmin.z + this.dz * i + this.dz * v);
            casted.direction = Vector.minus(picPoint, this.eye);
            casted.direction = Vector.norm(casted.direction);
            casted.calcParams();
            return casted;
        };
        return Camera;
    })();

    var PixelSample = (function () {
        function PixelSample() {
            this.color = new Color();
            this.sampleCount = 0;
        }
        PixelSample.prototype.add = function (pix) {
            this.color = Color.plus(this.color, pix.color);
            this.sampleCount += pix.sampleCount;
        };
        return PixelSample;
    })();
    GlobalIllumination.PixelSample = PixelSample;

    var Scene = (function () {
        function Scene(height, width) {
            this.rawData = [];
            this.imageData = [];
            this.camera = new Camera();
            this.world = [];
            this.lightSources = [];
            this.lineProgress = 0;
            this.gatherProgress = 0;
            for (var i = 0; i < height; i++) {
                this.rawData[i] = [];
                this.imageData[i] = [];
                for (var j = 0; j < width; j++) {
                    this.rawData[i][j] = new PixelSample();
                    this.imageData[i][j] = new Color();
                }
            }
        }
        Scene.prototype.selectBRDFModel = function (mat) {
            var prob = Halton.UNIFORM(5);

            var ad = mat.diff.averageAlbedo();
            var as = mat.spec.averageAlbedo();
            var at = Color.luminance(mat.refract.Kt);
            var ar = Color.luminance(mat.reflect.Kr);

            prob -= ad;
            if (prob < 0.0)
                return { model: 0 /* DIFFUSE */, prob: ad };
            prob -= as;
            if (prob < 0.0)
                return { model: 1 /* SPECULAR */, prob: as };
            prob -= at;
            if (prob < 0.0)
                return { model: 2 /* REFRACTOR */, prob: at };
            prob -= ar;
            if (prob < 0.0)
                return { model: 3 /* REFLECTOR */, prob: ar };

            return { model: 5 /* NONE */, prob: 0 };
        };

        Scene.prototype.BRDFSampling = function (V, N, mat, out) {
            var selectedModel = this.selectBRDFModel(mat);
            if (selectedModel.prob < Constant.EPSILON)
                return { direction: null, probability: 0, materialModel: selectedModel.model };
            var dirProp = mat.nextDirection(V, N, new Vector(), selectedModel.model, out);
            dirProp.probability *= selectedModel.prob;
            return { direction: dirProp.direction, probability: dirProp.probability * selectedModel.prob, materialModel: selectedModel.model, inAir: dirProp.inAir };
        };

        Scene.prototype.shadowIntersect = function (r, p) {
            return this.world.some(function (object) {
                var result = object.intersect(r);
                return result.success && result.distance < p;
            });
        };

        Scene.prototype.directLightSource = function (p, out) {
            var _this = this;
            p.normal.normalize();
            var s = new Color();
            this.lightSources.forEach(function (object, index) {
                var c = new Color();
                for (var i = 0; i < _this.lightSamples; i++) {
                    var inVector = object.getRandomSurfacePoint();
                    var shadowRay = new Ray(p.hp, Vector.norm(Vector.minus(inVector, p.hp)));
                    var lightIntersect = object.intersect(shadowRay);

                    if (!_this.shadowIntersect(shadowRay, lightIntersect.distance)) {
                        var cost = Vector.dot(p.normal, shadowRay.direction);
                        if (cost > Constant.EPSILON) {
                            var w = p.material.BRDF(shadowRay.direction, p.normal, out, 4 /* ALL */);
                            var le = object.mat.cLe;
                            var c = Color.plus(Color.times(Color.scale(cost, w), le), c);
                        }
                    }
                }
                c = Color.scale(1 / _this.lightSamples, c);
                s = Color.plus(c, s);
            });
            return Color.scale(1 / this.lightSources.length, s);
        };

        Scene.prototype.firstIntersect = function (ray) {
            var minResult;

            this.world.forEach(function (object) {
                var aktResult = object.intersect(ray);
                if (aktResult.success && minResult && aktResult.distance < minResult.distance || !minResult)
                    minResult = aktResult;
            });

            if (minResult) {
                return minResult;
            }
            return IntersectionResult.FAILED;
        };

        Scene.prototype.trace = function (ray, d) {
            var color = new Color();
            if (d > this.maxTraceDepht)
                return color;

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
                if (brdfSample.probability < Constant.EPSILON)
                    return color;
                var newray = new Ray(hp.hp, brdfSample.direction.normalize());
                var cost = Vector.dot(hp.normal, newray.direction);
                if (cost < 0)
                    cost = -cost;
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
        };

        Scene.prototype.getRowsToRender = function () {
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
        };

        Scene.prototype.renderFromTo = function (from, to) {
            for (var i = from; i < to; i++) {
                for (var j = 0; j < this.camera.width; j++) {
                    var casted = this.camera.getray(i, j);
                    var sample = this.trace(casted, 0);
                    this.rawData[i][j].color = Color.plus(this.rawData[i][j].color, sample);
                    this.rawData[i][j].sampleCount++;
                }
            }
        };

        Scene.prototype.resetData = function () {
            var _this = this;
            this.rawData.forEach(function (row, idx) {
                return row.forEach(function (pixel, idy) {
                    return _this.rawData[idx][idy] = new PixelSample();
                });
            });
        };

        Scene.prototype.processImage = function () {
            var _this = this;
            this.rawData.forEach(function (row, rowIndex) {
                return row.forEach(function (pixel, columnIndex) {
                    var color = Color.toDrawingColor(Color.scale(1 / pixel.sampleCount, pixel.color));
                    _this.imageData[rowIndex][columnIndex] = color;
                });
            });
        };

        Scene.prototype.addPartialRawData = function (partData) {
            for (var i = partData.from; i < partData.to; i++) {
                this.rawData[i].forEach(function (pixel, idx) {
                    return pixel.add(partData.data[i - partData.from][idx]);
                });
            }
        };

        Scene.prototype.getPartialRawData = function (from, to) {
            var data = this.rawData.slice(from, to);
            return { data: data, from: from, to: to };
        };
        return Scene;
    })();

    var Factory = (function () {
        function Factory() {
        }
        Factory.prototype.per2 = function (a, b) {
            return (a + b) * 0.5;
        };

        Factory.prototype.createPlane = function (min, max, dir, mat) {
            var plane = new Plane();
            plane.min = min;
            plane.max = max;
            plane.mat = mat;

            switch (dir) {
                case 0 /* UP */:
                    plane.normal = new Vector(0, 0, 1);
                    plane.pnull = new Vector(this.per2(max.x, min.x), this.per2(max.y, min.y), min.z);
                    break;
                case 1 /* DOWN */:
                    plane.normal = new Vector(0, 0, -1);
                    plane.pnull = new Vector(this.per2(max.x, min.x), this.per2(max.y, min.y), min.z);
                    break;
                case 5 /* LEFT */:
                    plane.normal = new Vector(1, 0, 0);
                    plane.pnull = new Vector(min.x, this.per2(max.y, min.y), this.per2(max.z, min.z));
                    break;
                case 4 /* RIGHT */:
                    plane.normal = new Vector(-1, 0, 0);
                    plane.pnull = new Vector(min.x, this.per2(max.y, min.y), this.per2(max.z, min.z));
                    break;
                case 2 /* FORWARD */:
                    plane.normal = new Vector(0, -1, 0);
                    plane.pnull = new Vector(this.per2(max.x, min.x), min.y, this.per2(max.z, min.z));
                    break;
                case 3 /* BACKWARD */:
                    plane.normal = new Vector(0, 1, 0);
                    plane.pnull = new Vector(this.per2(max.x, min.x), min.y, this.per2(max.z, min.z));
                    break;
            }
            plane.D();
            return plane;
        };

        Factory.prototype.createSphere = function (position, radius, mat) {
            var sphere = new Sphere();
            sphere.pos = position;
            sphere.rad = radius;
            sphere.mat = mat;
            return sphere;
        };

        Factory.prototype.createMatGlass = function () {
            var mat = new Material();
            mat.diff.kd = new Color(0.0, 0.0, 0.0);
            mat.spec.ks = new Color(2.0, 2.0, 2.0);
            mat.spec.shine = 50;
            mat.refract.Kt = new Color(0.7, 0.7, 0.7);
            mat.reflect.Kr = new Color(0.3, 0.3, 0.3);
            mat.refract.Nt = 1.52;
            return mat;
        };

        Factory.prototype.createMatMirror = function () {
            var mat = new Material();
            mat.diff.kd = new Color(0.1, 0.1, 0.1);
            mat.spec.ks = new Color(2.0, 2.0, 2.0);
            mat.spec.shine = 200;
            mat.refract.Kt = new Color(0.0, 0.0, 0.0);
            mat.reflect.Kr = new Color(1.0, 1.0, 1.0);
            mat.refract.Nt = 1.52;
            return mat;
        };

        Factory.prototype.createMatGreyDiffuse = function () {
            var mat = new Material();
            mat.diff.kd = new Color(0.3, 0.3, 0.3);
            mat.spec.ks = new Color(1.0, 1.0, 1.0);
            mat.spec.shine = 100;
            mat.refract.Kt = new Color(0.0, 0.0, 0.0);
            mat.reflect.Kr = new Color(0.0, 0.0, 0.0);
            mat.refract.Nt = 1.52;
            return mat;
        };

        Factory.prototype.createLight = function (c, energy) {
            var mat = new Material();
            mat.diff.kd = c;
            mat.spec.ks = c;
            mat.cLe = Color.scale(energy, c);
            mat.spec.shine = 500;
            mat.reflect.Kr = new Color(0.0, 0.0, 0.0);
            mat.refract.Kt = new Color(0.0, 0.0, 0.0);
            mat.refract.Nt = 1.5;
            return mat;
        };
        return Factory;
    })();

    var Renderer = (function () {
        function Renderer() {
            this.width = 800;
            this.height = 800;
            this.gatherWalk = 5000;
            this.maxTraceDepth = 30;
            this.lightSamples = 5;
            this.rowsToRender = 50;
            this.scene = new Scene(this.height, this.width);
        }
        Renderer.prototype.initWorld = function () {
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

            var floor = factory.createPlane(new Vector(100, 100, 100), new Vector(200, 250, 100), 0 /* UP */, factory.createMatGreyDiffuse());
            scene.world.push(floor);

            var ceiling = factory.createPlane(new Vector(100, 100, 200), new Vector(200, 250, 200), 1 /* DOWN */, factory.createMatGreyDiffuse());
            scene.world.push(ceiling);

            var back = factory.createPlane(new Vector(100, 100, 100), new Vector(200, 100, 200), 3 /* BACKWARD */, factory.createMatGreyDiffuse());
            scene.world.push(back);

            var front = factory.createPlane(new Vector(100, 250, 100), new Vector(200, 250, 200), 2 /* FORWARD */, factory.createMatGreyDiffuse());
            scene.world.push(front);

            var leftMat = factory.createMatGreyDiffuse();
            leftMat.diff.kd = new Color(0.289, 0.211, 0.081);
            leftMat.spec.ks = new Color(1.4, 1, 0.41);
            leftMat.spec.shine = 100;
            var left = factory.createPlane(new Vector(100, 100, 100), new Vector(100, 251, 201), 5 /* LEFT */, leftMat);
            scene.world.push(left);

            var rightMat = factory.createMatGreyDiffuse();
            rightMat.diff.kd = new Color(0.03, 0.27, 0.28);
            rightMat.spec.ks = new Color(0.3, 2.7, 2.8);
            rightMat.spec.shine = 310;
            var right = factory.createPlane(new Vector(200, 100, 99), new Vector(200, 251, 201), 4 /* RIGHT */, rightMat);
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
            //scene.world.push(sphereBox);
        };

        Renderer.prototype.renderImage = function (ctx) {
            this.scene.processImage();
            var imgData = ctx.createImageData(this.height, this.width);
            for (var y = 0; y < this.height; y++) {
                for (var x = 0; x < this.width; x++) {
                    var color = this.scene.imageData[this.height - y - 1][x];
                    var i = y * this.width * 4 + x * 4;
                    imgData.data[i + 0] = color.r;
                    imgData.data[i + 1] = color.g;
                    imgData.data[i + 2] = color.b;
                    imgData.data[i + 3] = 255;
                }
            }
            ctx.putImageData(imgData, 0, 0);
        };

        Renderer.prototype.renderRawData = function (ctx) {
            do {
                var rowsToRender = this.scene.getRowsToRender();
                console.log(rowsToRender);
                if (rowsToRender.renderRows) {
                    this.scene.renderFromTo(rowsToRender.from, rowsToRender.to);
                }
            } while(rowsToRender.renderRows);
        };

        Renderer.prototype.renderPart = function (from, to) {
            this.scene.resetData();
            this.scene.renderFromTo(from, to);
            return this.scene.getPartialRawData(from, to);
        };

        Renderer.prototype.spawnWorker = function () {
            var _this = this;
            var worker = new Worker("render-worker.js");
            worker.onmessage = function (ev) {
                var data = ev.data;
                _this.scene.addPartialRawData(data);
                _this.giveJobToWorker(worker);
            };
            return worker;
        };

        Renderer.prototype.giveJobToWorker = function (worker) {
            var job = this.scene.getRowsToRender();
            if (job.renderRows) {
                worker.postMessage(job);
            } else {
                worker.terminate();
            }
        };

        Renderer.prototype.renderWithWorkers = function () {
            for (var i = 0; i < 4; i++) {
                var worker = this.spawnWorker();
                this.giveJobToWorker(worker);
            }
        };

        Renderer.prototype.execute = function () {
            var _this = this;
            this.initWorld();
            var canv = document.createElement("canvas");
            canv.width = this.width;
            canv.height = this.height;
            document.body.appendChild(canv);
            this.ctx = canv.getContext("2d");
            this.renderWithWorkers();
            setInterval(function () {
                return _this.renderImage(_this.ctx);
            }, 2000);
        };
        return Renderer;
    })();
    GlobalIllumination.Renderer = Renderer;
})(GlobalIllumination || (GlobalIllumination = {}));

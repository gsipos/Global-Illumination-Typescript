define(["require", "exports", 'general/vector', 'general/color', 'path-tracing/ray', 'path-tracing/constant', 'path-tracing/halton', 'path-tracing/material/general-material', 'path-tracing/object/scene-object', 'path-tracing/scene/camera'], function (require, exports, vector_1, color_1, ray_1, constant_1, halton_1, GeneralMaterial, SceneObj, camera_1) {
    var MaterialModel = GeneralMaterial.MaterialModel;
    var IntersectionResult = SceneObj.Intersection.Result;
    class PixelSample {
        constructor() {
            this.color = new color_1.default();
            this.sampleCount = 0;
        }
        add(pix) {
            this.color = color_1.default.plus(this.color, pix.color);
            this.sampleCount += pix.sampleCount;
        }
    }
    exports.PixelSample = PixelSample;
    class Scene {
        constructor(height, width) {
            this.rawData = [];
            this.imageData = [];
            this.camera = new camera_1.default();
            this.world = [];
            this.lightSources = [];
            this.lineProgress = 0;
            this.gatherProgress = 0;
            for (var i = 0; i < height; i++) {
                this.rawData[i] = [];
                this.imageData[i] = [];
                for (var j = 0; j < width; j++) {
                    this.rawData[i][j] = new PixelSample();
                    this.imageData[i][j] = new color_1.default();
                }
            }
        }
        selectBRDFModel(mat) {
            var prob = halton_1.default.UNIFORM(5);
            var ad = mat.diff.averageAlbedo();
            var as = mat.spec.averageAlbedo();
            var at = color_1.default.luminance(mat.refract.Kt);
            var ar = color_1.default.luminance(mat.reflect.Kr);
            prob -= ad;
            if (prob < 0.0)
                return { model: MaterialModel.DIFFUSE, prob: ad };
            prob -= as;
            if (prob < 0.0)
                return { model: MaterialModel.SPECULAR, prob: as };
            prob -= at;
            if (prob < 0.0)
                return { model: MaterialModel.REFRACTOR, prob: at };
            prob -= ar;
            if (prob < 0.0)
                return { model: MaterialModel.REFLECTOR, prob: ar };
            return { model: MaterialModel.NONE, prob: 0 };
        }
        BRDFSampling(V, N, mat, out) {
            var selectedModel = this.selectBRDFModel(mat);
            if (selectedModel.prob < constant_1.default.EPSILON)
                return { direction: null, probability: 0, materialModel: selectedModel.model };
            var dirProp = mat.nextDirection(V, N, new vector_1.default(), selectedModel.model, out);
            dirProp.probability *= selectedModel.prob;
            return { direction: dirProp.direction, probability: dirProp.probability * selectedModel.prob, materialModel: selectedModel.model, inAir: dirProp.inAir };
        }
        shadowIntersect(r, p) {
            return this.world.some(object => {
                var result = object.intersect(r);
                return result.success && result.distance < p;
            });
        }
        directLightSource(p, out) {
            p.normal.normalize();
            var s = new color_1.default();
            this.lightSources.forEach((object, index) => {
                var c = new color_1.default();
                for (var i = 0; i < this.lightSamples; i++) {
                    var inVector = object.getRandomSurfacePoint();
                    var shadowRay = new ray_1.default(p.hp, vector_1.default.norm(vector_1.default.minus(inVector, p.hp)));
                    var lightIntersect = object.intersect(shadowRay);
                    if (!this.shadowIntersect(shadowRay, lightIntersect.distance)) {
                        var cost = vector_1.default.dot(p.normal, shadowRay.direction);
                        if (cost > constant_1.default.EPSILON) {
                            var w = p.material.BRDF(shadowRay.direction, p.normal, out, MaterialModel.ALL);
                            var le = object.mat.cLe;
                            var c = color_1.default.plus(color_1.default.times(color_1.default.scale(cost, w), le), c);
                        }
                    }
                }
                c = color_1.default.scale(1 / this.lightSamples, c);
                s = color_1.default.plus(c, s);
            });
            return color_1.default.scale(1 / this.lightSources.length, s);
        }
        firstIntersect(ray) {
            var minResult;
            this.world.forEach(object => {
                var aktResult = object.intersect(ray);
                if (aktResult.success && minResult && aktResult.distance < minResult.distance || !minResult)
                    minResult = aktResult;
            });
            if (minResult) {
                return minResult;
            }
            return IntersectionResult.FAILED;
        }
        trace(ray, d) {
            var color = new color_1.default();
            if (d > this.maxTraceDepht)
                return color;
            //var out = true;
            var firstIntersect = this.firstIntersect(ray);
            if (firstIntersect.success) {
                var hp = firstIntersect.point;
                hp.normal.normalize();
                ray.direction.normalize();
                var negDirection = vector_1.default.times(-1, ray.direction);
                if (vector_1.default.dot(hp.normal, negDirection) < 0) {
                    hp.normal = vector_1.default.times(-1, hp.normal);
                }
                if (d === 0) {
                    color = hp.material.Le(negDirection, hp.normal);
                }
                var c = this.directLightSource(hp, negDirection);
                color = color_1.default.plus(color, color_1.default.legalize(c));
                var brdfSample = this.BRDFSampling(negDirection, hp.normal, hp.material, true);
                if (brdfSample.probability < constant_1.default.EPSILON)
                    return color;
                var newray = new ray_1.default(hp.hp, brdfSample.direction.normalize());
                var cost = vector_1.default.dot(hp.normal, newray.direction);
                if (cost < 0)
                    cost = -cost;
                if (cost > constant_1.default.EPSILON) {
                    var w = hp.material.BRDF(newray.direction, hp.normal, negDirection, brdfSample.materialModel);
                    w = color_1.default.scale(cost, w);
                    if (color_1.default.luminance(w) > constant_1.default.EPSILON) {
                        var tr = this.trace(newray, d + 1);
                        var inv_prob = 1 / brdfSample.probability;
                        color = color_1.default.plus(color, color_1.default.scale(inv_prob, color_1.default.times(tr, w)));
                    }
                }
            }
            return color_1.default.legalize(color);
        }
        getRowsToRender() {
            var from, to;
            var stold = this.lineProgress;
            if (this.gatherProgress < this.gatherWalks) {
                if (this.lineProgress < this.camera.height) {
                    this.lineProgress += this.rowsToRender;
                    from = stold;
                    to = stold + this.rowsToRender;
                }
                else {
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
        renderFromTo(from, to) {
            for (var i = from; i < to; i++) {
                for (var j = 0; j < this.camera.width; j++) {
                    var casted = this.camera.getray(i, j);
                    var sample = this.trace(casted, 0);
                    this.rawData[i][j].color = color_1.default.plus(this.rawData[i][j].color, sample);
                    this.rawData[i][j].sampleCount++;
                }
            }
        }
        resetData() {
            this.rawData.forEach((row, idx) => row.forEach((pixel, idy) => this.rawData[idx][idy] = new PixelSample()));
        }
        processImage() {
            this.rawData.forEach((row, rowIndex) => row.forEach((pixel, columnIndex) => {
                var color = color_1.default.toDrawingColor(color_1.default.scale(1 / pixel.sampleCount, pixel.color));
                this.imageData[rowIndex][columnIndex] = color;
            }));
        }
        addPartialRawData(partData) {
            for (var i = partData.from; i < partData.to; i++) {
                this.rawData[i].forEach((pixel, idx) => pixel.add(partData.data[i - partData.from][idx]));
            }
        }
        getPartialRawData(from, to) {
            var data = this.rawData.slice(from, to);
            return { data: data, from: from, to: to };
        }
    }
    exports.Scene = Scene;
});
//# sourceMappingURL=scene.js.map
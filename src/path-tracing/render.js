"use strict";
var vector_1 = require('../general/vector');
var color_1 = require('../general/color');
var material_1 = require('./material/material');
var bounding_box_1 = require('./object/bounding-box');
var scene_1 = require('./scene/scene');
var ObjectFactory = require('./object/factory');
var factory_1 = require('./object/factory');
var Directions = ObjectFactory.Directions;
class Renderer {
    constructor() {
        this.width = 800;
        this.height = 800;
        this.gatherWalk = 5000;
        this.maxTraceDepth = 30;
        this.lightSamples = 5;
        this.rowsToRender = 50;
        this.scene = new scene_1.default(this.height, this.width);
    }
    initWorld() {
        var factory = new factory_1.default();
        var scene = this.scene;
        scene.camera.width = this.width;
        scene.camera.height = this.height;
        scene.maxTraceDepht = this.maxTraceDepth;
        scene.lightSamples = this.lightSamples;
        scene.gatherWalks = this.gatherWalk;
        scene.rowsToRender = this.rowsToRender;
        scene.camera.eye = new vector_1.default(150, 105, 150);
        scene.camera.picmax = new vector_1.default(175, 130, 175);
        scene.camera.picmin = new vector_1.default(125, 130, 125);
        scene.camera.init();
        var floor = factory.createPlane(new vector_1.default(100, 100, 100), new vector_1.default(200, 250, 100), Directions.UP, factory.createMatGreyDiffuse());
        scene.world.push(floor);
        var ceiling = factory.createPlane(new vector_1.default(100, 100, 200), new vector_1.default(200, 250, 200), Directions.DOWN, factory.createMatGreyDiffuse());
        scene.world.push(ceiling);
        var back = factory.createPlane(new vector_1.default(100, 100, 100), new vector_1.default(200, 100, 200), Directions.BACKWARD, factory.createMatGreyDiffuse());
        scene.world.push(back);
        var front = factory.createPlane(new vector_1.default(100, 250, 100), new vector_1.default(200, 250, 200), Directions.FORWARD, factory.createMatGreyDiffuse());
        scene.world.push(front);
        var leftMat = factory.createMatGreyDiffuse();
        leftMat.diff.kd = new color_1.default(0.289, 0.211, 0.081);
        leftMat.spec.ks = new color_1.default(1.4, 1, 0.41);
        leftMat.spec.shine = 100;
        var left = factory.createPlane(new vector_1.default(100, 100, 100), new vector_1.default(100, 251, 201), Directions.LEFT, leftMat);
        scene.world.push(left);
        var rightMat = factory.createMatGreyDiffuse();
        rightMat.diff.kd = new color_1.default(0.03, 0.27, 0.28);
        rightMat.spec.ks = new color_1.default(0.3, 2.7, 2.8);
        rightMat.spec.shine = 310;
        var right = factory.createPlane(new vector_1.default(200, 100, 99), new vector_1.default(200, 251, 201), Directions.RIGHT, rightMat);
        scene.world.push(right);
        var light = factory.createSphere(new vector_1.default(150, 200, 190), 5, factory.createLight(new color_1.default(0.3, 0.3, 0.3), 2));
        scene.world.push(light);
        scene.lightSources.push(light);
        var sphere1 = factory.createSphere(new vector_1.default(130, 220, 170), 10, new material_1.default());
        sphere1.mat.diff.kd = new color_1.default(0.151, 0.311, 0.315);
        sphere1.mat.spec.ks = new color_1.default(6.6, 2.2, 2.6);
        sphere1.mat.spec.shine = 50;
        scene.world.push(sphere1);
        var sphere2 = factory.createSphere(new vector_1.default(170, 200, 120), 20, new material_1.default());
        sphere2.mat.diff.kd = new color_1.default(0.31, 0.30, 0.20);
        sphere2.mat.spec.ks = new color_1.default(10.2, 10.6, 10.6);
        sphere2.mat.spec.shine = 200;
        scene.world.push(sphere2);
        scene.world.push(factory.createSphere(new vector_1.default(130, 220, 120), 20, factory.createMatMirror()));
        var sphereBox = new bounding_box_1.default(new vector_1.default(104, 110, 105), new vector_1.default(120, 240, 190));
        for (var i = 0; i < 5; i++) {
            for (var j = 0; j < 10; j++) {
                var nsphere = factory.createSphere(new vector_1.default(110, 130 + (j * 10), 110 + (i * 15)), 2.5, factory.createMatGlass());
                sphereBox.innerObjects.push(nsphere);
            }
        }
        scene.world.push(sphereBox);
    }
    renderImage(ctx) {
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
    }
    renderRawData(ctx) {
        do {
            var rowsToRender = this.scene.getRowsToRender();
            console.log(rowsToRender);
            if (rowsToRender.renderRows) {
                this.scene.renderFromTo(rowsToRender.from, rowsToRender.to);
            }
        } while (rowsToRender.renderRows);
    }
    renderPart(from, to) {
        this.scene.resetData();
        this.scene.renderFromTo(from, to);
        return this.scene.getPartialRawData(from, to);
    }
    getJob() { return this.scene.getRowsToRender(); }
    jobCompleted(jobResult) {
        var data = jobResult.data;
        this.scene.addPartialRawData(data);
    }
    execute() {
        this.initWorld();
        var canv = document.createElement("canvas");
        canv.width = this.width;
        canv.height = this.height;
        document.body.appendChild(canv);
        this.ctx = canv.getContext("2d");
        //this.renderWithWorkers();
        setInterval(() => this.renderImage(this.ctx), 2000);
    }
}
exports.Renderer = Renderer;
//# sourceMappingURL=render.js.map
"use strict";
import Vector from 'general/vector';
import Color from 'general/color';

import Material from 'path-tracing/material/material';
import BoundingBox from 'path-tracing/object/bounding-box';

import Scene from 'path-tracing/scene/scene';
import * as SceneData from 'path-tracing/scene/scene';

import * as ObjectFactory from 'path-tracing/object/factory';
import Factory from 'path-tracing/object/factory';
import Directions = ObjectFactory.Directions;

export default class Renderer {
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

    public renderRawData(ctx: CanvasRenderingContext2D) {
        do {
            var rowsToRender = this.scene.getRowsToRender();
            console.log(rowsToRender);
            if (rowsToRender.renderRows) {
                this.scene.renderFromTo(rowsToRender.from, rowsToRender.to);
            }
        } while (rowsToRender.renderRows);
    }

    public renderPart(from: number, to: number): SceneData.PartialRawData {
        this.scene.resetData();
        this.scene.renderFromTo(from, to);
        return this.scene.getPartialRawData(from, to);
    }

    private spawnWorker(): Worker {
        var worker = new Worker("render-worker.js");
        worker.onmessage = ev => {
            var data: SceneData.PartialRawData = ev.data;
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

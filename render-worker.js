/// <reference path="global_illumination.ts" />
var GlobalIllumination;
(function (GlobalIllumination) {
    importScripts('global_illumination.js');
    var renderer = new GlobalIllumination.Renderer();
    renderer.initWorld();
    onmessage = function (ev) {
        var from = ev.data.from;
        var to = ev.data.to;
        var part = renderer.renderPart(from, to);
        postMessage(part);
    };
})(GlobalIllumination || (GlobalIllumination = {}));

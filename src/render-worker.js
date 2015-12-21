define(["require", "exports", 'path-tracing/render'], function (require, exports, render_1) {
    var renderer = new render_1.default();
    renderer.initWorld();
    onmessage = (ev) => {
        var from = ev.data.from;
        var to = ev.data.to;
        var part = renderer.renderPart(from, to);
        postMessage(part);
    };
});
//# sourceMappingURL=render-worker.js.map
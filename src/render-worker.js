var render_1 = require('./path-tracing/render');
var renderer = new render_1.default();
renderer.initWorld();
onmessage = (ev) => {
    var from = ev.data.from;
    var to = ev.data.to;
    var part = renderer.renderPart(from, to);
    postMessage(part);
};
//# sourceMappingURL=render-worker.js.map
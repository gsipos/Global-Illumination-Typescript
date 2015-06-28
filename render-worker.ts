/// <reference path="global_illumination.ts" />
module GlobalIllumination {
	importScripts('global_illumination.js');
	var renderer = new Renderer();
	renderer.initWorld();
	onmessage = (ev) => {
		var from: number = ev.data.from;
		var to: number = ev.data.to;
		var part = renderer.renderPart(from, to);
		postMessage(part);
	};
}
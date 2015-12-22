"use strict";
var cluster = require('cluster');
var os = require('os');
var render_1 = require('./render');
class ClusterRenderer {
    constructor() {
        this.numCPUs = os.cpus().length;
        this.renderer = new render_1.default();
        this.renderer.initWorld();
    }
    execute() {
        if (cluster.isMaster) {
            for (var i = 0; i < this.numCPUs; i++) {
                var worker = cluster.fork();
                worker.on('message', msg => {
                    this.renderer.jobCompleted(msg);
                    this.giveJobToWorkerOrClose(worker);
                });
                this.giveJobToWorkerOrClose(worker);
            }
            cluster.on('exit', (worker, code, signal) => console.log('worker ' + worker.process.pid + ' died'));
        }
        else if (cluster.isWorker) {
            process.on('message', msg => this.getJobDone(msg));
        }
    }
    giveJobToWorkerOrClose(worker) {
        var job = this.renderer.getJob();
        if (job.renderRows) {
            worker.send(job);
        }
        else {
            worker.disconnect();
        }
    }
    getJobDone(msg) {
        var result = this.renderer.renderPart(msg.data.from, msg.data.to);
        console.log('Worker ' + process.pid + ' rendered: ' + msg.data.from + 'to ' + msg.data.to);
        process.send(result);
    }
}
exports.ClusterRenderer = ClusterRenderer;
//# sourceMappingURL=cluster-renderer.js.map
import * as cluster from 'cluster';
import * as os from 'os';

import Renderer from './render';

export default class ClusterRenderer {
    public numCPUs = os.cpus().length;
    public renderer = new Renderer();

    constructor() {
        this.renderer.initWorld();
    }

    public execute() {
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
            
        } else if (cluster.isWorker) {
            process.on('message', msg => process.send(this.renderer.renderPart(msg.data.from, msg.data.to)));
        }

    }
    private giveJobToWorkerOrClose(worker: cluster.Worker) {
        var job = this.renderer.getJob();
        if (job.renderRows) {
            worker.send(job);
        } else {
            worker.disconnect();
        }
    }
}
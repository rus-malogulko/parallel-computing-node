import { EventEmitter } from 'events';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { ProcessPool } from './process-pool.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workerFile = join(__dirname, 'workers', 'set-sum-worker.js');
const workers = new ProcessPool(workerFile, 2);

export class SetSumFork extends EventEmitter {
  constructor(sum, set) {
    super();
    this.sum = sum;
    this.set = set;
  }

  async start() {
    const worker = await workers.acquire();
    worker.send({ sum: this.sum, set: this.set });

    const onMessage = message => {
      if (message.event === 'end') {
        worker.removeListener('message', onMessage);
        workers.release(worker);
      }
      this.emit(message.event, message.data);
    }
    worker.on('message', onMessage);
  }
}

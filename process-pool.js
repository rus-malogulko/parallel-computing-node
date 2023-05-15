import { fork } from 'child_process';

export class ProcessPool {
  constructor(file, poolMax) {
    this.file = file;
    this.poolMax = poolMax;
    this.pool = [];
    this.active = [];
    this.waiting = [];
  }

  acquire(callback) {
    return new Promise((resolve, reject) => {
      let worker;

      if (this.pool.length > 0) {
        worker = this.pool.pop();
        this.active.push(worker);
        return resolve(worker);
      }

      if (this.active.length >= this.poolMax) {
        const waitingProcess = { resolve, reject };
        callback && callback();
        return this.waiting.push(waitingProcess);
      }

      worker = fork(this.file);

      worker.once('message', (message) => {
        if (message === 'ready') {
          this.active.push(worker);
          return resolve(worker);
        }

        worker.kill();
        reject(new Error('Improper process start.'));
      });

      worker.once('exit', code => {
        this.active = this.active.filter(w => worker !== w);
        this.pool = this.pool.filter(w => worker !== w);
        if (code !== 0) {
          return reject(new Error(`Exited with code ${code}`));
        }
      });
    });
  }

  release(worker) {
    if (this.waiting.length > 0) {
      const { resolve } = this.waiting.shift();
      return resolve(worker);
    }

    this.active = this.active.filter(w => worker !== w);
    this.pool.push(worker);
  }
}

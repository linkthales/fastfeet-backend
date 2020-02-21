import Bee from 'bee-queue';

import redisConfig from '../config/redis';
import ConfirmationMail from '../app/jobs/ConfirmationMail';
import CancellationMail from '../app/jobs/CancellationMail';

const jobs = [ConfirmationMail, CancellationMail];

class Queue {
  constructor() {
    this.queues = {};

    this.init();
  }

  init() {
    jobs.map(({ key, handle }) => {
      this.queues[key] = {
        bee: new Bee(key, {
          redis: redisConfig,
        }),
        handle,
      };
    });
  }

  add(queue, job) {
    return this.queues[queue].bee.createJob(job).save();
  }

  processQueue() {
    jobs.map(job => {
      const { bee, handle } = this.queues[job.key];

      return bee
        .on('succeeded', this.handleSuccess)
        .on('failed', this.handleFailure)
        .process(handle);
    });
  }

  handleSuccess(job) {
    console.info(`Job ${job.queue.name} - Succeeded`);
  }

  handleFailure(job, err) {
    console.error(`Job ${job.queue.name} - Failed - ${err}`);
  }
}

export default new Queue();

import 'dotenv/config';

import Queue from './lib/Queue';

Queue.processQueue();
console.info('Queue ready to process jobs');

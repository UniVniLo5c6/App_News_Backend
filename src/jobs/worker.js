/**
 * worker.js
 * 
 * Purpose: Worker process that handles background jobs.
 * Run this separately from the web server to process jobs.
 */

require('dotenv').config();
const {
  rssSyncQueue,
  notificationQueue,
  blogProcessQueue
} = require('./queues');
const {
  processRssSync,
  processNotification,
  processBlogTask
} = require('./processors');
const {
  scheduleRssSync,
  scheduleQueueCleanup
} = require('./scheduler');

// Process RSS sync jobs
rssSyncQueue.process('sync-source', processRssSync);

// Process notification jobs
notificationQueue.process('send', processNotification);

// Process blog tasks
blogProcessQueue.process('process', processBlogTask);

// Schedule recurring jobs
scheduleRssSync();
scheduleQueueCleanup();

// Error handling
const handleQueueError = (queue) => {
  queue.on('error', (error) => {
    console.error(`Queue ${queue.name} error:`, error);
  });
  
  queue.on('failed', (job, err) => {
    console.error(`Job ${job.id} in ${queue.name} failed:`, err);
  });
};

handleQueueError(rssSyncQueue);
handleQueueError(notificationQueue);
handleQueueError(blogProcessQueue);

console.log('Worker started processing jobs...');
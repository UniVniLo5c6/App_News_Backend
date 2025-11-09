/**
 * queues.js
 * 
 * Purpose: Configure and export Bull queues for background job processing.
 * Each queue handles a specific type of job (RSS sync, notifications, etc).
 */

const Queue = require('bull');
const Redis = require('ioredis');

// Redis connection config (with fallback to localhost)
const redisConfig = {
  port: process.env.REDIS_PORT || 6379,
  host: process.env.REDIS_HOST || 'localhost',
  password: process.env.REDIS_PASSWORD,
};

// Create queues with retry strategy
const defaultJobOptions = {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 2000, // Initial delay in ms
  },
  removeOnComplete: 100, // Keep last 100 completed jobs
  removeOnFail: 200,    // Keep last 200 failed jobs
};

// RSS sync queue - for fetching and storing RSS items
const rssSyncQueue = new Queue('rss-sync', {
  redis: redisConfig,
  defaultJobOptions,
});

// Notification queue - for sending emails, push notifications
const notificationQueue = new Queue('notifications', {
  redis: redisConfig,
  defaultJobOptions,
});

// Blog processing queue - for heavy operations like generating summaries
const blogProcessQueue = new Queue('blog-processing', {
  redis: redisConfig,
  defaultJobOptions,
});

// Export queues
module.exports = {
  rssSyncQueue,
  notificationQueue,
  blogProcessQueue,
};
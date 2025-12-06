/**
 * Queue Manager
 *
 * Responsibilities:
 * - Create and configure Bull queues
 * - Define global retry & cleanup behavior
 */

const Queue = require('bull');

// Redis connection configuration
const redisOptions = {
  port: process.env.REDIS_PORT || 6379,
  host: process.env.REDIS_HOST || 'localhost',
  password: process.env.REDIS_PASSWORD || undefined
};

// Default job retry & cleanup rules
const defaultJobOptions = {
  attempts: 5,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: 100,
  removeOnFail: 200
};

// Queue for JSON sync jobs
const jsonSyncQueue = new Queue('json-sync-queue', {
  redis: redisOptions,
  defaultJobOptions
});

// Queue for source discovery jobs
const sourceDiscoveryQueue = new Queue('source-discovery-queue', {
  redis: redisOptions,
  defaultJobOptions
});

// Queue for RSS fetching jobs
const rssFetchingQueue = new Queue('rss-fetching-queue', {
  redis: redisOptions,
  defaultJobOptions
});

// Queue for article content fetching jobs
const articleFetchQueue = new Queue('article-fetch-queue', {
  redis: redisOptions,
  defaultJobOptions
});

module.exports = {
  jsonSyncQueue,
  sourceDiscoveryQueue,
  rssFetchingQueue,
  articleFetchQueue
};

/**
 * Worker Process
 *
 * Responsibilities:
 * - Consume and process jobs
 * - Register scheduled tasks
 * - Handle queue errors
 */

require('dotenv').config();

const { jsonSyncQueue, sourceDiscoveryQueue, rssFetchingQueue } = require('./queues');
const { handleJsonSync, handleSourceDiscovery, handleRssSync } = require('./processors');
const { scheduleJsonSync, scheduleQueueCleanup, scheduleSourceDiscovery, scheduleRssSync } = require('./scheduler');

// Register processors
jsonSyncQueue.process('json-sync-task', handleJsonSync);
sourceDiscoveryQueue.process('source-discovery-task', handleSourceDiscovery);
rssFetchingQueue.process('rss-sync-task', handleRssSync);


// Start scheduled tasks
scheduleJsonSync();
scheduleQueueCleanup();
scheduleSourceDiscovery();
scheduleRssSync();

/**
 * Generic queue error listener
 */
const attachQueueErrorHandlers = (queue) => {
  queue.on('error', (error) => {
    console.error(`[Queue Error] ${queue.name}:`, error);
  });

  queue.on('failed', (job, error) => {
    console.error(`[Job Failed] ${queue.name} - Job ${job.id}:`, error);
  });
};

attachQueueErrorHandlers(jsonSyncQueue);
attachQueueErrorHandlers(sourceDiscoveryQueue);
attachQueueErrorHandlers(rssFetchingQueue);


console.log('JSON Sync Worker is running...');
console.log('Source Discovery Worker is running...');
console.log('RSS Sync Worker is running...');

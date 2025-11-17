/**
 * Worker Process
 *
 * Responsibilities:
 * - Consume and process jobs
 * - Register scheduled tasks
 * - Handle queue errors
 */

require('dotenv').config();

const { jsonSyncQueue } = require('./queues');
const { handleJsonSync } = require('./processors');
const { scheduleJsonSync, scheduleQueueCleanup } = require('./scheduler');

// Register processors
jsonSyncQueue.process('json-sync-task', handleJsonSync);

// Start scheduled tasks
scheduleJsonSync();
scheduleQueueCleanup();

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

console.log('JSON Sync Worker is running...');

/**
 * Cron Scheduler
 *
 * Responsibilities:
 * - Execute periodic jobs automatically
 * - Sync all sources on schedule
 * - Clean old jobs
 */

const { CronJob } = require('cron');
const { jsonSyncQueue, sourceDiscoveryQueue } = require('./queues');
const RssSource = require('../models/rssSource');

/**
 * Schedule hourly sync for all active JSON sources
 */
const scheduleJsonSync = () => {
  new CronJob(
    '*/10 * * * *',
    async () => {
      try {
        const sources = await RssSource.findAll({ where: { active: true } });

        for (const source of sources) {
          await jsonSyncQueue.add(
            'json-sync-task',
            { sourceId: source.id, url: source.url },
            {
              jobId: `json-sync-${source.id}`,
              removeOnComplete: true
            }
          );
        }
      } catch (error) {
        console.error('Failed to schedule JSON sync:', error);
      }
    },
    null,
    true
  );
};

/**
 * Clean old jobs daily
 */
const scheduleQueueCleanup = () => {
  new CronJob(
    '0 2 * * *',
    async () => {
      try {
        await jsonSyncQueue.clean(24 * 3600 * 1000, 'completed'); // completed jobs older than 24h
        await jsonSyncQueue.clean(7 * 24 * 3600 * 1000, 'failed'); // failed jobs older than 7 days
      } catch (error) {
        console.error('Failed to clean queue:', error);
      }
    },
    null,
    true
  );
};

/**
 * Schedule daily discovery of new sources.
 */
const scheduleSourceDiscovery = () => {
  new CronJob(
    '*/10 * * * *', // Runs every day at 3:00 AM
    async () => {
      try {
        console.log('Scheduling source discovery job...');
        await sourceDiscoveryQueue.add(
          'source-discovery-task',
          {}, // No data needed for this job
          {
            jobId: 'source-discovery-daily', // A unique ID for this repeatable job
            removeOnComplete: true
          }
        );
      } catch (error) {
        console.error('Failed to schedule source discovery job:', error);
      }
    },
    null,
    true
  );
};

module.exports = {
  scheduleJsonSync,
  scheduleQueueCleanup,
  scheduleSourceDiscovery
};

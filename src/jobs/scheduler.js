/**
 * scheduler.js
 * 
 * Purpose: Schedule recurring jobs using cron patterns.
 * Sets up periodic tasks like RSS sync and cleanup jobs.
 */

const { CronJob } = require('cron');
const { rssSyncQueue } = require('./queues');
const RssSource = require('../models/rssSource');

// Schedule RSS sync for all active sources every hour
const scheduleRssSync = () => {
  new CronJob('0 * * * *', async () => {
    try {
      // Get all active RSS sources
      const sources = await RssSource.findAll({
        where: { active: true }
      });
      
      // Add sync job for each source
      for (const source of sources) {
        await rssSyncQueue.add('sync-source', {
          sourceId: source.id,
          url: source.url,
        }, {
          // Don't schedule if already pending
          jobId: `sync-source-${source.id}`,
          removeOnComplete: true
        });
      }
    } catch (err) {
      console.error('Failed to schedule RSS sync jobs:', err);
    }
  }, null, true);
};

// Clean up old completed jobs daily at 2 AM
const scheduleQueueCleanup = () => {
  new CronJob('0 2 * * *', async () => {
    try {
      await rssSyncQueue.clean(24 * 3600 * 1000, 'completed');
      await rssSyncQueue.clean(7 * 24 * 3600 * 1000, 'failed');
    } catch (err) {
      console.error('Failed to clean job queues:', err);
    }
  }, null, true);
};

// Export scheduler functions
module.exports = {
  scheduleRssSync,
  scheduleQueueCleanup
};
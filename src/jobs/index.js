/**
 * Job Dispatcher
 *
 * Responsibilities:
 * - Expose helper functions to enqueue JSON sync jobs
 * - Export all job queues
 */

const { jsonSyncQueue } = require('./queues');

/**
 * Enqueue a JSON sync job for a specific source.
 */
const enqueueJsonSync = async (sourceId, url) => {
  return jsonSyncQueue.add(
    'json-sync-task',
    { sourceId, url },
    {
      jobId: `json-sync-${sourceId}`,
      removeOnComplete: true
    }
  );
};

module.exports = {
  queues: { jsonSyncQueue },
  enqueueJsonSync
};

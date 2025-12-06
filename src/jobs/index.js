/**
 * Job Dispatcher
 *
 * Responsibilities:
 * - Expose helper functions to enqueue JSON sync jobs
 * - Export all job queues
 */

const { jsonSyncQueue, articleFetchQueue } = require('./queues');

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

/**
 * Enqueue a job to fetch article content from an RSS item.
 */
const enqueueArticleFetch = async (rssItemId) => {
  return articleFetchQueue.add(
    'fetch-article-task',
    { rssItemId },
    {
      jobId: `article-fetch-${rssItemId}`,
      removeOnComplete: true
    }
  );
};

module.exports = {
  queues: { jsonSyncQueue, articleFetchQueue },
  enqueueJsonSync,
  enqueueArticleFetch
};

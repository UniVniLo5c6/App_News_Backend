/**
 * index.js
 * 
 * Purpose: Export configured queues and helper functions for job creation.
 */

const { 
  rssSyncQueue, 
  notificationQueue,
  blogProcessQueue 
} = require('./queues');

// Helper to schedule RSS sync for a source
const scheduleRssSync = async (sourceId, url) => {
  return rssSyncQueue.add('sync-source', {
    sourceId,
    url
  }, {
    jobId: `sync-source-${sourceId}`,
    removeOnComplete: true
  });
};

// Helper to queue a notification
const queueNotification = async (type, userId, data) => {
  return notificationQueue.add('send', {
    type,
    userId,
    data
  });
};

// Helper to queue blog processing
const queueBlogTask = async (type, blogId, options = {}) => {
  return blogProcessQueue.add('process', {
    type,
    blogId,
    ...options
  });
};

module.exports = {
  queues: {
    rssSyncQueue,
    notificationQueue,
    blogProcessQueue
  },
  scheduleRssSync,
  queueNotification,
  queueBlogTask
};
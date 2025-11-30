/**
 * JSON Processor
 *
 * Responsibilities:
 * - Fetch JSON content from a news source
 * - Parse and extract articles
 * - Save or update database records
 */

const axios = require('axios');
const RssSource = require('../models/rssSource');
const RssItem = require('../models/rssItem');
require('dotenv').config();
/**
 * Process JSON sync job
 */
const GNEWS_API_KEY = process.env.JSON_API_KEY;
const TOPICS = ['breaking-news', 'world', 'nation', 'business', 'technology', 'entertainment', 'sports', 'science', 'health'];

const buildGNewsUrl = (sourceUrl) => {
  const siteName = encodeURIComponent(new URL(sourceUrl).hostname);
  const randomTopic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  const url = `https://gnews.io/api/v4/top-headlines?topic=${randomTopic}&country=vn&max=20&apikey=${GNEWS_API_KEY}`;
  return { url, topic: randomTopic };
};
const handleJsonSync = async (job) => {
  const { sourceId, url: sourceUrl } = job.data;

  try {
    await job.progress(10);

    // Fetch JSON data
    const { url, topic } = buildGNewsUrl(sourceUrl);
    const response = await axios.get(url);
    const data = response.data;

    await job.progress(30);

    const articles = data?.articles || [];
    const total = data?.totalArticles || articles.length;

    console.log(`Syncing ${articles.length}/${total} articles from source ${sourceId} on topic ${topic}`);

    // Save each article
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];

      const existing = await RssItem.findOne({
        where: { url: article.url }
      });

      if (!existing) {
        await RssItem.create({
          sourceId,
          title: article.title || '',
          content: article.content || '',
          summary: article.description || '',
          url: article.url,
          publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
          author: article.author || null,
          topic: topic
        });
      }

      // Update job progress %
      await job.progress(30 + (60 * (i + 1)) / articles.length);
    }

    // Update last sync timestamp
    await RssSource.update(
      { lastSyncAt: new Date() },
      { where: { id: sourceId } }
    );

    return { processed: articles.length };

  } catch (error) {
    console.error(`JSON sync failed for source ${sourceId}:`, error);
    throw error;
  }
};

module.exports = {
  handleJsonSync
};

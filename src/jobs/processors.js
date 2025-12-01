/**
 * JSON Processor
 *
 * Responsibilities:
 * - Fetch JSON content from a news source
 * - Parse and extract articles
 * - Save or update database records
 */

const axios = require('axios');
const Parser = require('rss-parser');
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

    // Touch the record to update the 'updatedAt' timestamp, indicating a sync occurred.
    await RssSource.update(
      { url: sourceUrl },
      { where: { id: sourceId } }
    );

    return { processed: articles.length };

  } catch (error) {
    console.error(`JSON sync failed for source ${sourceId}:`, error);
    throw error;
  }
};

/**
 * Job processor to discover new news sources from GNews API.
 */
const handleSourceDiscovery = async (job) => {
  console.log('Starting source discovery job...');
  const url = `https://gnews.io/api/v4/top-headlines?q=google&lang=vi&apikey=${GNEWS_API_KEY}`;

  try {
    await job.progress(10);

    // Fetch sources from GNews
    const response = await axios.get(url);
    const articles = response.data?.articles || [];
    const sources = articles.map(a => a.source);
    console.log(`Found ${sources.length} sources from GNews API.`);
    await job.progress(30);

    let newSourcesCount = 0;
    
    // Process each source
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      if ( !source || !source.url) {
        console.log(`Skipping source with no URL: ${source.name}`);
        continue;
      }

      // Normalize URL to avoid case and trailing slash issues
      const normalizedUrl = source.url.trim().toLowerCase().replace(/\/$/, '');

      // Check if the source already exists
      const existing = await RssSource.findOne({
        where: { url: normalizedUrl }
      });

      if (!existing) {
        // Create new source if it doesn't exist
        await RssSource.create({
          name: source.name,
          url: normalizedUrl, // Store the normalized URL
        });
        newSourcesCount++;
        console.log(`Added new source: ${source.name} (URL: ${normalizedUrl})`);
      } else {
        // Add logging for skipped sources
        console.log(`Skipping existing source: ${source.name} (URL: ${normalizedUrl})`);
      }
      
      // Update job progress
      await job.progress(30 + (70 * (i + 1)) / sources.length);
    }

    console.log(`Source discovery job finished. Added ${newSourcesCount} new sources.`);
    return { discovered: newSourcesCount };

  } catch (error) {
    console.error('Source discovery job failed:', error.message);
    if (error.response) {
      console.error('GNews API response error:', error.response.data);
    }
    throw error;
  }
};

const handleRssSync = async (job) => {
    const { sourceId, url: sourceUrl } = job.data;
    const parser = new Parser();

    try {
        await job.progress(10);

        // Fetch and parse RSS feed
        const feed = await parser.parseURL(sourceUrl);
        await job.progress(30);

        const items = feed.items || [];
        console.log(`Syncing ${items.length} articles from RSS source ${sourceId}`);

        // Save each article
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const randomTopic = TOPICS[Math.floor(Math.random() * TOPICS.length)];

            const existing = await RssItem.findOne({
                where: { url: item.link }
            });

            if (!existing) {
                await RssItem.create({
                    sourceId,
                    title: item.title || '',
                    content: item.content || item.contentSnippet || '',
                    summary: item.contentSnippet || '',
                    url: item.link,
                    publishedAt: item.isoDate ? new Date(item.isoDate) : null,
                    author: item.creator || item.author || null,
                    topic: randomTopic
                });
            }

            // Update job progress %
            await job.progress(30 + (60 * (i + 1)) / items.length);
        }

        // Touch the record to update the 'updatedAt' timestamp, indicating a sync occurred.
        await RssSource.update(
            { url: sourceUrl },
            { where: { id: sourceId } }
        );

        return { processed: items.length };

    } catch (error) {
        console.error(`RSS sync failed for source ${sourceId}:`, error);
        throw error;
    }
};

module.exports = {
  handleJsonSync,
  handleSourceDiscovery,
  handleRssSync
};

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

const syncAllRssSources = async (job) => {
  console.log('Starting RSS sync for all active sources...');
  const parser = new Parser();
  let totalNewItems = 0;

  try {
    // 1. Fetch all active RSS sources
    const sources = await RssSource.findAll({ where: { active: true } });
    if (sources.length === 0) {
      console.log('No active RSS sources to sync.');
      await job.progress(100);
      return { processed: 0, newItems: 0 };
    }
    
    console.log(`Found ${sources.length} active source(s).`);
    await job.progress(10);

    // 2. Process each source
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      let newItemsInSource = 0;
      
      try {
        console.log(`Fetching feed for: ${source.name} (${source.url})`);
        const feed = await parser.parseURL(source.url);
        const items = feed.items || [];

        // 3. Process each item in the feed
        for (const item of items) {
          if (!item.link) continue; // Skip items without a link

          const existingItem = await RssItem.findOne({ where: { url: item.link } });

          if (!existingItem) {
            await RssItem.create({
              sourceId: source.id,
              title: item.title || 'No Title',
              content: item.content || item.contentSnippet || '',
              summary: item.contentSnippet || item.summary || '',
              url: item.link,
              publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
              author: item.creator || item.author || 'Unknown',
            });
            newItemsInSource++;
          }
        }
        
        // 4. Update source's last sync timestamp
        source.changed('updatedAt', true);
        await source.save();

        if (newItemsInSource > 0) {
          console.log(`Added ${newItemsInSource} new items from ${source.name}.`);
          totalNewItems += newItemsInSource;
        }

      } catch (feedError) {
        console.error(`Failed to sync source "${source.name}" (ID: ${source.id}): ${feedError.message}`);
        // Continue to the next source
      }

      // 5. Update overall job progress
      await job.progress(10 + (90 * (i + 1)) / sources.length);
    }

    console.log(`Finished RSS sync. Total new items added: ${totalNewItems}.`);
    return { processed: sources.length, newItems: totalNewItems };

  } catch (error) {
    console.error('Fatal error during RSS sync job:', error);
    throw error;
  }
};


module.exports = {
  handleJsonSync,
  handleSourceDiscovery,
  handleRssSync,
  syncAllRssSources
};

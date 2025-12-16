/**
 * JSON Processor
 *
 * Responsibilities:
 * - Fetch JSON content from a news source
 * - Parse and extract articles
 * - Save or update database records
 */

const { articleFetchQueue } = require('./queues');
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
        const newRssItem = await RssItem.create({
          sourceId,
          title: article.title || '',
          content: article.content || '',
          summary: article.description || '',
          url: article.url,
          publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
          author: article.author || null,
          topic: topic
        });
        // Enqueue a job to fetch the article content
        await articleFetchQueue.add('fetch-article-task', { rssItemId: newRssItem.id });
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
                const newRssItem = await RssItem.create({
                    sourceId,
                    title: item.title || '',
                    content: item.content || item.contentSnippet || '',
                    summary: item.contentSnippet || '',
                    url: item.link,
                    publishedAt: item.isoDate ? new Date(item.isoDate) : null,
                    author: item.creator || item.author || null,
                    topic: randomTopic
                });
                // Enqueue a job to fetch the article content
                await articleFetchQueue.add('fetch-article-task', { rssItemId: newRssItem.id });
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
            const newRssItem = await RssItem.create({
              sourceId: source.id,
              title: item.title || 'No Title',
              content: item.content || item.contentSnippet || '',
              summary: item.contentSnippet || item.summary || '',
              url: item.link,
              publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
              author: item.creator || item.author || 'Unknown',
            });
            // Enqueue a job to fetch the article content
            await articleFetchQueue.add('fetch-article-task', { rssItemId: newRssItem.id });
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

const cheerio = require('cheerio');

/**
 * Extracts and cleans article HTML
 */
const extractAndFormatArticleHtml = (html) => {
  const $ = cheerio.load(html);

  // 0. Remove unwanted elements
  $('script, style, noscript, iframe.ad, div.ad, .advertisement, .ads, comments, .promo').remove();

  // 1. Find the best article container
  const selectors = [
    "article",
    ".article-body",
    ".article-content",
    ".post-body",
    ".post-content",
    ".entry-content",
    "#content",
    ".content",
    "#main",
    ".main",
    "[role='main']"
  ];

  let bestElement = null;
  let maxTextLength = 0;

  for (const selector of selectors) {
    const elements = $(selector);
    elements.each((i, el) => {
      const currentTextLength = $(el).text().length;
      if (currentTextLength > maxTextLength) {
        maxTextLength = currentTextLength;
        bestElement = el;
      }
    });
  }

  const context = bestElement ? $(bestElement) : $('body');

  // 2. Build clean HTML
  let resultHtml = "";
  context.find('p, h2, h3, h4, img, figure, iframe, video').each((i, element) => {
    const el = $(element);

    // Skip nested figure content
    if (el.parents('figure').length > 0 && !el.is('figure')) return;

    const tagName = el.prop('tagName').toLowerCase();

    if (tagName === 'p' || tagName === 'h2' || tagName === 'h3' || tagName === 'h4') {
      resultHtml += $.html(el) + '\n';

    } else if (tagName === 'img') {
      // Handle lazy-load images
      el.attr('src', el.attr('src') || el.attr('data-src') || '');
      if (!el.attr('alt')) el.attr('alt', '');
      resultHtml += $.html(el) + '\n';

    } else if (tagName === 'figure') {
      const img = el.find('img');
      if (img.length) {
        const caption = el.find('figcaption').text().trim();
        img.attr('src', img.attr('src') || img.attr('data-src') || '');
        img.attr('alt', img.attr('alt') || caption || '');
        resultHtml += $.html(img) + '\n';
      }

    } else if (tagName === 'iframe' || tagName === 'video') {
      // Keep iframe/video as-is
      resultHtml += $.html(el) + '\n';
    }
  });

  return resultHtml.trim();
};


/**
 * Fetch article content from an RSS item's URL and save it to the Article table.
 * 
 * This processor:
 * - Retrieves the RSS item from the database.
 * - Fetches the live content from the item's URL.
 * - Parses and cleans the HTML to extract the core article body.
 * - Creates or updates an Article record with the clean content.
 */
const handleArticleFetch = async (job) => {
  const { rssItemId } = job.data;
  console.log(`Starting article fetch job for RSS item ID: ${rssItemId}`);

  try {
    await job.progress(10);

    // 1. Fetch the RSS item
    const rssItem = await RssItem.findByPk(rssItemId);
    if (!rssItem) {
      throw new Error(`RSS item ${rssItemId} not found`);
    }
    if (!rssItem.url) {
      throw new Error(`URL is missing for RSS item ${rssItemId}`);
    }

    console.log(`- Fetching content from: ${rssItem.url}`);
    await job.progress(30);

    // 2. Fetch live article content from the web
    const response = await axios.get(rssItem.url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" }
    });

    // 3. Extract and clean the HTML
    const finalHtml = extractAndFormatArticleHtml(response.data);
    await job.progress(60);

    if (!finalHtml || finalHtml.length < 50) {
      console.log(`- No valid content extracted from URL, skipping DB update.`);
      return { articleId: null, rssItemId, status: 'skipped_no_content' };
    }

    // 4. Check if article already exists and create/update
    const Article = require('../models/article');
    let article = await Article.findOne({ where: { rssItemId } });

    if (article) {
      // Update existing article
      article.content = finalHtml;
      // Also update title in case it changed in the RSS feed
      article.title = rssItem.title; 
      await article.save();
      console.log(`- Updated article ${article.id} from RSS item ${rssItemId}`);
    } else {
      // Create new article
      article = await Article.create({
        title: rssItem.title,
        content: finalHtml,
        rssItemId: rssItemId,
        // authorId can be associated if logic is added later
      });
      console.log(`- Created new article ${article.id} from RSS item ${rssItemId}`);
    }

    await job.progress(100);

    return { articleId: article.id, rssItemId, status: 'processed' };

  } catch (error) {
    console.error(`- Article fetch failed for RSS item ${rssItemId}: ${error.message}`);
    // Rethrow the error to allow the job queue to handle retries
    throw error;
  }
};


module.exports = {
  handleJsonSync,
  handleSourceDiscovery,
  handleRssSync,
  syncAllRssSources,
  handleArticleFetch
};

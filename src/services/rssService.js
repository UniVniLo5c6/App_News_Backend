/**
 * rssService.js
 *
 * Purpose: Small service responsible for fetching RSS feeds and storing new
 * items into the database. Exposes two functions:
 *  - fetchAndStoreSource(source): fetches one source and returns created items
 *  - syncAllSources(): fetches all active sources and returns all created items
 */

const Parser = require('rss-parser');
const parser = new Parser();
const RssSource = require('../models/rssSource');
const RssItem = require('../models/rssItem');

/**
 * Fetch a single RssSource.url, dedupe items by link and store new items.
 *
 * Params: source (RssSource model instance)
 * Returns: Array of created RssItem instances (may be empty).
 */
async function fetchAndStoreSource(source) {
  try {
    const feed = await parser.parseURL(source.url);
    const items = feed.items || [];
    const results = [];
    for (const it of items) {
      // dedupe by url
      if (!it.link) continue;
      const existing = await RssItem.findOne({ where: { url: it.link } });
      if (existing) continue;
      const created = await RssItem.create({
        sourceId: source.id,
        title: it.title || '(no title)',
        content: it.content || it.contentSnippet || '',
        url: it.link,
        summary: '',
        publishedAt: it.isoDate ? new Date(it.isoDate) : (it.pubDate ? new Date(it.pubDate) : null),
        author: it.creator || it.author || null,
        topic: source.tag || null
      });
      results.push(created);
    }
    return results;
  } catch (err) {
    console.error('fetchAndStoreSource error', source.url, err.message);
    return [];
  }
}

/**
 * Sync all active sources by fetching and storing their new items.
 *
 * Returns: Array of all created RssItem instances across all active sources.
 */
async function syncAllSources() {
  const sources = await RssSource.findAll({ where: { active: true } });
  const all = [];
  for (const s of sources) {
    const res = await fetchAndStoreSource(s);
    all.push(...res);
  }
  return all;
}

module.exports = { fetchAndStoreSource, syncAllSources };

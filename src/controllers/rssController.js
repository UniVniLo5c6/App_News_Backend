/**
 * rssController.js
 *
 * Purpose: Provide endpoints for managing RSS sources and items, searching,
 * summarizing and syncing feeds. Mounted under `/api/rss`.
 * Methods return JSON payloads and use HTTP status codes for errors.
 */

const RssSource = require('../models/rssSource');
const RssItem = require('../models/rssItem');
const { syncAllSources, findRssFeedUrl } = require('../services/rssService');

/**
 * List recent RSS items.
 *
 * Returns: 200 JSON array of items (includes source info), up to 100 most recent.
 */
exports.listItems = async (req, res) => {
  try {
    const items = await RssItem.findAll({ include: [{ model: RssSource, as: 'source', attributes: ['id','name','tag'] }], order: [['publishedAt','DESC']], limit: 100 });
    return res.json(items);
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Get all configured RSS sources.
 *
 * Returns: 200 JSON array of source objects.
 */
exports.getSources = async (req, res) => {
  try { const sources = await RssSource.findAll(); return res.json(sources); } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Create a new RSS source by discovering the feed URL from a website URL.
 *
 * Body: { name, url, tag, active } where 'url' is the website's URL.
 * Returns: 201 JSON created source, or 400 if RSS feed not found.
 */
exports.createSource = async (req, res) => {
  try {
    const { name, url, tag, active } = req.body;

    // Use the service to find the actual RSS feed URL from the provided site URL
    const discoveredRssUrl = await findRssFeedUrl(url);

    if (!discoveredRssUrl) {
      return res.status(400).json({ message: 'Could not automatically discover RSS feed from the provided URL. Please provide the direct RSS feed URL.' });
    }

    // Create the source using the discovered URL
    const s = await RssSource.create({
      name,
      url: discoveredRssUrl, // Use the discovered URL
      tag,
      active: !!active
    });

    return res.status(201).json(s);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update an existing RSS source.
 *
 * Params: id
 * Body: { name?, url?, tag?, active? }
 * Returns: 200 JSON updated source or 404 if not found.
 */
exports.updateSource = async (req, res) => {
  try { const s = await RssSource.findByPk(req.params.id); if (!s) return res.status(404).json({ message: 'Not found' }); const { name, url, tag, active } = req.body; if (name) s.name = name; if (url) s.url = url; if (typeof tag !== 'undefined') s.tag = tag; if (typeof active !== 'undefined') s.active = !!active; await s.save(); return res.json(s); } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Delete an RSS source.
 *
 * Params: id
 * Returns: 200 JSON { message: 'Deleted' } or 404 if not found.
 */
exports.deleteSource = async (req, res) => {
  try { const s = await RssSource.findByPk(req.params.id); if (!s) return res.status(404).json({ message: 'Not found' }); await s.destroy(); return res.json({ message: 'Deleted' }); } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Get trending items (simple heuristic: most recent).
 *
 * Returns: 200 JSON array of up to 20 items.
 */
exports.trending = async (req, res) => {
  try {
    // simple trending: most recent items
    const items = await RssItem.findAll({ order: [['publishedAt','DESC']], limit: 20, include: [{ model: RssSource, as: 'source', attributes: ['id','name'] }] });
    return res.json(items);
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Search RSS items by title or content.
 *
 * Query: ?q=searchTerm
 * Returns: 200 JSON array of matching items (up to 100) or 400 if q missing.
 */
exports.search = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.status(400).json({ message: 'q query required' });
    const items = await RssItem.findAll({ where: { [require('sequelize').Op.or]: [ { title: { [require('sequelize').Op.like]: `%${q}%` } }, { content: { [require('sequelize').Op.like]: `%${q}%` } } ] }, limit: 100, order: [['publishedAt','DESC']] });
    return res.json(items);
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Return a short summary for an RSS item.
 *
 * Params: id
 * If a stored summary exists, returns it; otherwise returns a naive trimmed
 * version of the content.
 * Returns: 200 JSON { id, summary } or 404 if item missing.
 */
exports.summary = async (req, res) => {
  try {
    const item = await RssItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    if (item.summary && item.summary.trim()) return res.json({ id: item.id, summary: item.summary });
    // naive summary: first 300 chars of content
    const s = (item.content || '').replace(/<[^>]*>/g, '').slice(0,300);
    return res.json({ id: item.id, summary: s });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Trigger a sync of all RSS sources (imports new items).
 *
 * Returns: 200 JSON { imported } with number of imported items.
 */
exports.sync = async (req, res) => {
  try {
    const items = await syncAllSources();
    return res.json({ imported: items.length });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * List RSS items by topic/tag.
 *
 * Params: tag
 * Returns: 200 JSON array of items with matching topic.
 */
exports.topic = async (req, res) => {
  try {
    const tag = req.params.tag;
    const items = await RssItem.findAll({ where: { topic: tag }, order: [['publishedAt','DESC']], limit: 100 });
    return res.json(items);
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

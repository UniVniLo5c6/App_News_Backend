/**
 * miscController.js
 *
 * Purpose: Miscellaneous endpoints such as data downloads and social share
 * recording. Returns JSON payloads or file downloads where appropriate.
 */

const { Op } = require('sequelize');
const RssItem = require('../models/rssItem');
const Article = require('../models/article');
const Blog = require('../models/blog');
const SocialShare = require('../models/socialShare');

/**
 * Download recent records as JSON file.
 *
 * Params: type (rss|articles|blogs)
 * Returns: attachment JSON file containing up to 100 records of the requested type.
 */
exports.download = async (req, res) => {
  const type = req.params.type;
  try {
    let data = [];
    if (type === 'rss') data = await RssItem.findAll({ limit: 100, order: [['publishedAt','DESC']] });
    else if (type === 'articles') data = await Article.findAll({ limit: 100, order: [['createdAt','DESC']] });
    else if (type === 'blogs') data = await Blog.findAll({ limit: 100, order: [['createdAt','DESC']] });
    else return res.status(400).json({ message: 'Unknown type' });

    // Return JSON as downloadable file
    res.setHeader('Content-Disposition', `attachment; filename="${type}.json"`);
    res.setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify(data, null, 2));
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Record a social share event and (when available) redirect to original item URL.
 *
 * Params: id
 * Query: ?platform=&type=
 * Returns: redirect to original URL when available, or 200 JSON { message } / shareUrl.
 */
exports.share = async (req, res) => {
  try {
    const { id } = req.params;
    const platform = req.query.platform || 'unknown';
    const itemType = req.query.type || 'rss';
    const userId = req.user ? req.user.id : null;
    // record share
    await SocialShare.create({ userId, itemType, itemId: String(id), platform });

    // For rss/blog/article, redirect to original URL if available
    if (itemType === 'rss') {
      const item = await RssItem.findByPk(id);
      if (item && item.url) return res.redirect(item.url);
    }
    if (itemType === 'article') {
      const a = await Article.findByPk(id);
      if (a && a.url) return res.redirect(a.url);
    }
    if (itemType === 'blog') {
      const b = await Blog.findByPk(id);
      if (b) return res.json({ shareUrl: `/blog/${b.id}`, message: 'Local blog share' });
    }

    return res.json({ message: 'Shared' });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * articleController.js
 *
 * Purpose: Provide CRUD operations for articles. Mounted under `/api/articles`.
 * Methods return JSON payloads and appropriate HTTP status codes.
 */

const Article = require('../models/article');
const User = require('../models/user');
const RssItem = require('../models/rssItem');

/**
 * List all articles.
 *
 * Query: optional pagination/filters (not implemented by default).
 * Returns: 200 JSON array of article objects (includes author relation).
 */
exports.list = async (req, res) => {
  try {
    // Support both `topic` and `category` query parameters for compatibility
    const topic = req.query.topic || req.query.category;

    const include = [
      { model: User, as: 'author', attributes: ['id', 'name', 'email'] }
    ];

    // If topic is provided, join the RssItem and filter by topic
    if (topic) {
      include.push({ model: RssItem, as: 'rssItem', where: { topic }, attributes: ['id', 'topic', 'url', 'summary'] });
    } else {
      // include rssItem data for convenience (optional)
      include.push({ model: RssItem, as: 'rssItem', attributes: ['id', 'topic'] });
    }

    const articles = await Article.findAll({ include, order: [['createdAt', 'DESC']] });
    return res.json(articles);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * List articles by topic (route helper).
 * Uses the same logic as `list` but reads topic from `req.params.topic`.
 */
exports.listByTopic = async (req, res) => {
  req.query.topic = req.params.topic;
  return exports.list(req, res);
};

/**
 * Get a single article by id.
 *
 * Params: id
 * Returns: 200 JSON article object or 404 if not found.
 */
exports.get = async (req, res) => {
  try {
    const idParam = req.params.id;

    // Try to find by article primary key first
    let article = await Article.findByPk(idParam, {
      include: [ { model: User, as: 'author', attributes: ['id', 'name', 'email'] }, { model: RssItem, as: 'rssItem', attributes: ['id','topic','url','summary'] } ]
    });

    // If not found by PK, allow fetching by rssItemId for compatibility
    if (!article) {
      const rssItemId = Number(idParam);
      if (!Number.isNaN(rssItemId)) {
        article = await Article.findOne({ where: { rssItemId }, include: [ { model: User, as: 'author', attributes: ['id','name','email'] }, { model: RssItem, as: 'rssItem', attributes: ['id','topic','url','summary'] } ] });
      }
    }

    if (!article) return res.status(404).json({ message: 'Not found' });

    return res.json(article);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};


/**
 * Create a new article.
 *
 * Auth required. Body: { title, content }
 * Returns: 201 JSON created article object.
 */
exports.create = async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ message: 'Missing fields' });
  try {
    const article = await Article.create({ title, content, authorId: req.user.id });
    return res.status(201).json(article);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete an article.
 *
 * Params: id
 * Auth required. Only owner may delete (admin check not implemented here).
 * Returns: 200 JSON { message: 'Deleted' } or 403/404 on errors.
 */
exports.remove = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) return res.status(404).json({ message: 'Not found' });
    if (article.authorId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    await article.destroy();
    return res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

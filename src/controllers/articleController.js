/**
 * articleController.js
 *
 * Purpose: Provide CRUD operations for articles. Mounted under `/api/articles`.
 * Methods return JSON payloads and appropriate HTTP status codes.
 */

const Article = require('../models/article');
const User = require('../models/user');

/**
 * List all articles.
 *
 * Query: optional pagination/filters (not implemented by default).
 * Returns: 200 JSON array of article objects (includes author relation).
 */
exports.list = async (req, res) => {
  try {
    const { rssitemid } = req.query;
    const where = {};

    if (rssitemid) {
      where.rssItemId = rssitemid;
    }

    const articles = await Article.findAll({ where, include: [{ model: User, as: 'author', attributes: ['id', 'name', 'email'] }], order: [['createdAt', 'DESC']] });
    return res.json(articles);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get a single article by id.
 *
 * Params: id
 * Returns: 200 JSON article object or 404 if not found.
 */
exports.get = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const article = await Article.findByPk(id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

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

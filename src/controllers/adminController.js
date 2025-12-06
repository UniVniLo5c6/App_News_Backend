/**
 * adminController.js
 *
 * Purpose: Administrative endpoints for user management, stats and logs.
 * Protected by admin middleware.
 */

const User = require('../models/user');
const Activity = require('../models/activity');
const RssItem = require('../models/rssItem');
const Blog = require('../models/blog');
const Article = require('../models/article');

/**
 * List all users (admin).
 *
 * Returns: 200 JSON array of users with limited attributes.
 */
exports.listUsers = async (req, res) => {
  try {
    const users = await User.findAll({ attributes: ['id', 'name', 'email', 'role', 'emailVerified', 'createdAt'] });
    return res.json(users);
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Delete a user (admin).
 *
 * Params: id
 * Returns: 200 JSON { message: 'Deleted' } or 404.
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    await user.destroy();
    return res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Update a user's role or emailVerified flag (admin).
 *
 * Params: id
 * Body: { role?, emailVerified? }
 * Returns: 200 JSON updated user public object.
 */
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    const { role, emailVerified } = req.body;
    if (role) user.role = role;
    if (typeof emailVerified !== 'undefined') user.emailVerified = !!emailVerified;
    await user.save();
    return res.json({ id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Return simple application stats (counts).
 *
 * Returns: 200 JSON { users, activities, rssItems, blogs, articles }
 */
exports.stats = async (req, res) => {
  try {
    const users = await User.count();
    const activities = await Activity.count();
    const rssItems = await RssItem.count();
    const blogs = await Blog.count();
    const articles = await Article.count();
    return res.json({ users, activities, rssItems, blogs, articles });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Return recent activity logs as admin logs.
 *
 * Returns: 200 JSON array of Activity records (limit 200).
 */
exports.logs = async (req, res) => {
  try {
    // return recent activities as admin logs
    const logs = await Activity.findAll({ order: [['createdAt','DESC']], limit: 200 });
    return res.json(logs);
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * List latest articles for admin dashboard.
 *
 * Query: page (default 1), limit (default 20)
 * Returns: 200 JSON { articles, total, page, limit }
 */
exports.listArticles = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const { count, rows } = await Article.findAndCountAll({
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'email'] },
        { model: require('../models/rssItem'), as: 'rssItem', attributes: ['id', 'topic', 'url', 'summary'] }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return res.json({
      articles: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

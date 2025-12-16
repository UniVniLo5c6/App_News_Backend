/**
 * blogController.js
 *
 * Purpose: Manage blog posts, comments, likes, follows, reports, categories and tags.
 * Mounted under `/api/blogs`.
 */

const Blog = require('../models/blog');
const BlogComment = require('../models/blogComment');
const BlogLike = require('../models/blogLike');
const BlogFollow = require('../models/blogFollow');
const BlogReport = require('../models/blogReport');
const BlogCategory = require('../models/blogCategory');
const BlogTag = require('../models/blogTag');
const BlogTagMap = require('../models/blogTagMap');
const User = require('../models/user');
const { Op } = require('sequelize');

/**
 * List blog posts with optional pagination and category filter.
 *
 * Query: ?page=&limit=&category=
 * Returns: 200 JSON array of blog posts.
 */
exports.list = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1'));
    const limit = Math.min(50, parseInt(req.query.limit || '20'));
    const offset = (page - 1) * limit;
    const where = {};
    if (req.query.category) where.categoryId = req.query.category;
    const items = await Blog.findAll({ where, include: [{ model: User, as: 'author', attributes: ['id', 'name', 'email'] }], order: [['createdAt','DESC']], limit, offset });
    return res.json(items);
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Create a blog post.
 *
 * Auth required. Body: { title, content, excerpt?, categoryId?, tags? }
 * Tags is an array of names. Returns: 201 JSON created blog.
 */
exports.create = async (req, res) => {
  try {
    const user = req.user;
    const { title, content, excerpt, categoryId, tags } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'title and content required' });
    const blog = await Blog.create({ authorId: user.id, title, content, excerpt: excerpt || '', categoryId: categoryId || null, published: true });
    // tags: array of names
    if (Array.isArray(tags)) {
      for (const t of tags) {
        let tag = await BlogTag.findOne({ where: { name: t } });
        if (!tag) tag = await BlogTag.create({ name: t });
        await BlogTagMap.create({ blogId: blog.id, tagId: tag.id }).catch(()=>{});
      }
    }
    return res.status(201).json(blog);
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Update a blog post (owner or admin).
 *
 * Params: id
 * Body: { title?, content?, excerpt?, published?, categoryId?, tags? }
 * Returns: 200 JSON updated blog.
 */
exports.update = async (req, res) => {
  try {
    const user = req.user;
    const blog = await Blog.findByPk(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Not found' });
    if (blog.authorId !== user.id && user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const { title, content, excerpt, published, categoryId, tags } = req.body;
    if (title) blog.title = title;
    if (content) blog.content = content;
    if (typeof excerpt !== 'undefined') blog.excerpt = excerpt;
    if (typeof published !== 'undefined') blog.published = !!published;
    if (typeof categoryId !== 'undefined') blog.categoryId = categoryId;
    await blog.save();
    if (Array.isArray(tags)) {
      // remove existing mappings then add
      await BlogTagMap.destroy({ where: { blogId: blog.id } });
      for (const t of tags) {
        let tag = await BlogTag.findOne({ where: { name: t } });
        if (!tag) tag = await BlogTag.create({ name: t });
        await BlogTagMap.create({ blogId: blog.id, tagId: tag.id }).catch(()=>{});
      }
    }
    return res.json(blog);
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Delete a blog post (owner or admin).
 *
 * Params: id
 * Returns: 200 JSON { message: 'Deleted' }
 */
exports.remove = async (req, res) => {
  try {
    const user = req.user;
    const blog = await Blog.findByPk(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Not found' });
    if (blog.authorId !== user.id && user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    await blog.destroy();
    return res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Add a comment to a blog post.
 *
 * Params: id
 * Body: { content }
 * Returns: 201 JSON created comment.
 */
exports.addComment = async (req, res) => {
  try {
    const user = req.user;
    const blog = await Blog.findByPk(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Not found' });
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'content required' });
    const c = await BlogComment.create({ blogId: blog.id, userId: user.id, content });
    return res.status(201).json(c);
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Get comments for a blog post.
 *
 * Params: id
 * Returns: 200 JSON array of comments.
 */
exports.getComments = async (req, res) => {
  try {
    const comments = await BlogComment.findAll({ where: { blogId: req.params.id }, order: [['createdAt','ASC']] });
    return res.json(comments);
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Toggle like for a blog post by current user.
 *
 * Params: id
 * Returns: 200 JSON { liked: boolean }
 */
exports.toggleLike = async (req, res) => {
  try {
    const user = req.user;
    const blogId = req.params.id;
    const existing = await BlogLike.findOne({ where: { blogId, userId: user.id } });
    if (existing) { await existing.destroy(); return res.json({ liked: false }); }
    await BlogLike.create({ blogId, userId: user.id });
    return res.json({ liked: true });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Toggle follow for a blog post by current user.
 *
 * Params: id
 * Returns: 200 JSON { following: boolean }
 */
exports.toggleFollow = async (req, res) => {
  try {
    const user = req.user;
    const blogId = req.params.id;
    const existing = await BlogFollow.findOne({ where: { blogId, userId: user.id } });
    if (existing) { await existing.destroy(); return res.json({ following: false }); }
    await BlogFollow.create({ blogId, userId: user.id });
    return res.json({ following: true });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Report a blog post (creates a report record).
 *
 * Params: id
 * Body: { reason }
 * Returns: 201 JSON created report.
 */
exports.report = async (req, res) => {
  try {
    const user = req.user;
    const blogId = req.params.id;
    const { reason } = req.body;
    const r = await BlogReport.create({ blogId, userId: user.id, reason: reason || null });
    return res.status(201).json(r);
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

// Categories
/**
 * Get list of blog categories.
 * Returns: 200 JSON array of categories.
 */
exports.getCategories = async (req, res) => {
  try { const cats = await BlogCategory.findAll(); return res.json(cats); } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Create a blog category.
 *
 * Body: { name, description }
 * Returns: 201 JSON created category.
 */
exports.createCategory = async (req, res) => {
  try { const { name, description } = req.body; const c = await BlogCategory.create({ name, description }); return res.status(201).json(c); } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Update a blog category.
 *
 * Params: id
 * Body: { name?, description? }
 * Returns: 200 JSON updated category or 404.
 */
exports.updateCategory = async (req, res) => {
  try { const c = await BlogCategory.findByPk(req.params.id); if (!c) return res.status(404).json({ message: 'Not found' }); const { name, description } = req.body; if(name) c.name = name; if(typeof description !== 'undefined') c.description = description; await c.save(); return res.json(c); } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Delete a blog category.
 *
 * Params: id
 * Returns: 200 JSON { message: 'Deleted' }
 */
exports.deleteCategory = async (req, res) => {
  try { const c = await BlogCategory.findByPk(req.params.id); if (!c) return res.status(404).json({ message: 'Not found' }); await c.destroy(); return res.json({ message: 'Deleted' }); } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Get list of tags.
 * Returns: 200 JSON array of tags.
 */
exports.getTags = async (req, res) => {
  try { const tags = await BlogTag.findAll(); return res.json(tags); } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

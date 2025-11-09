/**
 * blogComment.js
 *
 * Purpose: Sequelize model for comments on blog posts. Stores the comment
 * content, author, related blog ID and moderation/reporting metadata.
 *
 * Exports: Sequelize model `BlogComment`.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');
const Blog = require('./blog');

const BlogComment = sequelize.define('BlogComment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  blogId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false }
}, {
  tableName: 'blog_comments'
});

BlogComment.belongsTo(Blog, { foreignKey: 'blogId' });
Blog.hasMany(BlogComment, { foreignKey: 'blogId' });

BlogComment.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(BlogComment, { foreignKey: 'userId' });

module.exports = BlogComment;

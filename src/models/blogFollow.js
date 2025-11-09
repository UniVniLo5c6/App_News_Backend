/**
 * blogFollow.js
 *
 * Purpose: Sequelize model representing user follows for blogs. Tracks which
 * users follow which blog posts or authors to build feeds/notifications.
 *
 * Exports: Sequelize model `BlogFollow`.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');
const Blog = require('./blog');

const BlogFollow = sequelize.define('BlogFollow', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  blogId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'blog_follows',
  indexes: [{ unique: true, fields: ['blogId', 'userId'] }]
});

BlogFollow.belongsTo(Blog, { foreignKey: 'blogId' });
Blog.hasMany(BlogFollow, { foreignKey: 'blogId' });

BlogFollow.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(BlogFollow, { foreignKey: 'userId' });

module.exports = BlogFollow;

/**
 * blogLike.js
 *
 * Purpose: Sequelize model tracking likes/unlikes for blog posts. Records
 * user, blog and a boolean or timestamp to support toggling likes.
 *
 * Exports: Sequelize model `BlogLike`.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');
const Blog = require('./blog');

const BlogLike = sequelize.define('BlogLike', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  blogId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'blog_likes',
  indexes: [{ unique: true, fields: ['blogId', 'userId'] }]
});

BlogLike.belongsTo(Blog, { foreignKey: 'blogId' });
Blog.hasMany(BlogLike, { foreignKey: 'blogId' });

BlogLike.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(BlogLike, { foreignKey: 'userId' });

module.exports = BlogLike;

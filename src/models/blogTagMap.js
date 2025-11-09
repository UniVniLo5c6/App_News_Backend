/**
 * blogTagMap.js
 *
 * Purpose: Join table model mapping blog posts to tags (many-to-many).
 * Stores references to blog and tag IDs.
 *
 * Exports: Sequelize model `BlogTagMap`.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Blog = require('./blog');
const BlogTag = require('./blogTag');

const BlogTagMap = sequelize.define('BlogTagMap', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  blogId: { type: DataTypes.INTEGER, allowNull: false },
  tagId: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'blog_tag_map',
  indexes: [{ unique: true, fields: ['blogId','tagId'] }]
});

BlogTagMap.belongsTo(Blog, { foreignKey: 'blogId' });
BlogTagMap.belongsTo(BlogTag, { foreignKey: 'tagId' });

module.exports = BlogTagMap;

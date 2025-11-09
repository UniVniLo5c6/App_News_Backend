/**
 * blogTag.js
 *
 * Purpose: Sequelize model for tags attached to blog posts. Tags are reused
 * across posts and connected via a tag map table.
 *
 * Exports: Sequelize model `BlogTag`.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BlogTag = sequelize.define('BlogTag', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true }
}, {
  tableName: 'blog_tags'
});

module.exports = BlogTag;

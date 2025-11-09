/**
 * blogCategory.js
 *
 * Purpose: Sequelize model for blog categories. Categories help classify
 * blog posts and are manageable by admin users.
 *
 * Exports: Sequelize model `BlogCategory`.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BlogCategory = sequelize.define('BlogCategory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: 'blog_categories'
});

module.exports = BlogCategory;

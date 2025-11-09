/**
 * blog.js
 *
 * Purpose: Sequelize model representing blog posts authored by users.
 * Contains title, body/content, author reference, status and metadata.
 *
 * Exports: Sequelize model `Blog`.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');

const Blog = sequelize.define('Blog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  authorId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  excerpt: { type: DataTypes.STRING, allowNull: true },
  categoryId: { type: DataTypes.INTEGER, allowNull: true },
  published: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'blogs'
});

Blog.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
User.hasMany(Blog, { foreignKey: 'authorId' });

module.exports = Blog;

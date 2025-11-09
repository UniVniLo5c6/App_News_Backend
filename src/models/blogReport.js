/**
 * blogReport.js
 *
 * Purpose: Sequelize model for reports/flags raised against blog posts or
 * comments by users. Stores reporter, target, reason and status fields.
 *
 * Exports: Sequelize model `BlogReport`.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');
const Blog = require('./blog');

const BlogReport = sequelize.define('BlogReport', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  blogId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  reason: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'blog_reports'
});

BlogReport.belongsTo(Blog, { foreignKey: 'blogId' });
Blog.hasMany(BlogReport, { foreignKey: 'blogId' });

BlogReport.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(BlogReport, { foreignKey: 'userId' });

module.exports = BlogReport;

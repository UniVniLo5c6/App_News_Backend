/**
 * article.js
 *
 * Purpose: Sequelize model for articles created in the system. Stores title,
 * content, author reference and metadata for CRUD operations.
 *
 * Exports: Sequelize model `Article`.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');

const Article = sequelize.define('Article', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  }
}, {
  tableName: 'articles'
});

Article.belongsTo(User, { as: 'author', foreignKey: 'authorId' });
User.hasMany(Article, { foreignKey: 'authorId' });

module.exports = Article;

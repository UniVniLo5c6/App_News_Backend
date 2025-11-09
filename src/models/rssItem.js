/**
 * rssItem.js
 *
 * Purpose: Sequelize model representing an item fetched from an RSS source.
 * Stores title, link, content, published date and a reference to the source.
 *
 * Exports: Sequelize model `RssItem`.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const RssSource = require('./rssSource');

const RssItem = sequelize.define('RssItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  sourceId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: true },
  url: { type: DataTypes.STRING, allowNull: false, unique: true },
  summary: { type: DataTypes.TEXT, allowNull: true },
  publishedAt: { type: DataTypes.DATE, allowNull: true },
  author: { type: DataTypes.STRING, allowNull: true },
  topic: { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: 'rss_items'
});

RssItem.belongsTo(RssSource, { foreignKey: 'sourceId', as: 'source' });
RssSource.hasMany(RssItem, { foreignKey: 'sourceId' });

module.exports = RssItem;

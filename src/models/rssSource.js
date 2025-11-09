/**
 * rssSource.js
 *
 * Purpose: Sequelize model for configured RSS sources. Stores feed URL,
 * optional tags, polling interval and status for sync jobs.
 *
 * Exports: Sequelize model `RssSource`.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RssSource = sequelize.define('RssSource', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  url: { type: DataTypes.STRING, allowNull: false },
  tag: { type: DataTypes.STRING, allowNull: true },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'rss_sources'
});

module.exports = RssSource;

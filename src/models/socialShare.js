/**
 * socialShare.js
 *
 * Purpose: Sequelize model to record social share actions. Stores which user
 * shared which item, platform used, and timestamps for analytics.
 *
 * Exports: Sequelize model `SocialShare`.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');

const SocialShare = sequelize.define('SocialShare', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: true },
  itemType: { type: DataTypes.STRING, allowNull: false },
  itemId: { type: DataTypes.STRING, allowNull: false },
  platform: { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: 'social_shares'
});

SocialShare.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(SocialShare, { foreignKey: 'userId' });

module.exports = SocialShare;

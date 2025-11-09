/**
 * recommendationHistory.js
 *
 * Purpose: Sequelize model that records which items were recommended to
 * users and when, used for auditing and improving recommendation quality.
 *
 * Exports: Sequelize model `RecommendationHistory`.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');

const RecommendationHistory = sequelize.define('RecommendationHistory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  itemType: { type: DataTypes.STRING, allowNull: false },
  itemId: { type: DataTypes.STRING, allowNull: false },
  recommendedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  metadata: { type: DataTypes.JSON, allowNull: true }
}, {
  tableName: 'recommendation_history'
});

RecommendationHistory.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(RecommendationHistory, { foreignKey: 'userId' });

module.exports = RecommendationHistory;

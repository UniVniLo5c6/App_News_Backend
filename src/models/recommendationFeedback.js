/**
 * recommendationFeedback.js
 *
 * Purpose: Sequelize model to store user feedback on recommended items.
 * Captures ratings, comments and item references to improve recommendation logic.
 *
 * Exports: Sequelize model `RecommendationFeedback`.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');

const RecommendationFeedback = sequelize.define('RecommendationFeedback', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  itemType: { type: DataTypes.STRING, allowNull: false }, // 'rss' or 'article'
  itemId: { type: DataTypes.STRING, allowNull: false },
  rating: { type: DataTypes.INTEGER, allowNull: true },
  comment: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'recommendation_feedback'
});

RecommendationFeedback.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(RecommendationFeedback, { foreignKey: 'userId' });

module.exports = RecommendationFeedback;

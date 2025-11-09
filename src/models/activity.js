/**
 * activity.js
 *
 * Purpose: Sequelize model to record user activities (audit/log) such as
 * login, logout, content actions, and admin events. Useful for admin views
 * and user activity feeds.
 *
 * Exports: Sequelize model `Activity`.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');

const Activity = sequelize.define('Activity', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'activities'
});

Activity.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Activity, { foreignKey: 'userId' });

module.exports = Activity;

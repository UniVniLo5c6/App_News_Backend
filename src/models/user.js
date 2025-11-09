/**
 * user.js
 *
 * Purpose: Sequelize model for application users. Stores authentication
 * credentials, OAuth provider information, verification/reset tokens,
 * roles and user settings.
 *
 * Exports: Sequelize model `User`.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // OAuth fields
  provider: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  providerId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  providerData: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  oauthAccessToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  oauthRefreshToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // email verification
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  emailVerifyToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  emailVerifyExpiry: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // refresh token for issuing new access tokens
  refreshToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // user settings and role
  settings: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'user'
  },
  resetToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resetTokenExpiry: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'users'
});

module.exports = User;

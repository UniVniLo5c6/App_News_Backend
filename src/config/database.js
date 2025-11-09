const path = require('path');
const { Sequelize } = require('sequelize');

const storagePath = path.join(__dirname, '../../data/database.sqlite');
//
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: storagePath,
  logging: false,
});

module.exports = sequelize;

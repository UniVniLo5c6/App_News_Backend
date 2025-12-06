const { Sequelize } = require('sequelize');
const path = require('path');

// Load .env từ project root
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env')
});

// Sử dụng biến môi trường (từ .env khi chạy local, hoặc từ Azure App Service)
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true, // Neon yêu cầu SSL
    },
  },
});

module.exports = sequelize;

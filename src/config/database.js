const { Sequelize } = require('sequelize');

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

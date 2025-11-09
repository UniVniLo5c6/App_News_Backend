const { createTables } = require('./migrations');
const { seedDatabase } = require('./seeders');
const sequelize = require('../config/database');

async function initializeDatabase() {
  try {
    // Sync database - this will create the database file if it doesn't exist
    await sequelize.sync({ force: true });

    // Create all tables
    await createTables();

    // Seed the database with initial data
    await seedDatabase();

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
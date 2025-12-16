const { seedDatabase } = require('./seeders');
const sequelize = require('../config/database');

// Load all models to ensure they are registered with Sequelize
require('../models/activity');
require('../models/article');
require('../models/blog');
require('../models/blogCategory');
require('../models/blogComment');
require('../models/blogFollow');
require('../models/blogLike');
require('../models/blogReport');
require('../models/blogTag');
require('../models/blogTagMap');
require('../models/notification');
require('../models/recommendationFeedback');
require('../models/recommendationHistory');
require('../models/rssItem');
require('../models/rssSource');
require('../models/socialShare');
require('../models/user');


async function initializeDatabase() {
  try {
    // Sync all models to ensure tables exist, without dropping data.
    await sequelize.sync({ alter: false });
    console.log('Database tables synced.');

    // Check if the database is already seeded by looking for any users.
    const userCount = await sequelize.models.User.count();
    if (userCount === 0) {
        console.log('Database appears to be empty. Seeding...');
        await seedDatabase();
    } else {
        console.log('Database already contains data. Skipping seed process.');
    }

    console.log('Database initialization process completed.');
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
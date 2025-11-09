const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

async function createTables() {
  try {
    // Users table
    await sequelize.getQueryInterface().createTable('users', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false
      },
      role: {
        type: DataTypes.ENUM('user', 'admin'),
        defaultValue: 'user'
      },
      preferences: {
        type: DataTypes.JSON,
        defaultValue: {}
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE
    });

    // RSS Sources table
    await sequelize.getQueryInterface().createTable('rssSources', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      tag: DataTypes.STRING,
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      lastFetch: DataTypes.DATE,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE
    });

    // RSS Items table
    await sequelize.getQueryInterface().createTable('rssItems', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      sourceId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'rssSources',
          key: 'id'
        }
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      content: DataTypes.TEXT,
      url: {
        type: DataTypes.STRING,
        unique: true
      },
      summary: DataTypes.TEXT,
      publishedAt: DataTypes.DATE,
      author: DataTypes.STRING,
      topic: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE
    });

    // Blog Categories table
    await sequelize.getQueryInterface().createTable('blogCategories', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE
    });

    // Blog Tags table
    await sequelize.getQueryInterface().createTable('blogTags', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE
    });

    // Blogs table
    await sequelize.getQueryInterface().createTable('blogs', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      excerpt: DataTypes.TEXT,
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      authorId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      categoryId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'blogCategories',
          key: 'id'
        }
      },
      published: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      viewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE
    });

    // Blog Tag Map table
    await sequelize.getQueryInterface().createTable('blogTagMaps', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      blogId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'blogs',
          key: 'id'
        }
      },
      tagId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'blogTags',
          key: 'id'
        }
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE
    });

    // Blog Comments table
    await sequelize.getQueryInterface().createTable('blogComments', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      blogId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'blogs',
          key: 'id'
        }
      },
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE
    });

    // Blog Likes table
    await sequelize.getQueryInterface().createTable('blogLikes', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      blogId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'blogs',
          key: 'id'
        }
      },
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE
    });

    // Blog Follows table
    await sequelize.getQueryInterface().createTable('blogFollows', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      blogId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'blogs',
          key: 'id'
        }
      },
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE
    });

    // Recommendation History table
    await sequelize.getQueryInterface().createTable('recommendationHistory', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      itemType: {
        type: DataTypes.ENUM('rss', 'blog'),
        allowNull: false
      },
      itemId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      interactionType: {
        type: DataTypes.ENUM('view', 'click', 'like', 'share'),
        allowNull: false
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE
    });

    console.log('All tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

module.exports = { createTables };
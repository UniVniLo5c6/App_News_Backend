const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

async function seedDatabase() {
  try {
    // Create admin user
    const adminUser = await sequelize.models.User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin'
    });

    // Create test user
    const testUser = await sequelize.models.User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: await bcrypt.hash('test123', 10),
      role: 'user'
    });

    // Create RSS sources
    const rssSources = await sequelize.models.RssSource.bulkCreate([
      {
        name: 'VnExpress',
        url: 'https://vnexpress.net/rss/tin-moi-nhat.rss',
        tag: 'news',
        active: true
      },
      {
        name: 'Thanh Niên',
        url: 'https://thanhnien.vn/rss/home.rss',
        tag: 'news',
        active: true
      },
      {
        name: 'Tuổi Trẻ',
        url: 'https://tuoitre.vn/rss/tin-moi-nhat.rss',
        tag: 'news',
        active: true
      }
    ]);

    // Create blog categories
    const categories = await sequelize.models.BlogCategory.bulkCreate([
      {
        name: 'Công nghệ',
        slug: 'cong-nghe'
      },
      {
        name: 'Thời sự',
        slug: 'thoi-su'
      },
      {
        name: 'Giải trí',
        slug: 'giai-tri'
      },
      {
        name: 'Thể thao',
        slug: 'the-thao'
      }
    ]);

    // Create blog tags
    const tags = await sequelize.models.BlogTag.bulkCreate([
      {
        name: 'Tin tức',
        slug: 'tin-tuc'
      },
      {
        name: 'Công nghệ',
        slug: 'cong-nghe'
      },
      {
        name: 'AI',
        slug: 'ai'
      },
      {
        name: 'Mobile',
        slug: 'mobile'
      }
    ]);

    // Create sample blogs
    const blogs = await sequelize.models.Blog.bulkCreate([
      {
        title: 'Bài viết mẫu về công nghệ',
        content: 'Nội dung bài viết mẫu về công nghệ...',
        excerpt: 'Tóm tắt bài viết về công nghệ',
        slug: 'bai-viet-mau-ve-cong-nghe',
        authorId: adminUser.id,
        categoryId: categories[0].id,
        published: true
      },
      {
        title: 'Bài viết mẫu về thời sự',
        content: 'Nội dung bài viết mẫu về thời sự...',
        excerpt: 'Tóm tắt bài viết về thời sự',
        slug: 'bai-viet-mau-ve-thoi-su',
        authorId: testUser.id,
        categoryId: categories[1].id,
        published: true
      }
    ]);

    // Add tags to blogs
    await sequelize.models.BlogTagMap.bulkCreate([
      {
        blogId: blogs[0].id,
        tagId: tags[0].id
      },
      {
        blogId: blogs[0].id,
        tagId: tags[1].id
      },
      {
        blogId: blogs[1].id,
        tagId: tags[0].id
      }
    ]);

    // Add some comments
    await sequelize.models.BlogComment.bulkCreate([
      {
        blogId: blogs[0].id,
        userId: testUser.id,
        content: 'Bài viết rất hay!'
      },
      {
        blogId: blogs[0].id,
        userId: adminUser.id,
        content: 'Cảm ơn bạn đã chia sẻ.'
      }
    ]);

    // Add some likes
    await sequelize.models.BlogLike.bulkCreate([
      {
        blogId: blogs[0].id,
        userId: testUser.id
      },
      {
        blogId: blogs[1].id,
        userId: adminUser.id
      }
    ]);

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

module.exports = { seedDatabase };
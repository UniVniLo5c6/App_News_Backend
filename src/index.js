require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const sequelize = require('./config/database');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const app = express();
app.use(express.json());
// cookie parser for refresh token cookies
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// Security middleware (helmet, cors, rate-limit)
const security = require('./middleware/security');
security(app);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/user', require('./routes/user'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/rss', require('./routes/rss'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/blogs', require('./routes/blogs'));
app.use('/api/misc', require('./routes/misc'));
app.use('/api/settings', require('./routes/settings'));

app.get('/', (req, res) => res.json({ message: 'News backend running' }));

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // Import models to register with sequelize
    require('./models/user');
    require('./models/article');

    await sequelize.sync({ alter: false });
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

function securityMiddleware(app) {
  // Basic security headers
  app.use(helmet());

  // Simple CORS - adjust origin in production
  app.use(cors());

  // Rate limiter - basic settings
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(limiter);
}

module.exports = securityMiddleware;

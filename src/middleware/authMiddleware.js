/**
 * authMiddleware.js
 *
 * Purpose: Express middleware that verifies JWT access tokens (Bearer) and
 * attaches the authenticated `User` instance to `req.user` for downstream
 * handlers. Returns 401 on missing/invalid tokens.
 *
 * Exports: middleware function (req, res, next).
 */
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'changeme');
    const user = await User.findByPk(payload.id);
    if (!user) return res.status(401).json({ message: 'Invalid token (user not found)' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token', error: err.message });
  }
};

module.exports = authMiddleware;

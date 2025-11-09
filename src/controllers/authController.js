/**
 * authController.js
 *
 * Purpose: Handle authentication-related operations (register, login, logout,
 * refresh tokens, password reset, email verification, and social OAuth flows).
 * Exposes functions used by `/api/auth` routes. Responses are JSON with
 * HTTP status codes indicating success or error.
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

/**
 * Register a new user.
 *
 * Body: { name, email, password }
 * Creates a user record with a hashed password and an email verification token.
 * Returns: 201 JSON { id, name, email, verifyToken } (verifyToken returned for dev/testing).
 */
exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
  try {
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email already in use' });
    const passwordHash = await bcrypt.hash(password, 10);
    // generate email verification token
    const verifyToken = crypto.randomBytes(20).toString('hex');
    const verifyExpiry = new Date(Date.now() + 24 * 3600 * 1000); // 24h
    const user = await User.create({ name, email, passwordHash, emailVerifyToken: verifyToken, emailVerifyExpiry: verifyExpiry, emailVerified: false });
    // In dev we return verifyToken. In production you'd email it.
    return res.status(201).json({ id: user.id, name: user.name, email: user.email, verifyToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Login user with email and password.
 *
 * Body: { email, password }
 * Verifies credentials and returns a short-lived access token and a refresh token.
 * Returns: 200 JSON { token, refreshToken, user }
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Missing fields' });
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = crypto.randomBytes(40).toString('hex');
    user.refreshToken = refreshToken;
    await user.save();
    // set httpOnly cookie for refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 3600 * 1000, // 30 days
    });
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Logout a user.
 *
 * Body: { refreshToken }
 * Invalidates the provided refresh token in the database.
 * Returns: 200 JSON { message: 'Logged out' }
 */
exports.logout = async (req, res) => {
  // Accept refreshToken in body or cookie to invalidate
  const provided = req.body.refreshToken || (req.cookies && req.cookies.refreshToken);
  try {
    if (provided) {
      const user = await User.findOne({ where: { refreshToken: provided } });
      if (user) { user.refreshToken = null; await user.save(); }
    }
    // clear cookie
    res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
    return res.json({ message: 'Logged out' });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Refresh access token using a refresh token.
 *
 * Body: { refreshToken }
 * If valid, returns a new short-lived JWT access token.
 * Returns: 200 JSON { token }
 */
exports.refreshToken = async (req, res) => {
  // Accept refreshToken in body or cookie
  const provided = req.body.refreshToken || (req.cookies && req.cookies.refreshToken);
  if (!provided) return res.status(400).json({ message: 'refreshToken required' });
  try {
    const user = await User.findOne({ where: { refreshToken: provided } });
    if (!user) return res.status(401).json({ message: 'Invalid refresh token' });
    // rotate refresh token
    const newRefresh = crypto.randomBytes(40).toString('hex');
    user.refreshToken = newRefresh;
    await user.save();
    // set cookie with new refresh token
    res.cookie('refreshToken', newRefresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 3600 * 1000, // 30 days
    });
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '15m' });
    return res.json({ token });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Request a password reset token for the given email.
 *
 * Body: { email }
 * If user exists, stores a reset token and expiry and (in dev) returns it.
 * Returns: 200 JSON { message, token? }
 */
exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Missing email' });
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(200).json({ message: 'If the email exists, a reset token has been issued' });
    const token = crypto.randomBytes(20).toString('hex');
    const expiry = new Date(Date.now() + 3600 * 1000); // 1 hour
    user.resetToken = token;
    user.resetTokenExpiry = expiry;
    await user.save();
    // In production you'd email the token. Here we return it for testing/dev.
    return res.json({ message: 'Password reset token generated (dev only)', token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Reset password using a reset token.
 *
 * Body: { token, newPassword }
 * Validates token and expiry, sets new hashed password and clears token fields.
 * Returns: 200 JSON { message }
 */
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ message: 'Missing fields' });
  try {
    const user = await User.findOne({ where: { resetToken: token } });
    if (!user) return res.status(400).json({ message: 'Invalid token' });
    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) return res.status(400).json({ message: 'Token expired' });
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();
    return res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get current authenticated user's public profile.
 *
 * Auth required (auth middleware sets req.user).
 * Returns: 200 JSON { id, name, email }
 */
exports.me = async (req, res) => {
  const user = req.user;
  return res.json({ id: user.id, name: user.name, email: user.email });
};

// OAuth: client sends idToken (from Google). We verify and find-or-create user.
/**
 * Verify Google ID token and sign-in/up the user.
 *
 * Body: { idToken }
 * Verifies the token with Google, finds or creates a local user and returns a JWT.
 * Returns: 200 JSON { token, user }
 */
exports.oauthGoogle = async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ message: 'idToken required' });
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    // payload contains: sub (id), email, email_verified, name, picture
    const provider = 'google';
    const providerId = payload.sub;
    // find by providerId first
    let user = await User.findOne({ where: { provider, providerId } });
    if (!user) {
      // try find by email to link
      if (payload.email) {
        const existing = await User.findOne({ where: { email: payload.email } });
        if (existing) {
          existing.provider = provider;
          existing.providerId = providerId;
          existing.providerData = payload;
          await existing.save();
          user = existing;
        }
      }
    }
    if (!user) {
      // create new user (passwordHash null)
      user = await User.create({
        name: payload.name || payload.email,
        email: payload.email,
        provider,
        providerId,
        providerData: payload,
      });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '15m' });
    // create refresh token and set cookie
    const refreshToken = crypto.randomBytes(40).toString('hex');
    user.refreshToken = refreshToken;
    await user.save();
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 3600 * 1000,
    });
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('oauthGoogle error', err);
    return res.status(401).json({ message: 'Invalid idToken', error: err.message });
  }
};

/**
 * Verify user's email using a token.
 *
 * Query: ?token=...
 * Marks the user's emailVerified flag if token is valid and not expired.
 * Returns: 200 JSON { message }
 */
exports.verifyEmail = async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ message: 'token required' });
  try {
    const user = await User.findOne({ where: { emailVerifyToken: token } });
    if (!user) return res.status(400).json({ message: 'Invalid token' });
    if (!user.emailVerifyExpiry || user.emailVerifyExpiry < new Date()) return res.status(400).json({ message: 'Token expired' });
    user.emailVerified = true;
    user.emailVerifyToken = null;
    user.emailVerifyExpiry = null;
    await user.save();
    return res.json({ message: 'Email verified' });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

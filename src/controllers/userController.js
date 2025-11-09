/**
 * userController.js
 *
 * Purpose: User-facing endpoints for profile, settings, activity and notifications.
 */

const User = require('../models/user');
const Activity = require('../models/activity');
const Notification = require('../models/notification');

/**
 * Get current user's public profile.
 *
 * Auth required. Returns: 200 JSON { id, name, email, settings, role }
 */
exports.getProfile = async (req, res) => {
  const user = req.user;
  return res.json({ id: user.id, name: user.name, email: user.email, settings: user.settings, role: user.role });
};

/**
 * Update current user's profile (simple: name).
 *
 * Body: { name }
 * Records an activity entry. Returns: 200 JSON updated public profile.
 */
exports.updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const { name } = req.body;
    if (name) user.name = name;
    await user.save();
    // record activity
    await Activity.create({ userId: user.id, type: 'profile_update', message: 'User updated profile' });
    return res.json({ id: user.id, name: user.name, email: user.email });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Get current user's settings object.
 *
 * Returns: 200 JSON settings (or empty object).
 */
exports.getSettings = async (req, res) => {
  return res.json(req.user.settings || {});
};

/**
 * Update current user's settings by merging provided object into existing settings.
 *
 * Body: JSON settings partial. Returns: 200 JSON updated settings.
 */
exports.updateSettings = async (req, res) => {
  try {
    const user = req.user;
    user.settings = { ...(user.settings || {}), ...(req.body || {}) };
    await user.save();
    return res.json(user.settings);
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Get activity log for the current user.
 *
 * Returns: 200 JSON array of Activity records ordered by date desc.
 */
exports.getActivity = async (req, res) => {
  try {
    const activities = await Activity.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']] });
    return res.json(activities);
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Get notifications for the current user.
 *
 * Returns: 200 JSON array of Notification records.
 */
exports.getNotifications = async (req, res) => {
  try {
    const notes = await Notification.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']] });
    return res.json(notes);
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Delete a notification belonging to current user.
 *
 * Params: id
 * Returns: 200 JSON { message: 'Deleted' } or 404 if not found / not owned.
 */
exports.deleteNotification = async (req, res) => {
  try {
    const note = await Notification.findByPk(req.params.id);
    if (!note || note.userId !== req.user.id) return res.status(404).json({ message: 'Not found' });
    await note.destroy();
    return res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

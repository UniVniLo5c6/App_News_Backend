/**
 * settingsController.js
 *
 * Purpose: Endpoints to update small user settings like theme and notification prefs.
 */

/**
 * Update user's theme setting.
 *
 * Body: { theme }
 * Returns: 200 JSON { theme }
 */
exports.updateTheme = async (req, res) => {
  try {
    const user = req.user;
    const { theme } = req.body;
    if (!theme) return res.status(400).json({ message: 'theme required' });
    user.settings = { ...(user.settings || {}), theme };
    await user.save();
    return res.json({ theme: user.settings.theme });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Update user's notification preferences.
 *
 * Body: { notifications }
 * Returns: 200 JSON { notifications }
 */
exports.updateNotifications = async (req, res) => {
  try {
    const user = req.user;
    const { notifications } = req.body;
    if (typeof notifications === 'undefined') return res.status(400).json({ message: 'notifications required' });
    user.settings = { ...(user.settings || {}), notifications };
    await user.save();
    return res.json({ notifications: user.settings.notifications });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

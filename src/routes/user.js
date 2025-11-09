const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const userCtrl = require('../controllers/userController');

router.get('/profile', authMiddleware, userCtrl.getProfile);
router.put('/profile', authMiddleware, userCtrl.updateProfile);

router.get('/settings', authMiddleware, userCtrl.getSettings);
router.put('/settings', authMiddleware, userCtrl.updateSettings);

router.get('/activity', authMiddleware, userCtrl.getActivity);

router.get('/notifications', authMiddleware, userCtrl.getNotifications);
router.delete('/notifications/:id', authMiddleware, userCtrl.deleteNotification);

module.exports = router;

const express = require('express');
const router = express.Router();
const settingsCtrl = require('../controllers/settingsController');
const authMw = require('../middleware/authMiddleware');
const { check } = require('express-validator');

router.put('/theme', authMw, [ check('theme').isString().notEmpty() ], settingsCtrl.updateTheme);
router.put('/notifications', authMw, [ check('notifications').exists() ], settingsCtrl.updateNotifications);

module.exports = router;

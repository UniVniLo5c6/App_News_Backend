const express = require('express');
const router = express.Router();
const recCtrl = require('../controllers/recommendationsController');
const authMw = require('../middleware/authMiddleware');
const { check, validationResult } = require('express-validator');

// Public: recommend list (for logged-in users only)
router.get('/', authMw, recCtrl.getRecommendations);

// Preferences
router.get('/preferences', authMw, recCtrl.getPreferences);
router.put('/preferences', authMw, [check('preferences').isArray().optional()], recCtrl.updatePreferences);

// Feedback
router.post('/feedback', authMw, [
  check('itemType').isIn(['rss','article']).withMessage('itemType must be rss or article'),
  check('itemId').exists().withMessage('itemId required')
], recCtrl.postFeedback);

// History
router.get('/history', authMw, recCtrl.getHistory);

// Train (admin or protected) - for now protect with auth only
router.post('/train', authMw, recCtrl.train);

module.exports = router;

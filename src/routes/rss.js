const express = require('express');
const router = express.Router();
const rssCtrl = require('../controllers/rssController');
const authMw = require('../middleware/authMiddleware');
const adminMw = require('../middleware/adminMiddleware');
const { validate, rssSourceValidators } = require('../middleware/validators');

// Public endpoints
router.get('/items', rssCtrl.listItems);
router.get('/trending', rssCtrl.trending);
router.get('/search', rssCtrl.search);
router.get('/summary/:id', rssCtrl.summary);
router.get('/topic/:tag', rssCtrl.topic);

// Sources (list public)
router.get('/source', rssCtrl.getSources);

// Admin: manage sources
router.post('/source', authMw, adminMw, validate(rssSourceValidators), rssCtrl.createSource);
router.put('/source/:id', authMw, adminMw, validate(rssSourceValidators), rssCtrl.updateSource);
router.delete('/source/:id', authMw, adminMw, rssCtrl.deleteSource);

// Sync (protected)
router.post('/sync', authMw, adminMw, rssCtrl.sync);

module.exports = router;

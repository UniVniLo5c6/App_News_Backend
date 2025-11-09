const express = require('express');
const router = express.Router();
const misc = require('../controllers/miscController');
const authMw = require('../middleware/authMiddleware');

router.get('/downloads/:type', authMw, misc.download); // require auth to download
router.get('/social/share/:id', authMw, misc.share); // optional auth - but we'll require auth for now

module.exports = router;

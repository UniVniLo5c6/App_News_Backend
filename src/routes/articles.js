const express = require('express');
const router = express.Router();
const articleCtrl = require('../controllers/articleController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate, articleCreateValidators } = require('../middleware/validators');

router.get('/', articleCtrl.list);
router.get('/topic/:topic', articleCtrl.listByTopic);
router.get('/:id', articleCtrl.get);
router.post('/', authMiddleware, validate(articleCreateValidators), articleCtrl.create);
router.delete('/:id', authMiddleware, articleCtrl.remove);

module.exports = router;

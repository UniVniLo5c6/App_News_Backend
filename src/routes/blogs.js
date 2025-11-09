const express = require('express');
const router = express.Router();
const blogCtrl = require('../controllers/blogController');
const authMw = require('../middleware/authMiddleware');
const adminMw = require('../middleware/adminMiddleware');
const { validate } = require('../middleware/validators');
const { check } = require('express-validator');

// Public list and tags/categories
router.get('/', blogCtrl.list);
router.get('/category', blogCtrl.getCategories);
router.get('/tags', blogCtrl.getTags);

// Create blog (auth)
router.post('/', authMw, [ check('title').isLength({ min: 3 }), check('content').isLength({ min: 5 }) ], blogCtrl.create);

// Update / delete
router.put('/:id', authMw, blogCtrl.update);
router.delete('/:id', authMw, blogCtrl.remove);

// Comments
router.post('/:id/comment', authMw, [ check('content').isLength({ min: 1 }) ], blogCtrl.addComment);
router.get('/:id/comments', blogCtrl.getComments);

// Like / Follow / Report
router.post('/:id/like', authMw, blogCtrl.toggleLike);
router.post('/:id/follow', authMw, blogCtrl.toggleFollow);
router.post('/:id/report', authMw, [ check('reason').optional().isString() ], blogCtrl.report);

// Category management (admin)
router.post('/category', authMw, adminMw, [ check('name').isLength({ min: 2 }) ], blogCtrl.createCategory);
router.put('/category/:id', authMw, adminMw, blogCtrl.updateCategory);
router.delete('/category/:id', authMw, adminMw, blogCtrl.deleteCategory);

module.exports = router;

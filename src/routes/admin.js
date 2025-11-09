const express = require('express');
const router = express.Router();
const adminMw = require('../middleware/adminMiddleware');
const authMw = require('../middleware/authMiddleware');
const adminCtrl = require('../controllers/adminController');

// All admin routes require authentication + admin role
router.use(authMw, adminMw);

router.get('/users', adminCtrl.listUsers);
router.delete('/users/:id', adminCtrl.deleteUser);
router.put('/users/:id', adminCtrl.updateUser);
router.get('/stats', adminCtrl.stats);
router.get('/logs', adminCtrl.logs);

module.exports = router;

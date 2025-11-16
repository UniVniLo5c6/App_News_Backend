const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate, registerValidators, loginValidators, requestResetValidators, resetValidators, oauthGoogleValidators } = require('../middleware/validators');

router.post('/register', validate(registerValidators), authCtrl.register);
router.post('/login', validate(loginValidators), authCtrl.login);
router.post('/logout', authCtrl.logout);
router.post('/refresh-token', authCtrl.refreshToken);
router.post('/verify-email', authCtrl.verifyEmail);
router.post('/forgot-password', validate(requestResetValidators), authCtrl.requestPasswordReset);
router.post('/reset-password', validate(resetValidators), authCtrl.resetPassword);
router.post('/oauth/google', validate(oauthGoogleValidators), authCtrl.oauthGoogle);
router.get('/me', authMiddleware, authCtrl.me);

module.exports = router;

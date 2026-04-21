// Authentication route definitions: maps auth endpoints to controller handlers and auth middleware.
const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', authController.register);
router.get('/login-public-key', authController.getLoginPublicKey);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/bootstrap', authenticateToken, authController.getAuthBootstrap);
router.get('/me', authenticateToken, authController.getCurrentUser);
router.put('/profile', authenticateToken, authController.updateCurrentUserProfile);

module.exports = router;

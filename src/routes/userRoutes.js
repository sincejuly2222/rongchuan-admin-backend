// User route definitions: exposes user management list endpoints for the admin UI.
const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/', authenticateToken, userController.createUser);
router.get('/', authenticateToken, userController.listUsers);
router.put('/:id', authenticateToken, userController.updateUser);
router.patch('/:id/status', authenticateToken, userController.updateUserStatus);

module.exports = router;

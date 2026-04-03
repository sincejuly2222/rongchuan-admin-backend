// Permission route definitions: exposes permission management list endpoints for the admin UI.
const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const permissionController = require('../controllers/permissionController');

const router = express.Router();

router.post('/', authenticateToken, permissionController.createPermission);
router.get('/', authenticateToken, permissionController.listPermissions);
router.put('/:id', authenticateToken, permissionController.updatePermission);

module.exports = router;

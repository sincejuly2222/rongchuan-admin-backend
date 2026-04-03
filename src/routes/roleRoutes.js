// Role route definitions: exposes role management list endpoints for the admin UI.
const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const roleController = require('../controllers/roleController');

const router = express.Router();

router.post('/', authenticateToken, roleController.createRole);
router.get('/', authenticateToken, roleController.listRoles);
router.put('/:id', authenticateToken, roleController.updateRole);
router.get('/:id/permissions', authenticateToken, roleController.getRolePermissions);
router.put('/:id/permissions', authenticateToken, roleController.updateRolePermissions);

module.exports = router;

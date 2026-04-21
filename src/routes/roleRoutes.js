// Role route definitions: exposes role management list endpoints for the admin UI.
const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const roleController = require('../controllers/roleController');

const router = express.Router();

router.post('/', authenticateToken, roleController.createRole);
router.get('/', authenticateToken, roleController.listRoles);
router.put('/:id', authenticateToken, roleController.updateRole);
router.get('/:id/menus', authenticateToken, roleController.getRoleMenus);
router.put('/:id/menus', authenticateToken, roleController.updateRoleMenus);

module.exports = router;

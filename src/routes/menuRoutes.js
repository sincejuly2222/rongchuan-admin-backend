const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const menuController = require('../controllers/menuController');

const router = express.Router();

router.post('/', authenticateToken, menuController.createMenu);
router.get('/', authenticateToken, menuController.listMenus);
router.get('/tree', authenticateToken, menuController.listMenuTree);
router.put('/:id', authenticateToken, menuController.updateMenu);
router.patch('/:id/status', authenticateToken, menuController.updateMenuStatus);
router.delete('/:id', authenticateToken, menuController.deleteMenu);

module.exports = router;

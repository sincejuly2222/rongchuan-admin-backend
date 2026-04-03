const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const menuController = require('../controllers/menuController');

const router = express.Router();

router.post('/', authenticateToken, menuController.createMenu);
router.get('/', authenticateToken, menuController.listMenus);
router.put('/:id', authenticateToken, menuController.updateMenu);
router.patch('/:id/status', authenticateToken, menuController.updateMenuStatus);

module.exports = router;

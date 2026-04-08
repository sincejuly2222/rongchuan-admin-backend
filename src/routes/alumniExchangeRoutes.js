const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const alumniExchangeController = require('../controllers/alumniExchangeController');

const router = express.Router();

router.get('/', authenticateToken, alumniExchangeController.listExchanges);
router.post('/', authenticateToken, alumniExchangeController.createExchange);
router.patch('/:id/status', authenticateToken, alumniExchangeController.updateExchangeStatus);

module.exports = router;

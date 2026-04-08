const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const activityController = require('../controllers/activityController');

const router = express.Router();

router.get('/', authenticateToken, activityController.listActivities);
router.post('/', authenticateToken, activityController.createActivity);
router.put('/:id', authenticateToken, activityController.updateActivity);
router.patch('/:id/status', authenticateToken, activityController.updateActivityStatus);

module.exports = router;

const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const studentRecordController = require('../controllers/studentRecordController');

const router = express.Router();

router.get('/', authenticateToken, studentRecordController.listStudentRecords);
router.patch('/:id/status', authenticateToken, studentRecordController.updateStudentRecordStatus);

module.exports = router;

const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const alumniUserController = require('../controllers/alumniUserController');

const router = express.Router();

router.get('/', authenticateToken, alumniUserController.listUsers);
router.post('/', authenticateToken, alumniUserController.createUser);
router.get('/:id', authenticateToken, alumniUserController.getUserDetail);
router.put('/:id', authenticateToken, alumniUserController.updateUser);
router.patch('/:id/status', authenticateToken, alumniUserController.updateUserStatus);
router.put('/:id/student-record', authenticateToken, alumniUserController.upsertStudentRecord);
router.put('/:id/card', authenticateToken, alumniUserController.upsertCard);

module.exports = router;

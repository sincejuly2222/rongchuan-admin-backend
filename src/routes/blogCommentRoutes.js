const express = require('express');
const blogCommentController = require('../controllers/blogCommentController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticateToken, blogCommentController.listComments);
router.patch('/:id', authenticateToken, blogCommentController.updateComment);
router.delete('/:id', authenticateToken, blogCommentController.deleteComment);

module.exports = router;

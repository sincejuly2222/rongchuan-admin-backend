const express = require('express');
const blogController = require('../controllers/blogController');
const { authenticateOptionalToken, authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/categories', blogController.listBlogCategories);
router.get('/categories/manage', authenticateToken, blogController.listManageBlogCategories);
router.post('/categories', authenticateToken, blogController.createBlogCategory);
router.put('/categories/:id', authenticateToken, blogController.updateBlogCategory);
router.delete('/categories/:id', authenticateToken, blogController.deleteBlogCategory);
router.patch('/categories/sort', authenticateToken, blogController.sortBlogCategories);
router.get('/', authenticateOptionalToken, blogController.listBlogs);
router.get('/:id/edit', authenticateToken, blogController.getEditableBlogDetail);
router.get('/:id', blogController.getBlogDetail);
router.post('/', authenticateToken, blogController.createBlog);
router.put('/:id', authenticateToken, blogController.updateBlog);
router.patch('/:id/status', authenticateToken, blogController.updateBlogStatus);
router.delete('/:id', authenticateToken, blogController.deleteBlog);

module.exports = router;

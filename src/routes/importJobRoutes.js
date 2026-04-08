const express = require('express');
const multer = require('multer');
const { authenticateToken } = require('../middleware/authMiddleware');
const importJobController = require('../controllers/importJobController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', authenticateToken, importJobController.listImportJobs);
router.post('/upload', authenticateToken, upload.single('file'), importJobController.uploadImportFile);

module.exports = router;

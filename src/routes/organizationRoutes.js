const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const organizationController = require('../controllers/organizationController');

const router = express.Router();

router.get('/', authenticateToken, organizationController.listOrganizations);
router.post('/', authenticateToken, organizationController.createOrganization);
router.put('/:id', authenticateToken, organizationController.updateOrganization);
router.patch('/:id/status', authenticateToken, organizationController.updateOrganizationStatus);

module.exports = router;

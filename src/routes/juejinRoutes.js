const express = require('express');
const juejinController = require('../controllers/juejinController');

const router = express.Router();

router.get('/hot-frontend', juejinController.getFrontendHotRank);

module.exports = router;

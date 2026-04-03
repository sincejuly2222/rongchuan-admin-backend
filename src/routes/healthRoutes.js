// Health route definitions: exposes service and database availability checks.
const express = require('express');
const { checkHealth } = require('../controllers/healthController');

const router = express.Router();

router.get('/', checkHealth);

module.exports = router;

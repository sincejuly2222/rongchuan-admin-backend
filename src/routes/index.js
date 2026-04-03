// API route aggregator: combines feature routers under the /api prefix.
const express = require('express');
const authRoutes = require('./authRoutes');
const healthRoutes = require('./healthRoutes');
const menuRoutes = require('./menuRoutes');
const permissionRoutes = require('./permissionRoutes');
const roleRoutes = require('./roleRoutes');
const userRoutes = require('./userRoutes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/menus', menuRoutes);

module.exports = router;

// API route aggregator: combines feature routers under the /api prefix.
const express = require('express');
const activityRoutes = require('./activityRoutes');
const alumniExchangeRoutes = require('./alumniExchangeRoutes');
const alumniUserRoutes = require('./alumniUserRoutes');
const authRoutes = require('./authRoutes');
const healthRoutes = require('./healthRoutes');
const importJobRoutes = require('./importJobRoutes');
const menuRoutes = require('./menuRoutes');
const organizationRoutes = require('./organizationRoutes');
const permissionRoutes = require('./permissionRoutes');
const roleRoutes = require('./roleRoutes');
const studentRecordRoutes = require('./studentRecordRoutes');
const userRoutes = require('./userRoutes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/activities', activityRoutes);
router.use('/alumni-users', alumniUserRoutes);
router.use('/alumni-exchanges', alumniExchangeRoutes);
router.use('/import-jobs', importJobRoutes);
router.use('/organizations', organizationRoutes);
router.use('/student-records', studentRecordRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/menus', menuRoutes);

module.exports = router;

// API route aggregator: combines feature routers under the /api prefix.
const express = require('express');
const activityRoutes = require('./activityRoutes');
const alumniExchangeRoutes = require('./alumniExchangeRoutes');
const alumniUserRoutes = require('./alumniUserRoutes');
const authRoutes = require('./authRoutes');
const blogCommentRoutes = require('./blogCommentRoutes');
const blogRoutes = require('./blogRoutes');
const healthRoutes = require('./healthRoutes');
const importJobRoutes = require('./importJobRoutes');
const juejinRoutes = require('./juejinRoutes');
const menuRoutes = require('./menuRoutes');
const organizationRoutes = require('./organizationRoutes');
const roleRoutes = require('./roleRoutes');
const studentRecordRoutes = require('./studentRecordRoutes');
const userRoutes = require('./userRoutes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/blogs', blogRoutes);
router.use('/blog-comments', blogCommentRoutes);
router.use('/activities', activityRoutes);
router.use('/alumni-users', alumniUserRoutes);
router.use('/alumni-exchanges', alumniExchangeRoutes);
router.use('/import-jobs', importJobRoutes);
router.use('/juejin', juejinRoutes);
router.use('/organizations', organizationRoutes);
router.use('/student-records', studentRecordRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/menus', menuRoutes);

module.exports = router;

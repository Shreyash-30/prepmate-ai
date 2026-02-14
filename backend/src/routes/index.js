const express = require('express');
const authRoutes = require('./authRoutes');
const usersRoutes = require('./usersRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const roadmapRoutes = require('./roadmapRoutes');
const roadmapCustomRoutes = require('./roadmapCustomRoutes');
const tasksRoutes = require('./tasksRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const practiceRoutes = require('./practiceRoutes');
const submissionsRoutes = require('./submissionsRoutes');
const mentorRoutes = require('./mentorRoutes');
const integrationsRoutes = require('./integrations');
const aiRoutes = require('./ai');
const healthRoutes = require('./health');
const telemetryRoutes = require('./telemetryRoutes');

const router = express.Router();

// Route registration
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/roadmap', roadmapRoutes); // PCI computation & progress tracking
router.use('/roadmaps/custom', roadmapCustomRoutes); // Custom roadmap creation
router.use('/tasks', tasksRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/practice', practiceRoutes);
router.use('/submissions', submissionsRoutes); // User submissions & solved problems
router.use('/mentor', mentorRoutes);
router.use('/integrations', integrationsRoutes);

// Telemetry endpoints (topic stats, PCI, sync states)
router.use('/telemetry', telemetryRoutes);

// AI/ML Telemetry endpoints
router.use('/ai', aiRoutes);

// Health & Monitoring endpoints
router.use('/health', healthRoutes);

module.exports = router;

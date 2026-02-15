const express = require('express');
const authRoutes = require('./authRoutes');
const usersRoutes = require('./usersRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const tasksRoutes = require('./tasksRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const practiceRoutes = require('./practiceRoutes');
const submissionsRoutes = require('./submissionsRoutes');
const mentorRoutes = require('./mentorRoutes');
const integrationsRoutes = require('./integrations');
const aiRoutes = require('./ai');
const healthRoutes = require('./health');
const telemetryRoutes = require('./telemetryRoutes');
const automationRoutes = require('./automationRoutes');
const intelligenceRoutes = require('./intelligence');

const router = express.Router();

// Route registration
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/tasks', tasksRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/practice', practiceRoutes);
router.use('/submissions', submissionsRoutes); // User submissions & solved problems
router.use('/mentor', mentorRoutes);
router.use('/integrations', integrationsRoutes);

// Telemetry endpoints (topic stats, PCI, sync states)
router.use('/telemetry', telemetryRoutes);

// Unified Intelligence endpoints (MASTER - new unified layer)
router.use('/intelligence', intelligenceRoutes);

// Automation Intelligence endpoints
router.use('/', automationRoutes);

// AI/ML Telemetry endpoints
router.use('/ai', aiRoutes);

// Health & Monitoring endpoints
router.use('/health', healthRoutes);

module.exports = router;

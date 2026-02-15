/**
 * Telemetry Routes
 * Expose telemetry aggregation, topic stats, and PCI endpoints
 */

const express = require('express');
const router = express.Router();
const telemetryController = require('../controllers/telemetryController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Topic Statistics Routes
router.get('/topic-stats/:userId', telemetryController.getTopicStats);
router.get('/weak-topics/:userId', telemetryController.getWeakTopics);

// PCI & Progress Routes
// Roadmap telemetry endpoints removed (feature migrated to new ML/ILP system)

// Sync State Route
router.get('/sync/state/:platform', authMiddleware, telemetryController.getSyncState);

module.exports = router;

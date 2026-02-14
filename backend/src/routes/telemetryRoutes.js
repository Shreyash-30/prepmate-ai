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
router.get('/roadmap/pci/:roadmapId', telemetryController.getRoadmapPCI);
router.get('/roadmap/progress/:roadmapId', telemetryController.getRoadmapProgress);
router.get('/roadmap/topic/:topicId/:roadmapId', telemetryController.getTopicProgress);
router.get('/roadmap/time-estimate/:roadmapId', telemetryController.getTimeEstimate);
router.get('/roadmap/recommendations/:roadmapId', telemetryController.getPCIRecommendations);
router.get('/roadmap/all-pci', telemetryController.getAllRoadmapPCI);

// Sync State Route
router.get('/sync/state/:platform', authMiddleware, telemetryController.getSyncState);

module.exports = router;

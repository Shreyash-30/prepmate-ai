/**
 * Automation Routes
 * REST API endpoints for automation system
 */

const express = require('express');
const router = express.Router();
const automationController = require('../controllers/automationController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Public/Admin endpoints (no auth required or minimal auth)
router.get('/automation/status', automationController.getAutomationStatus);
router.get('/automation/logs', automationController.getAutomationLogs);

// User-specific endpoints (auth required)
router.get('/user/compliance', authMiddleware, automationController.getUserCompliance);
router.get('/user/tasks/today', authMiddleware, automationController.getUserTodaysTasks);
router.get('/user/tasks', authMiddleware, automationController.getUserTasks);

// Task management endpoints
router.post('/tasks/:taskId/complete', authMiddleware, automationController.completeTask);
router.post('/tasks/bulk/complete', authMiddleware, automationController.bulkCompleteTasks);

// Manual automation triggers (auth required)
router.post('/automation/trigger/planner', authMiddleware, automationController.triggerAdaptivePlan);
router.post(
  '/automation/trigger/readiness',
  authMiddleware,
  automationController.triggerReadinessComputation
);

// Roadmap progress endpoints - available via dashboard API
// router.get('/roadmap/progress', authMiddleware, dashboardController.getUserRoadmapProgress);
// router.get('/roadmap/trends', authMiddleware, dashboardController.getRoadmapTrends);
// router.get('/roadmap/completions/recent', authMiddleware, dashboardController.getRecentCompletions);
// router.get('/roadmap/difficulty-distribution', authMiddleware, dashboardController.getDifficultyDistribution);

module.exports = router;

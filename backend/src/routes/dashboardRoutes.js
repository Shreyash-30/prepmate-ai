const express = require('express');
const { authMiddleware } = require('../middlewares/authMiddleware');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/dashboard/readiness
 * Get overall readiness score by category
 */
router.get('/readiness', dashboardController.getReadiness);

/**
 * GET /api/dashboard/tasks/today
 * Get today's recommended tasks
 */
router.get('/tasks/today', dashboardController.getTodayTasks);

/**
 * GET /api/dashboard/weak-topics
 * Get list of weak topics
 */
router.get('/weak-topics', dashboardController.getWeakTopics);

/**
 * GET /api/dashboard/activity
 * Get daily activity chart data
 */
router.get('/activity', dashboardController.getActivity);

module.exports = router;

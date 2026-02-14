const express = require('express');
const { authMiddleware } = require('../middlewares/authMiddleware');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/dashboard/summary
 * High-level overview: problems solved, platforms synced, completion metrics
 */
router.get('/summary', dashboardController.getSummary);

/**
 * GET /api/dashboard/activity
 * Real activity timeline: submissions, competitions over time
 */
router.get('/activity', dashboardController.getActivity);

/**
 * GET /api/dashboard/intelligence
 * AI-powered intelligence: readiness, completeness, consistency, improvement velocity
 */
router.get('/intelligence', dashboardController.getIntelligence);

/**
 * GET /api/dashboard/today-tasks
 * Real tasks from database with weak topic recommendations
 */
router.get('/today-tasks', dashboardController.getTodayTasks);

/**
 * GET /api/dashboard/readiness-trend
 * Historical readiness trend for chart visualization
 */
router.get('/readiness-trend', dashboardController.getReadinessTrend);

/**
 * GET /api/dashboard/mastery-growth
 * Mastery progression by topic
 */
router.get('/mastery-growth', dashboardController.getMasteryGrowth);

module.exports = router;

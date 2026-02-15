/**
 * Submissions Routes
 * API endpoints for fetching user submissions and solved problems
 */

const express = require('express');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../middlewares/errorHandler');
const submissionsController = require('../controllers/submissionsController');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/submissions
 * Get user submissions (main endpoint for dashboard)
 * Query: ?limit=100&sort=-createdAt
 */
router.get('/', asyncHandler(submissionsController.getUserSubmissions));

/**
 * POST /api/submissions/create
 * Create a new submission and queue for intelligence
 */
router.post('/create', asyncHandler(submissionsController.createSubmission));

/**
 * POST /api/submissions/sync
 * Bulk create submissions from platform sync
 */
router.post('/sync', asyncHandler(submissionsController.bulkCreateSubmissions));

/**
 * GET /api/submissions/user/solved
 * Get all problems solved by authenticated user
 * Query: ?platform=leetcode&difficulty=easy&limit=20&page=1
 */
router.get('/user/solved', asyncHandler(submissionsController.getUserSolvedProblems));

/**
 * GET /api/submissions/user/attempts
 * Get all submission attempts (solved and unsolved)
 * Query: ?platform=leetcode&verdict=accepted&limit=50&page=1
 */
router.get('/user/attempts', asyncHandler(submissionsController.getUserSubmissions));

/**
 * GET /api/submissions/user/stats
 * Get comprehensive submission statistics
 */
router.get('/user/stats', asyncHandler(submissionsController.getUserSubmissionStats));

/**
 * GET /api/submissions/user/by-topic
 * Get solved problems grouped by topic
 */
router.get('/user/by-topic', asyncHandler(submissionsController.getUserSolvedByTopic));

/**
 * GET /api/submissions/platform/:platform
 * Get all submissions from specific platform (leetcode, codeforces, etc)
 * Query: ?limit=50&page=1
 */
router.get('/platform/:platform', asyncHandler(submissionsController.getPlatformSubmissions));

module.exports = router;

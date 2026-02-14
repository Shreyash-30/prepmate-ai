/**
 * Health & Monitoring Routes
 * Endpoints for system health, integration status, and queue management
 */

const express = require('express');
const { authMiddleware } = require('../middlewares/authMiddleware');
const healthController = require('../controllers/healthController');

const router = express.Router();

/**
 * GET /health/status
 * Quick health check (no auth required)
 */
router.get('/status', healthController.healthCheck);

/**
 * GET /health/system
 * System-wide health metrics
 */
router.get('/system', healthController.getSystemHealth);

// All other routes require authentication
router.use(authMiddleware);

/**
 * GET /health/user
 * User-specific health metrics
 */
router.get('/user', healthController.getUserHealth);

/**
 * GET /health/:platform
 * Health status for a specific platform integration
 */
router.get('/:platform', healthController.getIntegrationHealth);

/**
 * GET /health/:platform/history
 * Sync history for a platform
 * Query: limit=20
 */
router.get('/:platform/history', healthController.getSyncHistory);

/**
 * GET /health/queue/:platform/:jobId
 * Get status of a background job
 */
router.get('/queue/:platform/:jobId', healthController.getJobStatus);

/**
 * GET /health/queue/:platform/stats
 * Queue statistics for a platform
 */
router.get('/queue/:platform/stats', healthController.getQueueStats);

/**
 * POST /health/queue/:platform/retry/:jobId
 * Retry a failed job
 */
router.post('/queue/:platform/retry/:jobId', healthController.retryJob);

/**
 * DELETE /health/queue/:platform/failed
 * Clear failed jobs
 */
router.delete('/queue/:platform/failed', healthController.clearFailedJobs);

module.exports = router;

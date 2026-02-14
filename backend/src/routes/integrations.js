/**
 * Integration Routes
 * Connects integrations controllers to REST endpoints
 */

const express = require('express');
const multer = require('multer');
const { authMiddleware } = require('../middlewares/authMiddleware');
const integrationsController = require('../controllers/integrationsController');

const router = express.Router();

// File upload middleware (CSV only, max 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.includes('text/csv')) {
      return cb(new Error('Only CSV files allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// All routes require authentication
router.use(authMiddleware);

// ====== CodeForces Integration ======

/**
 * POST /api/integrations/codeforces/sync
 * Trigger CodeForces sync
 * Body: { cfHandle: string }
 */
router.post('/codeforces/sync', integrationsController.syncCodeForces);

// ====== LeetCode Integration ======

/**
 * POST /api/integrations/leetcode/sync
 * Trigger LeetCode sync
 * Body: { leetcodeUsername: string }
 */
router.post('/leetcode/sync', integrationsController.syncLeetCode);

// ====== Manual Upload ======

/**
 * POST /api/integrations/manual/upload
 * Upload CSV file
 * Form data: { file: File }
 * CSV required columns: platform, problem_id, [solved, attempts, solve_time, etc]
 */
router.post('/manual/upload', upload.single('file'), integrationsController.uploadCSV);

/**
 * POST /api/integrations/manual/entry
 * Add single manual problem entry
 * Body: {
 *   platform: string,
 *   problem_id: string,
 *   solved: boolean,
 *   attempts: number,
 *   solve_time: number (seconds),
 *   hints_used: number,
 *   language: string,
 *   topics: string|string[],
 *   timestamp: ISO date
 * }
 */
router.post('/manual/entry', integrationsController.addManualEntry);

// ====== General Integration Management ======

/**
 * GET /api/integrations/status
 * Get status of all integrations for user
 */
router.get('/status', integrationsController.getIntegrationStatus);

/**
 * GET /api/integrations/sync-history
 * Get recent sync history
 * Query: limit=10
 */
router.get('/sync-history', integrationsController.getSyncHistory);

/**
 * GET /api/integrations/:platform/instructions
 * Get connection instructions for a platform
 */
router.get('/:platform/instructions', integrationsController.getConnectionInstructions);

/**
 * GET /api/integrations/:platform/last-sync
 * Get last successful sync for platform
 */
router.get('/:platform/last-sync', integrationsController.getLastSync);

/**
 * DELETE /api/integrations/:platform/disconnect
 * Disconnect a platform integration
 */
router.delete('/:platform/disconnect', integrationsController.disconnectPlatform);

module.exports = router;

/**
 * Health & Monitoring Controller
 * REST endpoints for sync status, integration health, and system metrics
 */

const healthMonitoringService = require('../services/healthMonitoringService');
const syncQueueService = require('../services/syncQueueService');

/**
 * GET /api/health/system
 * Get overall system health metrics
 */
exports.getSystemHealth = async (req, res) => {
  try {
    const health = await healthMonitoringService.getSystemHealth();

    const statusCode = health.status === 'healthy' ? 200 : health.status === 'warning' ? 202 : 503;

    return res.status(statusCode).json(health);
  } catch (error) {
    console.error('Get system health error:', error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

/**
 * GET /api/health/user
 * Get health metrics for current user
 */
exports.getUserHealth = async (req, res) => {
  try {
    const userId = req.user._id;

    const health = await healthMonitoringService.getUserHealth(userId);

    return res.json({
      success: true,
      data: health,
    });
  } catch (error) {
    console.error('Get user health error:', error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

/**
 * GET /api/health/:platform
 * Get health for specific integration
 */
exports.getIntegrationHealth = async (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user._id;

    const health = await healthMonitoringService.getIntegrationHealth(userId, platform);

    return res.json({
      success: true,
      data: health,
    });
  } catch (error) {
    console.error('Get integration health error:', error);
    return res.status(error.message.includes('not found') ? 404 : 500).json({
      error: error.message,
    });
  }
};

/**
 * GET /api/health/:platform/history
 * Get sync history for a platform
 */
exports.getSyncHistory = async (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 20;

    const history = await healthMonitoringService.getSyncHistory(userId, platform, limit);

    return res.json({
      success: true,
      platform,
      count: history.length,
      syncs: history,
    });
  } catch (error) {
    console.error('Get sync history error:', error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

/**
 * GET /api/health/queue/:platform/:jobId
 * Get status of a background sync job
 */
exports.getJobStatus = async (req, res) => {
  try {
    const { platform, jobId } = req.params;

    const status = await syncQueueService.getJobStatus(platform, jobId);

    if (!status) {
      return res.status(404).json({
        error: 'Job not found',
      });
    }

    return res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Get job status error:', error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

/**
 * GET /api/health/queue/:platform/stats
 * Get queue statistics for a platform
 */
exports.getQueueStats = async (req, res) => {
  try {
    const { platform } = req.params;

    const stats = await syncQueueService.getQueueStats(platform);

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get queue stats error:', error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

/**
 * POST /api/health/queue/:platform/retry/:jobId
 * Retry a failed sync job
 */
exports.retryJob = async (req, res) => {
  try {
    const { platform, jobId } = req.params;

    const result = await syncQueueService.retryFailedJob(platform, jobId);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Retry job error:', error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

/**
 * DELETE /api/health/queue/:platform/failed
 * Clear failed jobs in queue
 */
exports.clearFailedJobs = async (req, res) => {
  try {
    const { platform } = req.params;

    const result = await syncQueueService.clearFailedJobs(platform);

    return res.json({
      success: true,
      message: `Cleared ${result.failedJobsCleared} failed jobs`,
      data: result,
    });
  } catch (error) {
    console.error('Clear failed jobs error:', error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

/**
 * GET /api/health/status
 * Quick health check (for monitoring/uptime)
 */
exports.healthCheck = async (req, res) => {
  try {
    const health = await healthMonitoringService.getSystemHealth();

    return res.status(health.status === 'healthy' ? 200 : 503).json({
      status: health.status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(503).json({
      status: 'error',
      error: error.message,
    });
  }
};

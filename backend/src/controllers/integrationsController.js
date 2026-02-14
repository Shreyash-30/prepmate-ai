/**
 * Integrations Controller
 * REST endpoints for triggering syncs and managing platform integrations
 */

const codeforcesSyncService = require('../services/codeforcesSyncService');
const leetcodeSyncService = require('../services/leetcodeSyncService');
const manualUploadService = require('../services/manualUploadService');
const IntegrationMetadata = require('../models/IntegrationMetadata');
const SyncLog = require('../models/SyncLog');

/**
 * POST /api/integrations/codeforces/sync
 * Trigger CodeForces sync for user
 */
exports.syncCodeForces = async (req, res) => {
  try {
    const { cfHandle } = req.body;
    const userId = req.user._id;

    if (!cfHandle) {
      return res.status(400).json({
        error: 'cfHandle is required',
      });
    }

    const result = await codeforcesSyncService.syncUserData(
      userId,
      cfHandle,
      'incremental'
    );

    // Update integration metadata connection status
    await IntegrationMetadata.findOneAndUpdate(
      { userId, platform: 'codeforces' },
      {
        platformUsername: cfHandle,
        isConnected: true,
        lastConnectionCheck: new Date(),
      },
      { upsert: true }
    );

    return res.json({
      success: true,
      message: 'CodeForces sync completed',
      data: result,
    });
  } catch (error) {
    console.error('CodeForces sync error:', error);
    return res.status(500).json({
      error: error.message || 'CodeForces sync failed',
      type: 'sync_error',
    });
  }
};

/**
 * POST /api/integrations/leetcode/sync
 * Trigger LeetCode sync for user
 */
exports.syncLeetCode = async (req, res) => {
  try {
    const { leetcodeUsername } = req.body;
    const userId = req.user._id;

    if (!leetcodeUsername) {
      return res.status(400).json({
        error: 'leetcodeUsername is required',
      });
    }

    const result = await leetcodeSyncService.syncUserData(
      userId,
      leetcodeUsername,
      'incremental'
    );

    // Update integration metadata
    await IntegrationMetadata.findOneAndUpdate(
      { userId, platform: 'leetcode' },
      {
        platformUsername: leetcodeUsername,
        isConnected: true,
        lastConnectionCheck: new Date(),
      },
      { upsert: true }
    );

    return res.json({
      success: true,
      message: 'LeetCode sync completed',
      data: result,
    });
  } catch (error) {
    console.error('LeetCode sync error:', error);
    return res.status(500).json({
      error: error.message || 'LeetCode sync failed',
      type: 'sync_error',
    });
  }
};

/**
 * POST /api/integrations/manual/upload
 * Upload CSV file with problems
 */
exports.uploadCSV = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
      });
    }

    // Validate file type
    if (!req.file.mimetype.includes('text/csv')) {
      return res.status(400).json({
        error: 'Only CSV files are supported',
      });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const result = await manualUploadService.syncCSVData(userId, csvContent);

    return res.json({
      success: true,
      message: 'CSV upload completed',
      data: result,
    });
  } catch (error) {
    console.error('CSV upload error:', error);
    return res.status(400).json({
      error: error.message || 'CSV upload failed',
      type: 'upload_error',
    });
  }
};

/**
 * POST /api/integrations/manual/entry
 * Add single manual problem entry
 */
exports.addManualEntry = async (req, res) => {
  try {
    const userId = req.user._id;
    const problemData = req.body;

    const result = await manualUploadService.addManualProblem(
      userId,
      problemData
    );

    return res.json({
      success: true,
      message: 'Problem entry added',
      data: result,
    });
  } catch (error) {
    console.error('Manual entry error:', error);
    return res.status(400).json({
      error: error.message || 'Failed to add manual entry',
      type: 'entry_error',
    });
  }
};

/**
 * GET /api/integrations/status
 * Get integration status for current user
 */
exports.getIntegrationStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    const integrations = await IntegrationMetadata.find({ userId });

    const status = {};
    for (const integration of integrations) {
      status[integration.platform] = {
        isConnected: integration.isConnected,
        platformUsername: integration.platformUsername,
        lastSyncTime: integration.lastSyncTime,
        nextSyncTime: integration.nextSyncTime,
        syncStatus: integration.syncStatus,
        rateLimit: integration.rateLimit,
        statistics: integration.statistics,
        health: integration.health,
      };
    }

    return res.json({
      success: true,
      integrations: status,
    });
  } catch (error) {
    console.error('Get integration status error:', error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

/**
 * GET /api/integrations/sync-history
 * Get recent sync logs for user
 */
exports.getSyncHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 10;

    const syncLogs = await SyncLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.json({
      success: true,
      syncLogs,
    });
  } catch (error) {
    console.error('Get sync history error:', error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

/**
 * GET /api/integrations/:platform/connect
 * Get connection instructions for platform
 */
exports.getConnectionInstructions = async (req, res) => {
  try {
    const { platform } = req.params;

    const instructions = {
      codeforces: {
        name: 'CodeForces',
        description: 'Fetch all submissions and contest history from CodeForces',
        requires: ['cfHandle'],
        url: 'https://codeforces.com',
        note: 'Enter your CodeForces handle (public profile)',
      },
      leetcode: {
        name: 'LeetCode',
        description: 'Fetch recent submissions and profile stats from LeetCode',
        requires: ['leetcodeUsername'],
        url: 'https://leetcode.com',
        note: 'Your LeetCode profile must be public',
      },
      hackerrank: {
        name: 'HackerRank',
        description: 'Coming soon - sync HackerRank submissions',
        requires: ['hackerrankUsername'],
        status: 'coming_soon',
      },
      geeksforgeeks: {
        name: 'GeeksforGeeks',
        description: 'Coming soon - sync GeeksforGeeks submissions',
        requires: ['geeksforgeeksUsername'],
        status: 'coming_soon',
      },
    };

    if (!instructions[platform]) {
      return res.status(404).json({
        error: `Unknown platform: ${platform}`,
      });
    }

    return res.json({
      success: true,
      platform: instructions[platform],
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};

/**
 * DELETE /api/integrations/:platform/disconnect
 * Disconnect a platform integration
 */
exports.disconnectPlatform = async (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user._id;

    const result = await IntegrationMetadata.findOneAndUpdate(
      { userId, platform },
      {
        isConnected: false,
        connectionError: 'User disconnected',
        lastConnectionCheck: new Date(),
      }
    );

    if (!result) {
      return res.status(404).json({
        error: 'Integration not found',
      });
    }

    return res.json({
      success: true,
      message: `${platform} integration disconnected`,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};

/**
 * GET /api/integrations/:platform/last-sync
 * Get last sync details for a platform
 */
exports.getLastSync = async (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user._id;

    const lastSync = await SyncLog.findOne({
      userId,
      platform,
      status: { $in: ['success', 'partial'] },
    }).sort({ createdAt: -1 });

    if (!lastSync) {
      return res.status(404).json({
        error: 'No successful sync found',
      });
    }

    return res.json({
      success: true,
      sync: {
        syncBatchId: lastSync.syncBatchId,
        platform: lastSync.platform,
        timestamp: lastSync.endTime,
        duration: lastSync.durationMs,
        recordsInserted: lastSync.insertedRecords,
        duplicates: lastSync.duplicateRecords,
        errors: lastSync.errors.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};

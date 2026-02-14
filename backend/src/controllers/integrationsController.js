/**
 * Integrations Controller
 * REST endpoints for triggering syncs and managing platform integrations
 */

const codeforcesSyncService = require('../services/codeforcesSyncService');
const leetcodeSyncService = require('../services/leetcodeSyncService');
const manualUploadService = require('../services/manualUploadService');
const IntegrationMetadata = require('../models/IntegrationMetadata');
const SyncLog = require('../models/SyncLog');
const logger = require('../utils/logger');

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

/**
 * POST /api/integrations/connect
 * Connect a new platform integration
 * Body: { platform: string, username: string }
 */
exports.connectPlatform = async (req, res) => {
  try {
    const { platform, username } = req.body;
    const userId = req.user._id;

    if (!platform || !username) {
      return res.status(400).json({
        success: false,
        error: 'platform and username are required',
      });
    }

    // Validate username format
    const ingestionValidationService = require('../services/ingestionValidationService');
    try {
      await ingestionValidationService.validateUsername(platform, username);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    // Create or update integration metadata
    const integration = await IntegrationMetadata.findOneAndUpdate(
      { userId, platform },
      {
        userId,
        platform,
        platformUsername: username,
        isConnected: true,
        syncStatus: 'idle',
        lastConnectionCheck: new Date(),
      },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      message: `${platform} connected successfully`,
      data: {
        integration: {
          platform: integration.platform,
          username: integration.platformUsername,
          isConnected: integration.isConnected,
          connectedAt: integration.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Platform connection error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to connect platform',
    });
  }
};

/**
 * GET /api/integrations/sync-progress
 * Get current and recent sync progress
 * Query: { platform?: string }
 */
exports.getSyncProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { platform } = req.query;

    let query = { userId };
    if (platform) {
      query.platform = platform;
    }

    const syncLogs = await SyncLog.find(query)
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const progress = {
      current: null,
      recent: [],
    };

    // Get current sync (if any)
    const integrations = await IntegrationMetadata.find(query).lean();

    for (const integration of integrations) {
      if (integration.syncStatus === 'syncing') {
        const currentSync = syncLogs.find(log =>
          log.platform === integration.platform && log.status === 'in_progress'
        );

        if (currentSync) {
          progress.current = {
            platform: integration.platform,
            status: 'syncing',
            startedAt: currentSync.startTime,
            estimatedTimeRemaining: exports.estimateSyncDuration(integration.platform),
            recordsProcessed: currentSync.processedRecords || 0,
            recordsInserted: currentSync.insertedRecords || 0,
          };
        }
      }
    }

    // Get recent syncs
    progress.recent = syncLogs.map(log => ({
      platform: log.platform,
      status: log.status,
      timestamp: log.endTime || log.startTime,
      recordsInserted: log.insertedRecords,
      recordsSkipped: log.skippedRecords,
      duration: log.durationMs,
      errors: log.errors ? log.errors.slice(0, 3) : [],
    }));

    return res.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    console.error('Get sync progress error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * POST /api/integrations/sync-now
 * Immediately trigger sync for a platform
 * Body: { platform: string }
 */
exports.syncNow = async (req, res) => {
  try {
    const { platform } = req.body;
    const userId = req.user._id;

    if (!platform) {
      return res.status(400).json({
        success: false,
        error: 'platform is required',
      });
    }

    // Get integration
    const integration = await IntegrationMetadata.findOne({ userId, platform });

    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'Integration not found',
      });
    }

    if (!integration.isConnected) {
      return res.status(400).json({
        success: false,
        error: 'Integration is not connected',
      });
    }

    // Check rate limit
    const ingestionValidationService = require('../services/ingestionValidationService');
    const rateLimit = await ingestionValidationService.checkRateLimit(userId, platform);

    if (!rateLimit.isAllowed) {
      return res.status(429).json({
        success: false,
        error: rateLimit.message || 'Too many requests',
        retryAfter: rateLimit.retryAfter,
      });
    }

    // Trigger sync based on platform
    let syncPromise;

    if (platform === 'codeforces') {
      syncPromise = codeforcesSyncService.syncUserData(
        userId,
        integration.platformUsername,
        'incremental'
      );
    } else if (platform === 'leetcode') {
      syncPromise = leetcodeSyncService.syncUserData(
        userId,
        integration.platformUsername,
        'incremental'
      );
    } else {
      return res.status(400).json({
        success: false,
        error: 'Platform sync not supported',
      });
    }

    // Run sync in background and aggregate results
    syncPromise
      .then(async result => {
        const telemetryAggregationService = require('../services/telemetryAggregationService');
        const aggregation = await telemetryAggregationService.aggregateSyncResults(result, userId);
        logger.info(`✅ Sync and aggregation complete for ${platform}`, aggregation);
      })
      .catch(error => {
        logger.error(`Sync failed for ${platform}:`, error);
      });

    return res.json({
      success: true,
      message: 'Sync triggered. Check back in a moment for results.',
      data: {
        platform,
        status: 'syncing',
        estimatedDuration: exports.estimateSyncDuration(platform),
      },
    });
  } catch (error) {
    console.error('Sync now error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to trigger sync',
    });
  }
};

/**
 * Helper: Estimate sync duration by platform (in seconds)
 */
exports.estimateSyncDuration = (platform) => {
  const estimates = {
    codeforces: 30,
    leetcode: 20,
    hackerrank: 25,
    geeksforgeeks: 20,
  };

  return estimates[platform] || 30;
};

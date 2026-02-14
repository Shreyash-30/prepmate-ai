/**
 * Health & Monitoring Service
 * Tracks integration health, sync status, and system metrics
 */

const SyncLog = require('../models/SyncLog');
const IntegrationMetadata = require('../models/IntegrationMetadata');
const UserSubmission = require('../models/UserSubmission');

class HealthMonitoringService {
  /**
   * Get overall system health
   */
  async getSystemHealth() {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now - 60 * 60 * 1000);
      const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);

      // Recent syncs
      const recentSyncs = await SyncLog.find({
        startTime: { $gte: oneHourAgo }
      });

      const daysSyncs = await SyncLog.find({
        startTime: { $gte: twentyFourHoursAgo }
      });

      // Integration connections
      const integrations = await IntegrationMetadata.find();
      const connectedCount = integrations.filter(i => i.isConnected).length;

      // Recent errors
      const failedSyncs = recentSyncs.filter(s => s.status === 'failed');
      const partialSyncs = recentSyncs.filter(s => s.status === 'partial');

      const successRate = recentSyncs.length > 0
        ? ((recentSyncs.length - failedSyncs.length) / recentSyncs.length) * 100
        : 100;

      const recordsInserted = daysSyncs.reduce((sum, s) => sum + (s.insertedRecords || 0), 0);
      const totalErrors = recentSyncs.reduce((sum, s) => sum + s.errors.length, 0);

      return {
        timestamp: now,
        status: successRate >= 95 ? 'healthy' : successRate >= 80 ? 'warning' : 'error',
        metrics: {
          successRate: Math.round(successRate * 100) / 100,
          recentSyncs: recentSyncs.length,
          failedSyncs: failedSyncs.length,
          partialSyncs: partialSyncs.length,
          recordsInserted24h: recordsInserted,
          totalErrors1h: totalErrors,
        },
        integrations: {
          total: integrations.length,
          connected: connectedCount,
          disconnected: integrations.length - connectedCount,
        },
        lastSync: recentSyncs.length > 0
          ? recentSyncs[0].endTime || recentSyncs[0].startTime
          : null,
      };
    } catch (error) {
      return {
        timestamp: new Date(),
        status: 'error',
        error: error.message,
      };
    }
  }

  /**
   * Get health for specific user
   */
  async getUserHealth(userId) {
    try {
      const integrations = await IntegrationMetadata.find({ userId });
      const recentSyncs = await SyncLog.find({ userId }).sort({ createdAt: -1 }).limit(20);

      const integrationHealth = {};

      for (const integration of integrations) {
        const platformSyncs = recentSyncs.filter(s => s.platform === integration.platform);
        const successCount = platformSyncs.filter(s => s.status === 'success' || s.status === 'partial').length;

        integrationHealth[integration.platform] = {
          isConnected: integration.isConnected,
          lastSyncTime: integration.lastSyncTime,
          syncStatus: integration.syncStatus,
          recentSyncs: platformSyncs.length,
          successRate: platformSyncs.length > 0
            ? (successCount / platformSyncs.length) * 100
            : 0,
          health: integration.health?.status || 'unknown',
          issues: integration.health?.issues || [],
        };
      }

      const totalProblems = await UserSubmission.countDocuments({ userId });
      const solvedProblems = await UserSubmission.countDocuments({ userId, isSolved: true });

      return {
        userId,
        timestamp: new Date(),
        integrations: integrationHealth,
        statistics: {
          totalProblems,
          solvedProblems,
          problemSolveRate: totalProblems > 0 ? (solvedProblems / totalProblems) * 100 : 0,
          lastActivityTime: recentSyncs.length > 0 ? recentSyncs[0].createdAt : null,
        },
      };
    } catch (error) {
      return {
        userId,
        status: 'error',
        error: error.message,
      };
    }
  }

  /**
   * Get health for specific integration
   */
  async getIntegrationHealth(userId, platform) {
    try {
      const integration = await IntegrationMetadata.findOne({ userId, platform });

      if (!integration) {
        throw new Error('Integration not found');
      }

      const recentSyncs = await SyncLog.find({ userId, platform }).sort({ createdAt: -1 }).limit(50);

      const issues = [];

      // Check connection status
      if (!integration.isConnected) {
        issues.push({
          level: 'error',
          message: 'Integration disconnected',
          lastConnectionError: integration.connectionError,
        });
      }

      // Check sync health
      const failedSyncs = recentSyncs.filter(s => s.status === 'failed');
      if (failedSyncs.length > 5) {
        issues.push({
          level: 'warning',
          message: `${failedSyncs.length} failed syncs in recent history`,
        });
      }

      // Check rate limits
      if (integration.rateLimit?.remaining === 0) {
        issues.push({
          level: 'warning',
          message: 'Rate limit reached',
          resetTime: integration.rateLimit?.resetTime,
        });
      }

      // Check data quality
      if (integration.dataQuality?.completeness < 80) {
        issues.push({
          level: 'warning',
          message: 'Low data completeness',
          completeness: integration.dataQuality?.completeness,
        });
      }

      const successSyncs = recentSyncs.filter(s => s.status === 'success' || s.status === 'partial');

      return {
        userId,
        platform,
        timestamp: new Date(),
        connection: {
          isConnected: integration.isConnected,
          lastConnectionCheck: integration.lastConnectionCheck,
          connectionError: integration.connectionError,
        },
        sync: {
          lastSyncTime: integration.lastSyncTime,
          nextSyncTime: integration.nextSyncTime,
          syncStatus: integration.syncStatus,
          autoSync: integration.autoSync,
          syncFrequency: integration.syncFrequency,
        },
        statistics: integration.statistics,
        dataQuality: integration.dataQuality,
        rateLimit: integration.rateLimit,
        recentSyncs: recentSyncs.map(s => ({
          syncBatchId: s.syncBatchId,
          status: s.status,
          timestamp: s.endTime || s.startTime,
          recordsInserted: s.insertedRecords,
          duplicates: s.duplicateRecords,
          errors: s.errors.length,
        })),
        issues,
        healthStatus: issues.length === 0 ? 'healthy' : issues.some(i => i.level === 'error') ? 'error' : 'warning',
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get sync history with detailed metrics
   */
  async getSyncHistory(userId, platform, limit = 20) {
    try {
      const query = { userId };
      if (platform) query.platform = platform;

      const syncs = await SyncLog.find(query)
        .sort({ createdAt: -1 })
        .limit(limit);

      return syncs.map(sync => ({
        syncBatchId: sync.syncBatchId,
        platform: sync.platform,
        syncType: sync.syncType,
        status: sync.status,
        timestamp: sync.endTime || sync.startTime,
        duration: sync.durationMs,
        records: {
          fetched: sync.fetchedRecords,
          inserted: sync.insertedRecords,
          updated: sync.updatedRecords,
          duplicates: sync.duplicateRecords,
          failed: sync.failedRecords,
        },
        errors: sync.errors.map(e => ({
          message: e.message,
          type: e.type,
          timestamp: e.timestamp,
        })),
        quality: {
          completeness: sync.dataQuality?.completeness,
          validity: sync.dataQuality?.validity,
          consistency: sync.dataQuality?.consistency,
        },
      }));
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new HealthMonitoringService();

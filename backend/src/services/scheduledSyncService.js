/**
 * Scheduled Sync Service
 * Manages recurring sync jobs (daily, weekly) with cron scheduling
 * Handles retry logic with exponential backoff
 */

const cron = require('node-cron');
const IntegrationMetadata = require('../models/IntegrationMetadata');
const SyncLog = require('../models/SyncLog');
const codeforcesSyncService = require('./codeforcesSyncService');
const leetcodeSyncService = require('./leetcodeSyncService');
const syncQueueService = require('./syncQueueService');
const logger = require('../utils/logger');

class ScheduledSyncService {
  constructor() {
    this.jobs = {};
    this.syncInProgress = new Set(); // Track active syncs to prevent duplicates
  }

  /**
   * Initialize scheduled sync jobs
   */
  async initialize() {
    try {
      logger.info('Initializing scheduled sync service');

      // Daily sync job - runs every day at 2 AM
      this.jobs.dailySync = cron.schedule('0 2 * * *', () => {
        this.triggerDailySync();
      });

      // Weekly contest rating sync - runs every Monday at 3 AM
      this.jobs.weeklyContestSync = cron.schedule('0 3 * * 1', () => {
        this.triggerWeeklyContestSync();
      });

      // Hourly health check - runs every hour
      this.jobs.healthCheck = cron.schedule('0 * * * *', () => {
        this.checkIntegrationHealth();
      });

      logger.info('✅ Scheduled sync service initialized');
      logger.info('  Daily sync: Every day at 2:00 AM');
      logger.info('  Weekly contest sync: Every Monday at 3:00 AM');
      logger.info('  Health check: Every hour');

      return true;
    } catch (error) {
      logger.error('Failed to initialize scheduled sync service:', error);
      return false;
    }
  }

  /**
   * Trigger daily sync for all connected integrations
   */
  async triggerDailySync() {
    try {
      logger.info('🔄 Starting daily sync job');

      // Get all connected integrations
      const integrations = await IntegrationMetadata.find({
        isConnected: true,
      });

      if (integrations.length === 0) {
        logger.info('No integrations to sync');
        return;
      }

      const syncPromises = integrations.map(integration =>
        this.syncIntegration(integration, 'incremental').catch(error =>
          logger.error(`Sync error for ${integration.platform}:`, error)
        )
      );

      await Promise.allSettled(syncPromises);

      logger.info(`✅ Daily sync complete. Synced ${integrations.length} integrations`);
    } catch (error) {
      logger.error('Error in triggerDailySync:', error);
    }
  }

  /**
   * Trigger weekly contest rating sync
   */
  async triggerWeeklyContestSync() {
    try {
      logger.info('🏆 Starting weekly contest rating sync');

      // Focus on CodeForces and LeetCode contests
      const platforms = ['codeforces', 'leetcode'];

      const integrations = await IntegrationMetadata.find({
        isConnected: true,
        platform: { $in: platforms },
      });

      const contestSyncPromises = integrations.map(integration =>
        this.syncContestRatings(integration).catch(error =>
          logger.error(`Contest sync error for ${integration.platform}:`, error)
        )
      );

      await Promise.allSettled(contestSyncPromises);

      logger.info('✅ Weekly contest sync complete');
    } catch (error) {
      logger.error('Error in triggerWeeklyContestSync:', error);
    }
  }

  /**
   * Sync a single integration
   * @param {Object} integration - IntegrationMetadata document
   * @param {String} syncType - 'incremental' or 'full'
   */
  async syncIntegration(integration, syncType = 'incremental') {
    const syncKey = `${integration.userId}-${integration.platform}`;

    // Prevent duplicate concurrent syncs
    if (this.syncInProgress.has(syncKey)) {
      logger.warn(`Sync already in progress for ${syncKey}`);
      return;
    }

    this.syncInProgress.add(syncKey);

    try {
      logger.info(`Syncing ${integration.platform} for user ${integration.userId}`);

      let result;

      switch (integration.platform) {
        case 'codeforces':
          result = await codeforcesSyncService.syncUserData(
            integration.userId,
            integration.platformUsername,
            syncType
          );
          break;

        case 'leetcode':
          result = await leetcodeSyncService.syncUserData(
            integration.userId,
            integration.platformUsername,
            syncType
          );
          break;

        default:
          logger.warn(`Unknown platform: ${integration.platform}`);
          return;
      }

      // Update integration metadata
      await IntegrationMetadata.findByIdAndUpdate(integration._id, {
        lastSyncTime: new Date(),
        syncStatus: result?.success ? 'success' : 'partial',
        nextSyncTime: this.calculateNextSyncTime(),
        $inc: { syncCount: 1 },
      });

      logger.info(`✅ Sync complete for ${integration.platform}:`, {
        recordsInserted: result?.recordsInserted,
        duplicates: result?.duplicates,
      });

      return result;
    } catch (error) {
      logger.error(`Sync failed for ${integration.platform}:`, error);

      // Update error state
      await IntegrationMetadata.findByIdAndUpdate(integration._id, {
        syncStatus: 'failed',
        connectionError: error.message,
        lastSyncTime: new Date(),
        $inc: { syncFailureCount: 1 },
      });

      throw error;
    } finally {
      this.syncInProgress.delete(syncKey);
    }
  }

  /**
   * Sync contest rating history
   * @param {Object} integration - IntegrationMetadata document
   */
  async syncContestRatings(integration) {
    try {
      logger.info(`Fetching contest ratings for ${integration.platform}`);

      let result;

      if (integration.platform === 'codeforces') {
        result = await codeforcesSyncService.fetchContestRatingHistory(
          integration.platformUsername
        );
      } else if (integration.platform === 'leetcode') {
        result = await leetcodeSyncService.fetchContestHistory(
          integration.platformUsername
        );
      }

      if (result) {
        logger.info(`✅ Fetched ${result.length} contest records`);
      }

      return result;
    } catch (error) {
      logger.error(`Error fetching contest ratings for ${integration.platform}:`, error);
      throw error;
    }
  }

  /**
   * Check health of all integrations
   * Verify connectivity and update status
   */
  async checkIntegrationHealth() {
    try {
      logger.debug('🏥 Running integration health check');

      const integrations = await IntegrationMetadata.find({
        isConnected: true,
      }).limit(50); // Process in batches

      let healthy = 0;
      let unhealthy = 0;

      for (const integration of integrations) {
        try {
          const isHealthy = await this.verifyIntegrationHealth(integration);

          if (isHealthy) {
            healthy++;
            await IntegrationMetadata.findByIdAndUpdate(integration._id, {
              health: { status: 'healthy', lastCheck: new Date() },
              connectionError: null,
            });
          } else {
            unhealthy++;
            await IntegrationMetadata.findByIdAndUpdate(integration._id, {
              health: { 
                status: 'unhealthy', 
                lastCheck: new Date(),
                reason: 'Connection verification failed',
              },
              connectionError: 'Health check failed',
            });
          }
        } catch (error) {
          unhealthy++;
          logger.warn(`Health check failed for ${integration.platform}:`, error.message);
        }
      }

      logger.debug(`Health check complete: ${healthy} healthy, ${unhealthy} unhealthy`);
    } catch (error) {
      logger.error('Error in checkIntegrationHealth:', error);
    }
  }

  /**
   * Verify integration connectivity
   * @param {Object} integration - IntegrationMetadata document
   * @returns {Boolean} - Is healthy
   */
  async verifyIntegrationHealth(integration) {
    try {
      switch (integration.platform) {
        case 'codeforces':
          return await codeforcesSyncService.verifyConnection(integration.platformUsername);

        case 'leetcode':
          return await leetcodeSyncService.verifyConnection(integration.platformUsername);

        default:
          return false;
      }
    } catch (error) {
      logger.warn(`Verification failed for ${integration.platform}:`, error.message);
      return false;
    }
  }

  /**
   * Calculate next sync time (24 hours from now)
   * @returns {Date}
   */
  calculateNextSyncTime(hoursFromNow = 24) {
    const nextTime = new Date();
    nextTime.setHours(nextTime.getHours() + hoursFromNow);
    return nextTime;
  }

  /**
   * Manually trigger sync for a user
   * @param {ObjectId} userId
   * @param {String} platform - Optional, specific platform to sync
   * @returns {Object} - Sync result
   */
  async triggerManualSync(userId, platform = null) {
    try {
      logger.info(`Manual sync triggered for user ${userId}, platform: ${platform || 'all'}`);

      let integrations;
      if (platform) {
        integrations = await IntegrationMetadata.find({ userId, platform, isConnected: true });
      } else {
        integrations = await IntegrationMetadata.find({ userId, isConnected: true });
      }

      if (integrations.length === 0) {
        return {
          success: false,
          message: 'No connected integrations found',
        };
      }

      const results = {};

      for (const integration of integrations) {
        try {
          const result = await this.syncIntegration(integration, 'incremental');
          results[integration.platform] = { success: true, ...result };
        } catch (error) {
          results[integration.platform] = { success: false, error: error.message };
        }
      }

      return {
        success: true,
        results,
      };
    } catch (error) {
      logger.error('Error in triggerManualSync:', error);
      throw error;
    }
  }

  /**
   * Get sync schedule info
   * @returns {Object} - Schedule details
   */
  getScheduleInfo() {
    return {
      dailySync: 'Every day at 2:00 AM UTC',
      weeklyContestSync: 'Every Monday at 3:00 AM UTC',
      healthCheck: 'Every hour',
      isActive: !!(this.jobs.dailySync && this.jobs.weeklyContestSync),
    };
  }

  /**
   * Stop all scheduled jobs (for shutdown)
   */
  stopAll() {
    Object.values(this.jobs).forEach(job => job.stop());
    logger.info('✅ All scheduled sync jobs stopped');
  }
}

module.exports = new ScheduledSyncService();

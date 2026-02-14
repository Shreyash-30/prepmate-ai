/**
 * User Platform Sync State Service
 * Manages incremental sync cursors and state tracking
 * Enables resumable, efficient syncing without full history fetches
 */

const UserPlatformSyncState = require('../models/UserPlatformSyncState');
const logger = require('../utils/logger');

class UserPlatformSyncStateService {
  /**
   * Get or create sync state for user-platform combination
   * @param {ObjectId} userId - User ID
   * @param {String} platform - Platform name
   * @returns {Object} - Sync state
   */
  async getOrCreateSyncState(userId, platform) {
    try {
      let syncState = await UserPlatformSyncState.findOne({
        user_id: userId,
        platform,
      });

      if (!syncState) {
        syncState = new UserPlatformSyncState({
          user_id: userId,
          platform,
          last_synced_submission_id: null,
          last_synced_timestamp: null,
          last_sync_status: 'pending',
        });

        await syncState.save();
        logger.info(`Created sync state for user ${userId}, platform ${platform}`);
      }

      return syncState;
    } catch (error) {
      logger.error('Error in getOrCreateSyncState:', error);
      throw error;
    }
  }

  /**
   * Update sync state after successful ingestion
   * @param {ObjectId} userId - User ID
   * @param {String} platform - Platform name
   * @param {String} lastSubmissionId - Last ingested submission ID
   * @param {Date} lastTimestamp - Last ingested submission timestamp
   * @param {Object} metrics - Sync metrics
   */
  async updateSyncStateSuccess(userId, platform, lastSubmissionId, lastTimestamp, metrics = {}) {
    try {
      const syncState = await UserPlatformSyncState.findOneAndUpdate(
        { user_id: userId, platform },
        {
          $set: {
            last_synced_submission_id: lastSubmissionId,
            last_synced_timestamp: lastTimestamp,
            last_sync_status: 'success',
            last_sync_attempt: new Date(),
            next_retry_time: null,
            current_retry_attempt: 0,
            error_count: 0,
            ...(metrics.duration && { last_sync_duration_ms: metrics.duration }),
            ...(metrics.fetched && { last_sync_records_fetched: metrics.fetched }),
            ...(metrics.processed && { last_sync_records_processed: metrics.processed }),
            ...(metrics.failed && { last_sync_records_failed: metrics.failed }),
            updatedAt: new Date(),
          },
          $inc: {
            total_syncs: 1,
            successful_syncs: 1,
          },
        },
        { upsert: true, new: true }
      );

      logger.info(
        `Updated sync state SUCCESS for user ${userId}, platform ${platform}: ${metrics.processed || 0} records`
      );

      return syncState;
    } catch (error) {
      logger.error('Error updating sync state success:', error);
      throw error;
    }
  }

  /**
   * Update sync state for partial success
   * @param {ObjectId} userId - User ID
   * @param {String} platform - Platform name
   * @param {Object} metrics - Sync metrics
   */
  async updateSyncStatePartial(userId, platform, metrics = {}) {
    try {
      const syncState = await UserPlatformSyncState.findOneAndUpdate(
        { user_id: userId, platform },
        {
          $set: {
            last_sync_status: 'partial',
            last_sync_attempt: new Date(),
            ...(metrics.duration && { last_sync_duration_ms: metrics.duration }),
            ...(metrics.fetched && { last_sync_records_fetched: metrics.fetched }),
            ...(metrics.processed && { last_sync_records_processed: metrics.processed }),
            ...(metrics.failed && { last_sync_records_failed: metrics.failed }),
            updatedAt: new Date(),
          },
          $inc: {
            total_syncs: 1,
            partial_syncs: 1,
          },
        },
        { upsert: true, new: true }
      );

      logger.warn(
        `Updated sync state PARTIAL for user ${userId}, platform ${platform}: ${metrics.failed || 0} failed`
      );

      return syncState;
    } catch (error) {
      logger.error('Error updating sync state partial:', error);
      throw error;
    }
  }

  /**
   * Update sync state for failure with retry scheduling
   * @param {ObjectId} userId - User ID
   * @param {String} platform - Platform name
   * @param {String} errorMessage - Error message
   */
  async updateSyncStateFailure(userId, platform, errorMessage) {
    try {
      const syncState = await UserPlatformSyncState.findOneAndUpdate(
        { user_id: userId, platform },
        {
          $set: {
            last_sync_status: 'failed',
            last_error: errorMessage,
            last_sync_attempt: new Date(),
            next_retry_time: this.calculateNextRetryTime(0), // Will be overridden by retry increment
            updatedAt: new Date(),
          },
          $inc: {
            total_syncs: 1,
            failed_syncs: 1,
            error_count: 1,
            current_retry_attempt: 1,
          },
        },
        { upsert: true, new: true }
      );

      // Calculate exponential backoff for retry
      const nextRetry = this.calculateNextRetryTime(syncState.current_retry_attempt);
      await UserPlatformSyncState.updateOne(
        { _id: syncState._id },
        { $set: { next_retry_time: nextRetry } }
      );

      logger.warn(
        `Updated sync state FAILURE for user ${userId}, platform ${platform}. Retry ${syncState.current_retry_attempt}/${syncState.max_retries}`
      );

      return syncState;
    } catch (error) {
      logger.error('Error updating sync state failure:', error);
      throw error;
    }
  }

  /**
   * Calculate next retry time using exponential backoff
   * @param {Number} retryAttempt - Current retry attempt
   * @returns {Date} - Next retry time
   */
  calculateNextRetryTime(retryAttempt) {
    // Exponential backoff: 2^attempt minutes, capped at 24 hours
    const minutesDelay = Math.min(24 * 60, Math.pow(2, retryAttempt));
    return new Date(Date.now() + minutesDelay * 60 * 1000);
  }

  /**
   * Get sync states ready for retry
   * @returns {Array} - Sync states ready for retry
   */
  async getSyncStatesForRetry() {
    try {
      const now = new Date();

      return await UserPlatformSyncState.find({
        $or: [
          { last_sync_status: 'failed', next_retry_time: { $lte: now } },
          { last_sync_status: 'pending', current_retry_attempt: { $lt: 3 } },
        ],
        current_retry_attempt: { $lt: 5 }, // Max 5 attempts
        is_active: true,
      });
    } catch (error) {
      logger.error('Error getting sync states for retry:', error);
      throw error;
    }
  }

  /**
   * Reset sync state for fresh sync
   * @param {ObjectId} userId - User ID
   * @param {String} platform - Platform name
   */
  async resetSyncState(userId, platform) {
    try {
      const syncState = await UserPlatformSyncState.findOneAndUpdate(
        { user_id: userId, platform },
        {
          $set: {
            last_synced_submission_id: null,
            last_synced_timestamp: null,
            last_sync_status: 'pending',
            current_retry_attempt: 0,
            error_count: 0,
            last_error: null,
            next_retry_time: null,
            updatedAt: new Date(),
          },
        },
        { upsert: true, new: true }
      );

      logger.info(`Reset sync state for user ${userId}, platform ${platform}`);
      return syncState;
    } catch (error) {
      logger.error('Error resetting sync state:', error);
      throw error;
    }
  }

  /**
   * Get sync status summary for platform
   * @param {String} platform - Platform name
   * @returns {Object} - Status summary
   */
  async getPlatformSyncStatus(platform) {
    try {
      const states = await UserPlatformSyncState.find({ platform });

      const summary = {
        platform,
        total_users: states.length,
        active_users: states.filter((s) => s.is_active).length,
        successful_syncs: states.filter((s) => s.last_sync_status === 'success').length,
        failed_syncs: states.filter((s) => s.last_sync_status === 'failed').length,
        pending_syncs: states.filter((s) => s.last_sync_status === 'pending').length,
        users_failing: states.filter((s) => s.error_count > 2).length,
        avg_sync_duration_ms:
          states.reduce((sum, s) => sum + (s.last_sync_duration_ms || 0), 0) / states.length || 0,
      };

      return summary;
    } catch (error) {
      logger.error('Error getting platform sync status:', error);
      throw error;
    }
  }

  /**
   * Invalidate sync state (mark as needing full resync)
   * Used when platform API changes or data inconsistency detected
   * @param {String} platform - Platform name
   */
  async invalidatePlatformSyncStates(platform) {
    try {
      const result = await UserPlatformSyncState.updateMany(
        { platform },
        {
          $set: {
            last_synced_submission_id: null,
            last_synced_timestamp: null,
            last_sync_status: 'pending',
            current_retry_attempt: 0,
            updatedAt: new Date(),
          },
        }
      );

      logger.warn(`Invalidated ${result.modifiedCount} sync states for platform ${platform}`);
      return result;
    } catch (error) {
      logger.error('Error invalidating platform sync states:', error);
      throw error;
    }
  }
}

module.exports = new UserPlatformSyncStateService();

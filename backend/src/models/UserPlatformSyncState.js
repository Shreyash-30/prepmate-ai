const mongoose = require('mongoose');

/**
 * UserPlatformSyncState Schema
 * Tracks incremental sync cursor for each user-platform combination
 * Enables resumable, efficient re-syncing without full history fetches
 */
const userPlatformSyncStateSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    platform: {
      type: String,
      enum: ['leetcode', 'codeforces', 'hackerrank', 'geeksforgeeks', 'interviewbit', 'codechef', 'manual'],
      required: true,
      index: true,
    },

    // Incremental sync cursor
    last_synced_submission_id: {
      type: String,
      description: 'Platform-specific submission ID for resumable sync',
    },

    last_synced_timestamp: {
      type: Date,
      description: 'Timestamp of last synced submission for incremental queries',
    },

    // Sync state management
    last_sync_status: {
      type: String,
      enum: ['success', 'partial', 'failed', 'pending'],
      default: 'pending',
      index: true,
    },

    last_sync_attempt: Date,
    next_retry_time: Date,

    // Sync metrics
    total_syncs: {
      type: Number,
      default: 0,
    },
    successful_syncs: {
      type: Number,
      default: 0,
    },
    failed_syncs: {
      type: Number,
      default: 0,
    },
    partial_syncs: {
      type: Number,
      default: 0,
    },

    // Error tracking
    last_error: String,
    error_count: {
      type: Number,
      default: 0,
    },

    // Retry backoff
    current_retry_attempt: {
      type: Number,
      default: 0,
    },
    max_retries: {
      type: Number,
      default: 5,
    },

    // Performance metrics
    last_sync_duration_ms: Number,
    last_sync_records_fetched: Number,
    last_sync_records_processed: Number,
    last_sync_records_failed: Number,

    // Batch processing info
    batch_size: {
      type: Number,
      default: 100,
    },

    // Platform-specific state
    platform_specific_state: {
      type: Map,
      of: String,
      description: 'Platform-specific sync state (e.g., GraphQL cursor for LeetCode)',
    },

    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    collection: 'user_platform_sync_states',
    timestamps: true,
  }
);

// Unique constraint: one sync state per user-platform combination
userPlatformSyncStateSchema.index({ user_id: 1, platform: 1 }, { unique: true });

// Query indexes
userPlatformSyncStateSchema.index({ last_sync_status: 1, next_retry_time: 1 }); // For scheduler
userPlatformSyncStateSchema.index({ platform: 1, last_sync_status: 1 }); // For batch operations

module.exports = mongoose.model('UserPlatformSyncState', userPlatformSyncStateSchema);

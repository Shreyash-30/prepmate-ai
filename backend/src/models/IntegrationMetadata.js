const mongoose = require('mongoose');

/**
 * IntegrationMetadata Schema - Tracks platform integration state
 * Rate limits, sync cursors, credentials, and health checks
 */
const integrationMetadataSchema = new mongoose.Schema(
  {
    // Integration identification
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ['leetcode', 'codeforces', 'hackerrank', 'atcoder', 'manual'],
      required: true,
      index: true,
    },
    
    // Composite unique index
    // userId + platform must be unique
    
    // Credentials
    platformUsername: {
      type: String,
      required: true,
    },
    platformUserId: String,
    accessToken: String, // encrypted
    refreshToken: String, // encrypted
    tokenExpiresAt: Date,
    
    // Integration status
    isConnected: {
      type: Boolean,
      default: false,
      index: true,
    },
    lastConnectionCheck: Date,
    connectionError: String,
    
    // Sync state
    lastSyncTime: {
      type: Date,
      index: true,
    },
    nextSyncTime: Date,
    lastSyncBatchId: String,
    syncStatus: {
      type: String,
      enum: ['idle', 'syncing', 'success', 'failed'],
      default: 'idle',
    },
    
    // Incremental sync cursor
    syncCursor: {
      lastId: String,
      lastTimestamp: Date,
      offset: Number,
      checkpoint: mongoose.Schema.Types.Mixed,
    },
    
    // Rate limiting
    rateLimit: {
      requests: Number,
      perSeconds: Number,
      remaining: Number,
      resetTime: Date,
      limitReachedAt: Date,
    },
    
    // Statistics
    statistics: {
      totalSyncs: {
        type: Number,
        default: 0,
      },
      successfulSyncs: {
        type: Number,
        default: 0,
      },
      failedSyncs: {
        type: Number,
        default: 0,
      },
      totalRecordsFetched: {
        type: Number,
        default: 0,
      },
      averageSyncTimeMs: Number,
      lastSyncRecordCount: Number,
    },
    
    // Data quality checks
    dataQuality: {
      completeness: {
        type: Number,
        min: 0,
        max: 100,
      },
      validity: {
        type: Number,
        min: 0,
        max: 100,
      },
      freshness: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
    
    // Health metrics
    health: {
      status: {
        type: String,
        enum: ['healthy', 'warning', 'error'],
        default: 'healthy',
      },
      lastHealthCheck: Date,
      issues: [String],
    },
    
    // Notifications
    notifyOnSync: {
      type: Boolean,
      default: false,
    },
    notifyEmail: String,
    
    // Configuration
    syncFrequency: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'manual'],
      default: 'daily',
    },
    autoSync: {
      type: Boolean,
      default: true,
    },
    
    // Deduplication
    deduplicationStrategy: {
      type: String,
      enum: ['platform_id', 'hash', 'timestamp', 'composite'],
      default: 'platform_id',
    },
    
    // Metadata
    platformMetadata: mongoose.Schema.Types.Mixed,
    
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Composite unique index
integrationMetadataSchema.index({ userId: 1, platform: 1 }, { unique: true });
integrationMetadataSchema.index({ isConnected: 1, lastSyncTime: -1 });
integrationMetadataSchema.index({ platform: 1, lastSyncTime: -1 });

module.exports = mongoose.model('IntegrationMetadata', integrationMetadataSchema);

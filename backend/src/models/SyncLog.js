const mongoose = require('mongoose');

/**
 * SyncLog Schema - Audit trail for all telemetry ingestions
 * Ensures reliability, deduplication, and debugging
 */
const syncLogSchema = new mongoose.Schema(
  {
    // Sync identification
    syncBatchId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    
    // Source
    platform: {
      type: String,
      enum: ['leetcode', 'codeforces', 'hackerrank', 'manual', 'csv'],
      required: true,
      index: true,
    },
    syncType: {
      type: String,
      enum: ['full', 'incremental', 'manual_upload', 'csv_import'],
      required: true,
    },
    
    // User (if applicable)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      sparse: true,
    },
    platformUsername: String,
    
    // Timing
    startTime: {
      type: Date,
      default: Date.now,
      index: true,
    },
    endTime: Date,
    durationMs: Number,
    
    // Results
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'success', 'partial', 'failed'],
      default: 'pending',
      index: true,
    },
    
    // Data counts
    fetchedRecords: {
      type: Number,
      default: 0,
    },
    insertedRecords: {
      type: Number,
      default: 0,
    },
    updatedRecords: {
      type: Number,
      default: 0,
    },
    duplicateRecords: {
      type: Number,
      default: 0,
    },
    failedRecords: {
      type: Number,
      default: 0,
    },
    
    // Deduplication metadata
    deduplicationMethod: String,
    duplicateKeys: [String],
    
    // Error tracking
    errors: [{
      type: String,
      timestamp: Date,
      recordId: String,
      details: mongoose.Schema.Types.Mixed,
    }],
    
    // Recovery info
    retryAttempt: {
      type: Number,
      default: 0,
    },
    lastRetryTime: Date,
    isRetryable: Boolean,
    
    // Quality metrics
    dataQuality: {
      completeness: Number,
      validity: Number,
      consistency: Number,
    },
    
    // Logging
    logs: [{
      timestamp: Date,
      level: String,
      message: String,
    }],
    
    // Source details
    sourceUrl: String,
    sourceHash: String, // for CSV integrity check
    
    // Cursor for incremental syncs
    syncCursor: {
      lastId: String,
      lastTimestamp: Date,
      offset: Number,
    },
    
    // Next sync
    nextSyncScheduled: Date,
    
    metadata: mongoose.Schema.Types.Mixed,
    
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

syncLogSchema.index({ platform: 1, startTime: -1 });
syncLogSchema.index({ userId: 1, platform: 1, startTime: -1 });
syncLogSchema.index({ status: 1, createdAt: -1 });
syncLogSchema.index({ syncBatchId: 1 });

module.exports = mongoose.model('SyncLog', syncLogSchema);

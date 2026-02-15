const mongoose = require('mongoose');

/**
 * Automation Status Schema
 * Tracks the health and state of automation pipelines
 * Used for monitoring and debugging automation workflows
 */
const automationStatusSchema = new mongoose.Schema(
  {
    pipelineType: {
      type: String,
      enum: [
        'submission-intelligence',
        'daily-planner',
        'retention-scheduler',
        'weekly-readiness',
        'compliance-recompute',
      ],
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    
    // Status tracking
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed', 'retry'],
      default: 'pending',
      index: true,
    },
    
    // Execution details
    executionId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    startTime: Date,
    endTime: Date,
    duration: Number, // milliseconds
    
    // Pipeline steps
    steps: [
      {
        name: String,
        status: {
          type: String,
          enum: ['pending', 'running', 'completed', 'failed'],
        },
        startTime: Date,
        endTime: Date,
        result: mongoose.Schema.Types.Mixed,
        error: String,
      },
    ],
    
    // Error handling
    error: String,
    errorCode: String,
    retryCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
      min: 0,
    },
    nextRetryTime: Date,
    
    // ML endpoint calls
    mlEndpointsCalled: [
      {
        endpoint: String,
        method: String,
        statusCode: Number,
        timestamp: Date,
        duration: Number,
      },
    ],
    
    // Database operations
    dbOperations: [
      {
        operation: String,
        collection: String,
        recordsAffected: Number,
        timestamp: Date,
      },
    ],
    
    // Metadata
    queueJobId: String,
    cronJobId: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
automationStatusSchema.index({ pipelineType: 1, createdAt: -1 });
automationStatusSchema.index({ userId: 1, pipelineType: 1, createdAt: -1 });
automationStatusSchema.index({ status: 1, createdAt: -1 });
automationStatusSchema.index({ executionId: 1 });
automationStatusSchema.index({ startTime: -1 });

module.exports = mongoose.model('AutomationStatus', automationStatusSchema);

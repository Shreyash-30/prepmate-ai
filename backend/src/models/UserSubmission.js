const mongoose = require('mongoose');

/**
 * UserSubmission Schema - All practice attempt telemetry
 * Feeds mastery engine, weakness detection, and adaptive planning
 */
const userSubmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
      index: true,
    },
    
    // Platform source
    platform: {
      type: String,
      enum: ['leetcode', 'codeforces', 'hackerrank', 'manual', 'internal'],
      required: true,
      index: true,
    },
    platformSubmissionId: String,
    
    // Submission details
    attempts: {
      type: Number,
      default: 1,
      min: 1,
    },
    isSolved: {
      type: Boolean,
      default: false,
      index: true,
    },
    
    // Telemetry data
    solveTime: {
      type: Number, // seconds
      min: 0,
    },
    codeLength: Number,
    language: String,
    
    // Performance signals
    hintsUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    timeUntilFirstWrong: Number, // seconds
    memoryUsed: Number, // KB
    runtimeMs: Number,
    
    // Submission artifacts
    verdict: {
      type: String,
      enum: ['accepted', 'wrong_answer', 'time_limit', 'memory_limit', 'runtime_error', 'compilation_error', 'partial'],
      index: true,
    },
    submittedCode: String, // hashed or encrypted
    feedback: String,
    
    // Difficulty matching
    relativeDifficulty: {
      type: String,
      enum: ['too_easy', 'appropriate', 'too_hard'],
    },
    
    // Temporal tracking - crucial for retention & spaced rep
    firstAttemptTime: Date,
    lastAttemptTime: {
      type: Date,
      default: Date.now,
      index: true,
    },
    daysSinceLastAttempt: Number,
    
    // Retry behavior (for consistency scoring)
    retriesWithinSession: Number,
    sessionDuration: Number, // minutes
    
    // Topic & skill signals
    topics: [String], // denormalized for performance
    skillsAssessed: [String],
    
    // External sync metadata
    syncedFrom: {
      platform: String,
      timestamp: Date,
      source: {
        type: String,
        enum: ['api', 'csv', 'manual'],
      },
      batchId: String,
    },
    
    // ML pipeline signals
    mlSignals: {
      mastery_input: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MasteryUpdate',
      },
      readiness_feature_included: Boolean,
      weakness_detection_processed: Boolean,
    },
    
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

// Crucial indexes for telemetry pipeline
userSubmissionSchema.index({ userId: 1, problemId: 1 });
userSubmissionSchema.index({ userId: 1, platform: 1, lastAttemptTime: -1 });
userSubmissionSchema.index({ userId: 1, isSolved: 1 });
userSubmissionSchema.index({ userId: 1, topics: 1 });
userSubmissionSchema.index({ platform: 1, 'syncedFrom.timestamp': -1 });
userSubmissionSchema.index({ 'mlSignals.mastery_input': 1 });
userSubmissionSchema.index({ lastAttemptTime: -1 }); // for telemetry aggregation

// Pre-save hook
userSubmissionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.lastAttemptTime && this.firstAttemptTime) {
    const daysDiff = (this.lastAttemptTime - this.firstAttemptTime) / (1000 * 60 * 60 * 24);
    this.daysSinceLastAttempt = Math.round(daysDiff);
  }
  next();
});

module.exports = mongoose.model('UserSubmission', userSubmissionSchema);

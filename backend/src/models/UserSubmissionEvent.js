const mongoose = require('mongoose');

/**
 * UserSubmissionEvent Schema - Append-only telemetry collection
 * Immutable event log for all practice/submission activities
 * Primary source for ML feature engineering and analytics
 * 
 * Design: Write-once, read-many. Never update individual records.
 * Used by: MasteryEngine, WeaknessDetector, RetentionModel, Analytics
 */
const userSubmissionEventSchema = new mongoose.Schema(
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

    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      index: true,
    },

    topicName: {
      type: String,
      index: true,
    },

    // Problem context
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
      index: true,
    },

    platform: {
      type: String,
      enum: ['leetcode', 'codeforces', 'hackerrank', 'geeksforgeeks', 'interviewbit', 'manual', 'internal'],
      index: true,
    },

    platformProblemId: String,

    // Submission result
    result: {
      type: String,
      enum: ['accepted', 'wrong_answer', 'time_limit_exceeded', 'memory_limit_exceeded', 'runtime_error', 'compilation_error', 'partial'],
      required: true,
      index: true,
    },

    isCorrect: {
      type: Boolean,
      required: true,
      index: true,
    },

    // Timing metrics
    timeTaken: {
      type: Number, // seconds
      min: 0,
    },

    timeToFirstSubmission: {
      type: Number, // seconds - from problem view to first submission
      min: 0,
    },

    // Attempt tracking
    attemptNumber: {
      type: Number,
      default: 1,
      min: 1,
    },

    totalAttemptsForProblem: {
      type: Number,
      default: 1,
      min: 1,
    },

    // Hint usage
    hintsUsed: {
      type: Number,
      default: 0,
      min: 0,
    },

    hintCategories: [String], // ['approach', 'edge-case', 'complexity', etc.]

    // Code quality signals
    codeLength: Number,
    programmingLanguage: String,
    runtimeMs: Number,
    memoryUsedKb: Number,

    // Behavioral signals
    retriedSameAttempt: Boolean,
    viewedSolution: Boolean,
    viewedDiscussion: Boolean,
    usedDebugger: Boolean,

    // Session context
    sessionId: String,
    sessionType: {
      type: String,
      enum: ['practice', 'mock-interview', 'revision', 'learning-session'],
      default: 'practice',
    },

    // Difficulty matching
    relativeDifficulty: {
      type: String,
      enum: ['too_easy', 'appropriate', 'too_hard'],
    },

    // Tags & metadata
    requiredConcepts: [String],
    errorType: String,
    mistakeCategory: String,

    // Immutable timestamp (when submitted)
    timestamp: {
      type: Date,
      default: Date.now,
      immutable: true,
      index: true,
    },

    // Batch/sync metadata
    syncSource: {
      platform: String,
      timestamp: Date,
      batchId: String,
    },

    // Deduplication key (prevents duplicate ingestion)
    _deduplicationKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
  },
  {
    timestamps: false, // No auto timestamps on append-only
    collection: 'user_submission_events',
  }
);

// Indexes for efficient querying
userSubmissionEventSchema.index({ userId: 1, timestamp: -1 });
userSubmissionEventSchema.index({ userId: 1, topicId: 1, timestamp: -1 });
userSubmissionEventSchema.index({ userId: 1, isCorrect: 1, timestamp: -1 });
userSubmissionEventSchema.index({ platform: 1, timestamp: -1 });
userSubmissionEventSchema.index({ timestamp: -1 }); // For bulk analytics

// Pre-save hook for deduplication key
userSubmissionEventSchema.pre('save', function(next) {
  if (!this._deduplicationKey && this.userId && this.problemId && this.timestamp) {
    this._deduplicationKey = `${this.userId}-${this.problemId}-${this.timestamp}`;
  }
  next();
});

module.exports = mongoose.model('UserSubmissionEvent', userSubmissionEventSchema);

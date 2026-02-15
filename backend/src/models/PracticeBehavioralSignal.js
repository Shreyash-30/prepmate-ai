const mongoose = require('mongoose');

/**
 * PracticeBehavioralSignal Schema - Fine-grained behavioral analytics
 * Captures detailed problem-solving behavior for learning intelligence
 * Append-only log for AI/ML feature engineering
 * 
 * Used by: BehaviorAnalyzer, LearningStyleDetector, PersonalizationEngine
 */
const practiceBehavioralSignalSchema = new mongoose.Schema(
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

    sessionId: String,

    // Timing signals
    timeToOpenProblem: {
      type: Number, // seconds
      description: 'Time from session start to opening problem',
    },

    timeToFirstAttempt: {
      type: Number, // seconds
      description: 'Time from opening problem to first submission',
    },

    solveTime: {
      type: Number, // seconds
      description: 'Total time to get correct submission',
    },

    timeToViewHint: {
      type: Number, // seconds
      description: 'Time to hint view (if viewed)',
    },

    timeAfterHintToSolve: {
      type: Number, // seconds
      description: 'Time from hint view to correct submission',
    },

    // Giveup signals
    gavepUp: Boolean,

    timeBeforeGiveup: {
      type: Number, // seconds
    },

    reasonForGiveup: {
      type: String,
      enum: ['time-constraint', 'frustration', 'concept-gap', 'technical-issue', 'other'],
    },

    // Attempt behavior
    attemptCount: {
      type: Number,
      default: 1,
      min: 1,
    },

    incorrectAttempts: Number,

    // Inter-attempt timing
    timeBetweenAttempts: [Number], // seconds between consecutive attempts

    averageTimeBetweenAttempts: Number,

    // Hint usage
    hintsUsed: {
      type: Number,
      default: 0,
    },

    hintSequence: [
      {
        hintId: mongoose.Schema.Types.ObjectId,
        hintType: String,
        timeToHint: Number, // seconds from problem open
        usefulness: {
          type: String,
          enum: ['not-useful', 'somewhat-useful', 'very-useful'],
        },
      },
    ],

    // Resource usage
    viewedSolution: Boolean,

    solutionViewTime: Number,

    discussionViewed: Boolean,

    videoDurationWatched: Number,

    // Code patterns
    firstCodeLength: Number,

    finalCodeLength: Number,

    codeChangeCount: Number,

    codeRewriteCount: Number,

    // Error signals
    errorTypes: [
      {
        type: String,
        enum: [
          'wrong_answer',
          'time_limit_exceeded',
          'memory_limit_exceeded',
          'runtime_error',
          'compilation_error',
        ],
      },
    ],

    mistakeCategory: {
      type: String,
      enum: [
        'logic-error',
        'off-by-one',
        'edge-case-miss',
        'inefficient-algorithm',
        'data-structure-misuse',
        'careless-mistake',
        'syntax-error',
      ],
    },

    // Recovery signals
    correctAfterWrongAttempt: Boolean,

    timeToRecoveryFromWrongAttempt: Number,

    improvementAfterHint: Boolean,

    hintEffectiveness: {
      type: Number,
      min: 0,
      max: 1,
      description: 'Measure of how much hint helped (time saved)',
    },

    // Strategy signals
    strategyChangeCount: Number,

    strategyChanges: [
      {
        attemptNumber: Number,
        newStrategy: String,
        reason: String,
      },
    ],

    algorithmUsed: String,

    dataStructuresUsed: [String],

    // Learning patterns
    repeatVisitToSameProblem: Boolean,

    daysSincePreviousAttempt: Number,

    // Solution quality
    explanationQualityScore: {
      type: Number,
      min: 0,
      max: 100,
      description: 'How well user explained their solution',
    },

    codeCleanlinessScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    // Confidence signals
    selfReportedConfidence: {
      type: Number,
      min: 1,
      max: 5,
      description: 'User-reported confidence (if captured)',
    },

    // Difficulty assessment
    userReportedDifficulty: {
      type: String,
      enum: ['too_easy', 'appropriate', 'too_hard'],
    },

    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
    },

    // Environmental factors
    environmentType: {
      type: String,
      enum: ['focused-session', 'multitasking', 'rushed', 'leisurely'],
    },

    deviceUsed: {
      type: String,
      enum: ['desktop', 'laptop', 'tablet', 'mobile'],
    },

    // Result
    result: {
      type: String,
      enum: ['correct', 'incorrect', 'partial', 'timeout', 'abandoned'],
      required: true,
      index: true,
    },

    correctOnFirstAttempt: Boolean,

    // Motivation indicators
    problemRelevance: {
      type: String,
      enum: ['low', 'medium', 'high'],
      description: 'Perceived relevance to goals',
    },

    // Timestamp (immutable, append-only)
    recordedAt: {
      type: Date,
      default: Date.now,
      immutable: true,
      index: true,
    },

    _deduplicationKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
  },
  {
    timestamps: false,
    collection: 'practice_behavioral_signals',
  }
);

// Indexes
practiceBehavioralSignalSchema.index({ userId: 1, recordedAt: -1 });
practiceBehavioralSignalSchema.index({ userId: 1, topicId: 1, result: 1 });
practiceBehavioralSignalSchema.index({ recordedAt: -1 });

// Pre-save hook
practiceBehavioralSignalSchema.pre('save', function(next) {
  if (!this._deduplicationKey && this.userId && this.problemId && this.recordedAt) {
    this._deduplicationKey = `${this.userId}-${this.problemId}-${this.recordedAt}`;
  }
  next();
});

module.exports = mongoose.model('PracticeBehavioralSignal', practiceBehavioralSignalSchema);

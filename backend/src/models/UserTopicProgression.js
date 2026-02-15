const mongoose = require('mongoose');

/**
 * UserTopicProgression Schema - Topic mastery state machine
 * Tracks user's progression through difficulty levels for each topic
 * Determines next difficulty level recommendations
 * 
 * Used by: ProgressionEngine, AdaptiveRecommender, DashboardController
 */
const userTopicProgressionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      required: true,
      index: true,
    },

    topicName: String,

    // Current difficulty level
    currentDifficultyLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
      required: true,
      index: true,
    },

    levelEnteredAt: Date,

    timeSpentOnLevel: {
      type: Number, // minutes
      default: 0,
    },

    // Progression readiness
    progressionReadinessScore: {
      type: Number,
      min: 0,
      max: 100,
      description: 'Score indicating readiness to progress to next level',
      index: true,
    },

    readinessComponents: {
      masteryThreshold: Number, // 0-100
      consistencyThreshold: Number, // 0-100
      fluencyThreshold: Number, // 0-100
      speedThreshold: Number, // 0-100
    },

    // Next level recommendation
    recommendedNextDifficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'maintain'],
      default: 'maintain',
    },

    recommendedNextDifficultyAt: Date,

    recommendedNextDifficultyReason: String,

    // Progression decision source
    progressionDecisionSource: {
      type: String,
      enum: [
        'mastery-engine',
        'consistency-check',
        'user-request',
        'time-based',
        'manual-decision',
      ],
      required: true,
    },

    // Progression history
    progressionHistory: [
      {
        fromLevel: String,
        toLevel: String,
        decidedAt: Date,
        reason: String,
        currentMasteryAtProgression: Number,
      },
    ],

    // Regression tracking
    regressionEvents: [
      {
        fromLevel: String,
        toLevel: String,
        regressionDate: Date,
        reason: String,
      },
    ],

    lastRegressionAt: Date,

    // Performance at current level
    performanceMetrics: {
      totalProblemsAttempted: Number,
      problemsSolvedCorrectly: Number,
      successRate: Number,
      firstAttemptSuccessRate: Number,
      averageSolveTime: Number, // seconds
      consistency: Number, // 0-1
    },

    // Difficulty-specific mastery
    masteryAtCurrentLevel: {
      type: Number,
      min: 0,
      max: 1,
    },

    masteryAtPreviousLevel: {
      type: Number,
      min: 0,
      max: 1,
    },

    // Edge case handling
    edgeCasesCovered: {
      type: Number,
      min: 0,
      max: 100,
      description: 'Percentage of edge cases covered in solutions',
    },

    // Algorithm efficiency
    algorithmEfficiency: {
      type: Number,
      min: 0,
      max: 100,
      description: 'Optimal algorithm choice percentage',
    },

    // Code quality
    codeQuality: {
      type: Number,
      min: 0,
      max: 100,
    },

    // Problem variety coverage
    diverseProblemsAttempted: Boolean,

    problemVarietyScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    // Time management at level
    timeManagementScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    frequentlyExceedsTimeLimit: Boolean,

    // Readiness for next level
    readyForNextLevel: {
      type: Boolean,
      default: false,
    },

    reasonNotReady: [String],

    // Maintenance mode
    maintenanceMode: {
      type: Boolean,
      default: false,
      description: 'Whether user is maintaining current level vs progressing',
    },

    maintenanceDays: {
      type: Number,
      description: 'How long in maintenance mode',
    },

    // Bottlenecks
    identifiedBottlenecks: [String],

    bottleneckResolutionStrategies: [String],

    // Confidence check
    lastProgressionCheck: {
      type: Date,
      index: true,
    },

    nextProgressionCheckDue: Date,

    // Adaptive recommendations
    adaptiveStrategy: {
      type: String,
      enum: [
        'accelerated-progression',
        'standard-progression',
        'targeted-practice',
        'maintenance',
        'regression-recovery',
      ],
      default: 'standard-progression',
    },

    strategyReason: String,

    // Learning insights
    learningPaceAssessment: {
      type: String,
      enum: ['fast', 'optimal', 'slow'],
    },

    learningStyle: {
      type: String,
      enum: [
        'problem-first',
        'concept-first',
        'mixed',
      ],
    },

    // Next milestone
    nextMilestone: {
      name: String,
      description: String,
      targetDate: Date,
    },

    // Metadata
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
    timestamps: true,
    collection: 'user_topic_progression',
  }
);

// Indexes
userTopicProgressionSchema.index({ userId: 1, topicId: 1 }, { unique: true });
userTopicProgressionSchema.index({ userId: 1, currentDifficultyLevel: 1 });
userTopicProgressionSchema.index({ userId: 1, readyForNextLevel: 1 });
userTopicProgressionSchema.index({ userId: 1, lastProgressionCheck: 1 });
userTopicProgressionSchema.index({ nextProgressionCheckDue: 1 });

module.exports = mongoose.model('UserTopicProgression', userTopicProgressionSchema);

const mongoose = require('mongoose');

/**
 * UserTopicMastery Schema - Core Intelligence Collection
 * Normalized single source of truth for topic mastery progression
 * Consolidates: MasteryMetric + UserTopicStats mastery fields
 * 
 * Updated by: MasteryEngine (BKT algorithm)
 * Used by: DashboardController, RecommendationEngine, RevisionScheduler
 */
const userTopicMasterySchema = new mongoose.Schema(
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
    topicName: {
      type: String,
      required: true,
      index: false,
    },

    // Core mastery scoring (Bayesian Knowledge Tracing)
    masteryScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
      description: 'BKT probability of mastery (0-1)',
      index: true,
    },

    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      description: 'Confidence in mastery assessment (based on attempts)',
    },

    readinessScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      description: 'Interview readiness for this topic',
      index: true,
    },

    // Difficulty & progression tracking
    currentDifficultyLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },

    recommendedDifficultyLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },

    // Retention & spaced repetition
    retentionStrength: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
      description: 'Ebbinghaus retention decay model strength',
    },

    daysSinceLastReview: {
      type: Number,
      default: 0,
    },

    // Performance metrics
    totalProblemsAttempted: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalProblemsCorrect: {
      type: Number,
      default: 0,
      min: 0,
    },

    successRate: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },

    firstAttemptSuccessRate: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },

    averageSolveTimeSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Improvement indicators
    improvementTrend: {
      type: String,
      enum: ['improving', 'stable', 'declining', 'insufficient-data'],
      default: 'insufficient-data',
      index: true,
    },

    recentPerformanceWindow: [
      {
        attemptId: mongoose.Schema.Types.ObjectId,
        correct: Boolean,
        timestamp: Date,
        difficulty: String,
        timeTaken: Number,
      },
    ],

    // Temporal tracking
    firstPracticedAt: {
      type: Date,
      default: null,
    },

    lastPracticedAt: {
      type: Date,
      default: null,
      index: true,
    },

    // Consistency scoring (prevents luck)
    consistencyScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
      description: 'Consistency of performance (low variance = high score)',
    },

    // AI signals
    estimatedReadyDate: {
      type: Date,
      default: null,
    },

    readinessConfidenceInterval: {
      lower: Number,
      upper: Number,
    },

    // Metadata
    learningPath: {
      type: String,
      enum: ['self-paced', 'structured', 'assisted'],
      default: 'self-paced',
    },

    lastUpdatedBy: {
      type: String,
      enum: ['bkt-engine', 'user-submission', 'manual', 'migration'],
      default: 'user-submission',
    },

    updatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'user_topic_mastery',
  }
);

// Composite index for common queries
userTopicMasterySchema.index({ userId: 1, topicId: 1 }, { unique: true });
userTopicMasterySchema.index({ userId: 1, readinessScore: -1 });
userTopicMasterySchema.index({ userId: 1, masteryScore: -1 });
userTopicMasterySchema.index({ userId: 1, improvementTrend: 1 });
userTopicMasterySchema.index({ userId: 1, lastPracticedAt: -1 });

module.exports = mongoose.model('UserTopicMastery', userTopicMasterySchema);

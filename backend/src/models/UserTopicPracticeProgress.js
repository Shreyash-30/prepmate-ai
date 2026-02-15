const mongoose = require('mongoose');

/**
 * UserTopicPracticeProgress Schema - Topic practice state machine
 * Tracks user progression through structured practice levels
 * Integrates with adaptive recommendation engine
 * 
 * Used by: PracticeRecommender, ProgressionEngine, DashboardController
 */
const userTopicPracticeProgressSchema = new mongoose.Schema(
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

    // Current level in structured practice
    currentLevel: {
      type: Number,
      min: 1,
      max: 5,
      description: '1=beginner, 5=expert',
      default: 1,
      index: true,
    },

    // Level progression metadata
    levelStartedAt: Date,

    levelCompletedAt: Date,

    timeSpentOnLevel: {
      type: Number, // minutes
      default: 0,
    },

    // Recommended problem set state
    recommendedSetId: mongoose.Schema.Types.ObjectId,

    recommendedSetCompleted: {
      type: Boolean,
      default: false,
    },

    recommendedProblems: [
      {
        problemId: mongoose.Schema.Types.ObjectId,
        order: Number,
        completed: Boolean,
        correctOnFirstAttempt: Boolean,
        timeToFirstCorrect: Number, // seconds
        attempts: Number,
      },
    ],

    recommendedSetAccuracy: {
      type: Number,
      min: 0,
      max: 1,
      description: 'Accuracy on recommended problem set',
    },

    // Validation problem (to assess level mastery)
    validationProblemId: mongoose.Schema.Types.ObjectId,

    validationProblemAttempted: Boolean,

    validationProblemResult: {
      type: String,
      enum: ['not-attempted', 'incorrect', 'correct', 'correct-first-try'],
    },

    validationAttemptCount: Number,

    validationPassedAt: Date,

    // Next level eligibility
    nextLevelRecommended: {
      type: Boolean,
      default: false,
    },

    nextLevelRecommendedAt: Date,

    nextLevelReason: String,

    // Skill gaps
    skillGapsIdentified: [String],

    skillGapResources: [
      {
        skillName: String,
        resourceId: mongoose.Schema.Types.ObjectId,
        resourceType: String, // 'video', 'article', 'practice'
      },
    ],

    // Time management insights
    averageTimePerProblem: Number,

    optimalTimePerProblem: Number,

    // Behavior tracking
    consistencyMetric: {
      type: Number,
      min: 0,
      max: 1,
      description: 'Consistency of practice sessions',
    },

    lastPracticeAt: {
      type: Date,
      index: true,
    },

    daysSinceLastPractice: Number,

    // Practice recommendations feedback
    practiceRecommendationFeedback: [
      {
        recommendationId: mongoose.Schema.Types.ObjectId,
        wasSuitable: Boolean,
        userRating: Number,
        feedback: String,
      },
    ],

    // Status & progress
    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'level-complete', 'mastered', 'paused', 'archived'],
      default: 'not-started',
      index: true,
    },

    progressPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // Overall topic readiness contribution
    contributionToTopicReadiness: {
      type: Number,
      min: 0,
      max: 1,
      description: 'How much this practice contributes to topic readiness',
    },

    updatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'user_topic_practice_progress',
  }
);

// Indexes
userTopicPracticeProgressSchema.index({ userId: 1, topicId: 1 }, { unique: true });
userTopicPracticeProgressSchema.index({ userId: 1, status: 1 });
userTopicPracticeProgressSchema.index({ userId: 1, currentLevel: 1 });
userTopicPracticeProgressSchema.index({ userId: 1, lastPracticeAt: -1 });

module.exports = mongoose.model('UserTopicPracticeProgress', userTopicPracticeProgressSchema);

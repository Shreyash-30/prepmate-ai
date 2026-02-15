const mongoose = require('mongoose');

/**
 * UserDashboardSnapshot Schema - Denormalized read model for dashboard
 * Performance-critical: pre-computed view to avoid expensive aggregations
 * 
 * Refreshed asynchronously after:
 * - Intelligence pipeline runs
 * - Task generation completes
 * - Revision updates occur
 * - Practice sessions complete
 * 
 * Dashboard API reads ONLY from this snapshot for <100ms response times
 * 
 * Used by: DashboardController, AnalyticsController
 */
const userDashboardSnapshotSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    // Core metrics
    totalSolved: {
      type: Number,
      default: 0,
      index: true,
    },

    totalAttempted: {
      type: Number,
      default: 0,
    },

    solveRate: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },

    // Mastery distribution across topics
    masteryDistribution: {
      excellent: {
        type: Number,
        min: 0,
        max: 1,
        default: 0,
        description: 'Mastery >= 0.8',
      },
      good: {
        type: Number,
        min: 0,
        max: 1,
        default: 0,
        description: 'Mastery 0.6-0.8',
      },
      moderate: {
        type: Number,
        min: 0,
        max: 1,
        default: 0,
        description: 'Mastery 0.4-0.6',
      },
      weak: {
        type: Number,
        min: 0,
        max: 1,
        default: 0,
        description: 'Mastery < 0.4',
      },
    },

    // Topic-specific insights (top 5 weak topics)
    weakTopics: [
      {
        topicId: mongoose.Schema.Types.ObjectId,
        topicName: String,
        masteryScore: Number,
        signalCount: Number,
        recommendedAction: String,
        priority: {
          type: String,
          enum: ['critical', 'high', 'medium', 'low'],
        },
      },
    ],

    // Topic-specific insights (top 5 strong topics)
    strongTopics: [
      {
        topicId: mongoose.Schema.Types.ObjectId,
        topicName: String,
        masteryScore: Number,
      },
    ],

    // Overall readiness
    readinessScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
      index: true,
    },

    readinessLevel: {
      type: String,
      enum: ['not-ready', 'early-stage', 'progressing', 'mostly-ready', 'interview-ready'],
      default: 'not-ready',
      index: true,
    },

    readinessPercentile: {
      type: Number,
      min: 0,
      max: 100,
    },

    // Consistency metrics
    consistencyScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },

    practiceFrequency: {
      type: String,
      enum: ['very-low', 'low', 'moderate', 'high', 'very-high'],
    },

    daysSinceLastPractice: Number,

    averagePracticeSessionDuration: Number, // minutes

    practiceStreakDays: {
      type: Number,
      default: 0,
    },

    // Active recommendations
    activeTasks: {
      type: Number,
      default: 0,
    },

    activeTasksByType: {
      practice: Number,
      revision: Number,
      reinforcement: Number,
      interview: Number,
    },

    revisionTasks: {
      type: Number,
      default: 0,
    },

    overdueRevisions: {
      type: Number,
      default: 0,
    },

    // Practice level insights
    currentPracticeLevels: [
      {
        topicId: mongoose.Schema.Types.ObjectId,
        topicName: String,
        currentLevel: Number,
        nextLevelProgress: Number, // 0-1
      },
    ],

    // Interview readiness breakdown
    interviewReadiness: {
      codingScore: {
        type: Number,
        min: 0,
        max: 1,
      },
      communicationScore: {
        type: Number,
        min: 0,
        max: 1,
      },
      timeManagementScore: {
        type: Number,
        min: 0,
        max: 1,
      },
      pressureResistanceScore: {
        type: Number,
        min: 0,
        max: 1,
      },
      totalMockInterviews: {
        type: Number,
        default: 0,
      },
      averagePerformanceScore: {
        type: Number,
        min: 0,
        max: 1,
      },
    },

    // Dashboard state
    learnerPhase: {
      type: String,
      enum: ['onboarding', 'foundation-building', 'topic-deep-dive', 'interview-prep', 'interview-ready'],
      default: 'onboarding',
    },

    recommendedNextAction: {
      type: String,
      description: 'LLM-generated recommended next step for learner',
    },

    // Metadata
    lastUpdated: {
      type: Date,
      default: Date.now,
      index: true,
    },

    refreshedAt: Date,

    refreshReason: {
      type: String,
      enum: ['pipeline-complete', 'task-generation', 'revision-update', 'practice-complete', 'manual-refresh'],
    },

    dataFreshness: {
      type: String,
      enum: ['fresh', 'stale', 'very-stale'],
      description: 'Indicator of how recent the data is',
    },
  },
  {
    timestamps: true,
    collection: 'user_dashboard_snapshot',
  }
);

// Compound indexes for common queries
userDashboardSnapshotSchema.index({ userId: 1, readinessScore: -1 });
userDashboardSnapshotSchema.index({ userId: 1, consistencyScore: -1 });
userDashboardSnapshotSchema.index({ lastUpdated: -1 });
userDashboardSnapshotSchema.index({ readinessLevel: 1, lastUpdated: -1 });

module.exports = mongoose.model('UserDashboardSnapshot', userDashboardSnapshotSchema);

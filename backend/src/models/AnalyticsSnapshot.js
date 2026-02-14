const mongoose = require('mongoose');

const analyticsSnapshotSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    snapshotDate: {
      type: Date,
      default: () => new Date(),
      index: true,
    },
    masteryDistribution: {
      easy: {
        percentage: Number,
        count: Number,
      },
      medium: {
        percentage: Number,
        count: Number,
      },
      hard: {
        percentage: Number,
        count: Number,
      },
    },
    topicWiseMastery: {
      type: Map,
      of: Number,
    },
    consistencyScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    consistencyTrend: {
      type: String,
      enum: ['improving', 'stable', 'declining'],
    },
    preparationVelocity: {
      problemsSolvedThisWeek: Number,
      problemsSolvedThisMonth: Number,
      problemsSolvedTotal: Number,
      averageProblemsPerDay: Number,
    },
    weakTopicCount: {
      type: Number,
      default: 0,
    },
    weakTopics: [
      {
        topicId: mongoose.Schema.Types.ObjectId,
        topicName: String,
        riskScore: Number,
      },
    ],
    strongTopics: [
      {
        topicId: mongoose.Schema.Types.ObjectId,
        topicName: String,
        masteryScore: Number,
      },
    ],
    studyPatterns: {
      peakStudyHour: Number,
      averageSessionDuration: Number,
      studyDaysThisMonth: Number,
      consecutiveStudyDays: Number,
    },
    performanceMetrics: {
      overallAccuracy: Number,
      averageTimePerProblem: Number,
      hintsUsedPercentage: Number,
      firstAttemptSuccessRate: Number,
    },
    readinessSnapshot: {
      currentScore: Number,
      trendDirection: String,
      estimatedReadyDate: Date,
    },
    practiceQuality: {
      avgExplanationScore: Number,
      avgCodeQuality: Number,
      avgTimeManagement: Number,
    },
    comparisonMetrics: {
      percentileRank: Number,
      comparisonCohort: String,
      trendVsLastMonth: String,
    },
  },
  {
    timestamps: true,
  }
);

analyticsSnapshotSchema.index({ userId: 1, snapshotDate: -1 });
analyticsSnapshotSchema.index({ snapshotDate: -1 });
analyticsSnapshotSchema.index({ 'readinessSnapshot.currentScore': -1 });

module.exports = mongoose.model('AnalyticsSnapshot', analyticsSnapshotSchema);

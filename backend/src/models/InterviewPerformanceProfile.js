const mongoose = require('mongoose');

/**
 * InterviewPerformanceProfile Schema - Aggregated interview performance
 * High-level summary of interview performance across all mock sessions
 * Consolidated view for interview readiness assessment
 * 
 * Used by: InterviewReadinessCalculator, DashboardController
 */
const interviewPerformanceProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    // Session counting
    mockInterviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastInterviewDate: {
      type: Date,
      index: true,
    },

    daysSinceLastInterview: Number,

    // Scoring aggregates
    avgCodingScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    avgReasoningScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    avgCommunicationScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    avgPressurePerformanceScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    avgTimeManagementScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    avgOverallScore: {
      type: Number,
      min: 0,
      max: 100,
      index: true,
    },

    // Performance distribution
    performanceLevelDistribution: {
      needsImprovement: Number,
      average: Number,
      good: Number,
      excellent: Number,
    },

    // Trending & consistency
    performanceTrend: {
      type: String,
      enum: ['improving', 'stable', 'declining'],
    },

    scoreConsistency: {
      type: Number,
      min: 0,
      max: 1,
      description: 'Low variance = high consistency',
    },

    // Scoring timeline
    scoringTimeline: [
      {
        sessionDate: Date,
        score: Number,
      },
    ],

    // Strengths & weaknesses
    topStrengths: [
      {
        category: String, // 'coding', 'reasoning', 'communication'
        score: Number,
      },
    ],

    topWeaknesses: [
      {
        category: String,
        score: Number,
        improvementPriority: Number,
      },
    ],

    // Domain-specific performance
    performanceByDomain: {
      dsa: {
        avgScore: Number,
        sessionCount: Number,
      },
      systemDesign: {
        avgScore: Number,
        sessionCount: Number,
      },
      behavioral: {
        avgScore: Number,
        sessionCount: Number,
      },
    },

    // Company-specific performance
    performanceByCompany: {
      type: Map,
      of: {
        avgScore: Number,
        sessionCount: Number,
        successRate: Number,
      },
    },

    // Problem type performance
    problemDifficultyPerformance: {
      easy: {
        avgScore: Number,
        successRate: Number,
      },
      medium: {
        avgScore: Number,
        successRate: Number,
      },
      hard: {
        avgScore: Number,
        successRate: Number,
      },
    },

    // Problem-solving metrics
    avgProblemsCorrect: Number,

    avgProblemsAttempted: Number,

    averageSuccessRate: {
      type: Number,
      min: 0,
      max: 1,
    },

    // Communication analysis
    communicationImprovement: Number,

    averageFillerWordDensity: Number,

    averageWordsPerMinute: Number,

    communicationConsistency: {
      type: Number,
      min: 0,
      max: 1,
    },

    // Time management
    averageTimePerProblem: Number,

    timeManagementTrend: {
      type: String,
      enum: ['improving', 'stable', 'declining'],
    },

    frequentlyTimeouts: Boolean,

    // Stress indicators
    pressurePerformanceVariance: Number,

    performanceDropUnderPressure: Boolean,

    pressureRecoveryScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    // Interview readiness factors
    isReadyForInterview: Boolean,

    interviewReadinessPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      index: true,
    },

    readinessComponents: {
      technicalSkills: Number,
      problemSolving: Number,
      communication: Number,
      timeManagement: Number,
      stressManagement: Number,
    },

    readinessGaps: [String],

    readinessRecommendations: [String],

    // Personality assessment
    interviewPersonality: {
      type: String,
      enum: ['nervous', 'confident', 'mixed', 'overconfident'],
    },

    personalityInsights: [String],

    // Feedback & insights
    llmGeneratedInsights: String,

    improvementAreas: [String],

    strengthsToLeverag: [String],

    // Comparison benchmarks
    userBenchmarkPercentile: {
      type: Number,
      min: 0,
      max: 100,
      description: 'How user ranks vs other users',
    },

    // Goal tracking
    interviewGoalScore: Number,

    goalAchievementPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },

    // Milestones
    milestones: [
      {
        name: String,
        achievedAt: Date,
        score: Number,
      },
    ],

    // Next interview prediction
    predictedNextInterviewScore: Number,

    recommendedPracticeAreas: [String],

    // Metadata
    profileLastCalculatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    nextCalculationDueAt: Date,

    updatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'interview_performance_profile',
  }
);

// Indexes
interviewPerformanceProfileSchema.index({ userId: 1 });
interviewPerformanceProfileSchema.index({ avgOverallScore: -1 });
interviewPerformanceProfileSchema.index({ isReadyForInterview: 1 });
interviewPerformanceProfileSchema.index({ profileLastCalculatedAt: -1 });

module.exports = mongoose.model('InterviewPerformanceProfile', interviewPerformanceProfileSchema);

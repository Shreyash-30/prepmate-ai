const mongoose = require('mongoose');

/**
 * RevisionRecommendationTask Schema - Spaced repetition scheduling
 * AI-generated revision planning based on mastery and retention curves
 * Consolidates: RevisionSchedule + intelligent planning
 * 
 * Used by: RevisionScheduler, DashboardController, AutomationEngine
 */
const revisionRecommendationTaskSchema = new mongoose.Schema(
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

    // Revision scheduling
    originalLearningDate: {
      type: Date,
      description: 'When topic was first learned/attempted',
    },

    lastRevisionDate: Date,

    nextScheduledRevisionDate: {
      type: Date,
      required: true,
      index: true,
    },

    revisionsPending: {
      type: Number,
      default: 1,
      min: 0,
    },

    revisionHistory: [
      {
        revisionDate: Date,
        performanceScore: Number,
        timeSpent: Number,
        masteryAfterRevision: Number,
      },
    ],

    // Spaced repetition algorithm state
    spacedRepetitionPhase: {
      type: Number,
      min: 1,
      max: 7,
      default: 1,
      description: 'Ebbinghaus phases: 1=1day, 2=3day, 3=7day, 4=14day, 5=30day, 6=60day, 7=maxified',
    },

    optimalRevisionIntervalDays: {
      type: Number,
      default: 1,
      min: 1,
    },

    // Revision priority & signals
    revisionPriority: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
      required: true,
      index: true,
      description: '1=urgent (critical), 5=low (just reinforcement)',
    },

    priorityReason: {
      type: String,
      enum: [
        'retention-decay-critical',
        'weak-signal-detected',
        'low-accuracy-pattern',
        'time-limit-issues',
        'careless-mistakes',
        'routine-reinforcement',
        'upcoming-interview',
        'strength-consolidation',
      ],
    },

    // Problems to revise
    problemsToRevise: [
      {
        problemId: mongoose.Schema.Types.ObjectId,
        reason: String, // 'failed-recently', 'high-decay', 'edge-case-missed'
        difficulty: {
          type: String,
          enum: ['easy', 'medium', 'hard'],
        },
        lastAttempted: Date,
        previousAttempts: Number,
      },
    ],

    totalProblemsToRevise: Number,

    // Reinforcement problems (similar but different)
    reinforcementProblems: [
      {
        problemId: mongoose.Schema.Types.ObjectId,
        similarity: {
          type: Number,
          min: 0,
          max: 1,
          description: 'Similarity to previously solved problems',
        },
        difficulty: {
          type: String,
          enum: ['easy', 'medium', 'hard'],
        },
        reason: String, // 'edge-case-reinforcement', 'technique-application'
      },
    ],

    // Validation problem (to verify learning)
    validationProblemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
    },

    validationProblemDifficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
    },

    validationAttempted: Boolean,

    validationResult: {
      type: String,
      enum: ['not-assessed', 'incorrect', 'correct-with-hints', 'correct'],
    },

    validationPassedAt: Date,

    // AI-generated insights
    llmRevisionSummary: {
      type: String,
      description: 'LLM-generated explanation of why this revision is important',
    },

    keyConceptsToFocus: [String],

    commonMistakesWarning: [String],

    // Time estimation
    estimatedRevisionTimeMinutes: {
      type: Number,
      min: 5,
      max: 240,
    },

    expectedCompletionTime: Number,

    // Reason for recommendation
    reasonForRecommendation: {
      type: String,
      description: 'Human-readable reason for this recommendation',
    },

    // Status tracking
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'overdue', 'postponed', 'cancelled'],
      default: 'pending',
      index: true,
    },

    startedAt: Date,

    completedAt: Date,

    actualTimeSpent: {
      type: Number, // minutes
      default: 0,
    },

    userCompletionRating: {
      type: Number,
      min: 1,
      max: 5,
    },

    userFeedback: String,

    // Mastery update post-revision
    masteryBeforeRevision: Number,

    masteryAfterRevision: Number,

    masteryImprovement: Number,

    // Reinforcement strength
    reinforcementStrength: {
      type: Number,
      min: 0,
      max: 1,
      description: 'How much stronger memory became after this revision',
    },

    stabilityScore: {
      type: Number,
      min: 0,
      max: 100,
      description: 'Stability of knowledge after revision',
    },

    // Retention prediction
    expectedRetentionDays: {
      type: Number,
      description: 'How long knowledge is expected to be retained',
    },

    nextRecommendedRevisionDate: Date,

    // Consistency check
    consistentWithPreviousRevisions: Boolean,

    // Created
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
    collection: 'revision_recommendation_tasks',
  }
);

// Indexes
revisionRecommendationTaskSchema.index({ userId: 1, nextScheduledRevisionDate: 1 });
revisionRecommendationTaskSchema.index({ userId: 1, revisionPriority: -1 });
revisionRecommendationTaskSchema.index({ userId: 1, status: 1 });
revisionRecommendationTaskSchema.index({ nextScheduledRevisionDate: 1 }); // For scheduling
revisionRecommendationTaskSchema.index({ userId: 1, topicId: 1 });

module.exports = mongoose.model('RevisionRecommendationTask', revisionRecommendationTaskSchema);

const mongoose = require('mongoose');

/**
 * MockInterviewSession Schema - Interview performance tracking
 * Comprehensive recording of mock interview attempts and scoring
 * 
 * Used by: InterviewAnalyzer, PerformanceTracker, MockInterviewController
 */
const mockInterviewSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    sessionId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },

    sessionName: String,

    // Interview metadata
    interviewType: {
      type: String,
      enum: ['technical', 'behavioral', 'system-design', 'mixed'],
      default: 'technical',
    },

    targetCompany: String,

    targetRole: String,

    duration: {
      type: Number, // minutes
      default: 45,
    },

    // Time tracking
    startTime: {
      type: Date,
      required: true,
      index: true,
    },

    endTime: Date,

    actualDurationMinutes: Number,

    // Questions
    questionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
      },
    ],

    questionTopics: [String],

    questionDifficulties: {
      easy: Number,
      medium: Number,
      hard: Number,
    },

    // Scoring components
    codingScore: {
      type: Number,
      min: 0,
      max: 100,
      description: 'Correctness and code quality',
    },

    reasoningScore: {
      type: Number,
      min: 0,
      max: 100,
      description: 'Approach and algorithm analysis',
    },

    communicationScore: {
      type: Number,
      min: 0,
      max: 100,
      description: 'Communication clarity and structure',
    },

    pressurePerformanceScore: {
      type: Number,
      min: 0,
      max: 100,
      description: 'Performance under time pressure',
    },

    timeManagementScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    // Overall scores
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      index: true,
    },

    performanceLevel: {
      type: String,
      enum: ['needs-improvement', 'average', 'good', 'excellent'],
      index: true,
    },

    // Problem-level performance
    problemPerformance: [
      {
        problemId: mongoose.Schema.Types.ObjectId,
        correct: Boolean,
        timeTaken: Number,
        attempts: Number,
        score: Number,
        codingQuality: Number,
        approachCorrect: Boolean,
        edgeCasesCovered: Boolean,
      },
    ],

    // Audio/transcript data (if available)
    hasAudioRecording: Boolean,

    audioTranscript: String,

    // Voice analysis signals
    voiceSignals: {
      clarityScore: Number,
      confidenceIntonation: Number,
      filler_word_count: Number,
      paceWordsPerMinute: Number,
    },

    // Behavioral signals
    behavioralSignals: {
      askedClarificingQuestions: Boolean,
      discussedTradeoffs: Boolean,
      mentionedComplexity: Boolean,
      consideredEdgeCases: Boolean,
      explainedApproach: Boolean,
      askedForFeedback: Boolean,
    },

    // Strengths & weaknesses
    strengths: [String],

    weaknessesIdentified: [String],

    recommendedFocusAreas: [String],

    // AI-generated report
    reportSummary: String,

    detailedFeedback: String,

    // Interview readiness contribution
    interviewReadinessContribution: {
      type: Number,
      min: 0,
      max: 1,
      description: 'How much this session improves interview readiness',
    },

    // Next steps
    recommendedNextSteps: [String],

    followUpTopicsToStudy: [String],

    // Comparison to past sessions
    comparisonToPreviousAttempt: {
      previousSessionId: mongoose.Schema.Types.ObjectId,
      scoreImprovement: Number,
      improvements: [String],
      regressions: [String],
    },

    // Interview pattern
    isPractice: {
      type: Boolean,
      default: true,
    },

    interviewDate: Date,

    actualResult: {
      type: String,
      enum: ['not-yet', 'passed', 'rejected', 'pending'],
      default: 'not-yet',
    },

    // Rating by user
    userSelfRating: {
      type: Number,
      min: 1,
      max: 5,
    },

    userFeedback: String,

    // Created
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'mock_interview_sessions',
  }
);

// Indexes
mockInterviewSessionSchema.index({ userId: 1, startTime: -1 });
mockInterviewSessionSchema.index({ userId: 1, overallScore: -1 });
mockInterviewSessionSchema.index({ targetCompany: 1 });
mockInterviewSessionSchema.index({ startTime: -1 });

module.exports = mongoose.model('MockInterviewSession', mockInterviewSessionSchema);

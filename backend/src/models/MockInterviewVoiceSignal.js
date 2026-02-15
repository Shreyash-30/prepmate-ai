const mongoose = require('mongoose');

/**
 * MockInterviewVoiceSignal Schema - Voice/communication analysis
 * Fine-grained signals from voice & communication during mock interviews
 * Used for: Communication skill assessment, interview readiness
 * 
 * Used by: VoiceAnalyzer, CommunicationIntelligence
 */
const mockInterviewVoiceSignalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    sessionId: {
      type: String,
      required: true,
      index: true,
    },

    mockInterviewSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MockInterviewSession',
      index: true,
    },

    // Communication clarity
    explanationClarityScore: {
      type: Number,
      min: 0,
      max: 100,
      description: 'How clearly user explained their approach',
    },

    explanationStructured: {
      type: Boolean,
      description: 'Whether explanation followed logical structure',
    },

    // Reasoning quality
    reasoningAccuracyScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    reasoningCompletenesScore: {
      type: Number,
      min: 0,
      max: 100,
      description: 'Considered all aspects of problem',
    },

    // Communication structure
    communicationStructureScore: {
      type: Number,
      min: 0,
      max: 100,
      description: 'Organization and flow of communication',
    },

    // Confidence signals
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    hesitationCount: Number,

    hesitationPercentage: {
      type: Number,
      min: 0,
      max: 100,
      description: 'Percentage of time with hesitation',
    },

    // Filler words
    fillerWordDensity: {
      type: Number,
      min: 0,
      max: 1,
      description: 'Ratio of filler words to total words',
    },

    fillerWordsUsed: [
      {
        word: String,
        count: Number,
      },
    ],

    // Speech pace
    averageWordsPerMinute: Number,

    paceConsistency: {
      type: Number,
      min: 0,
      max: 1,
      description: 'Consistency of speech pace',
    },

    paceAppropriate: Boolean,

    // Technical vocabulary
    technicalVocabularyUsage: {
      type: Number,
      min: 0,
      max: 100,
      description: 'Appropriate use of technical terms',
    },

    technicalTermsUsed: [String],

    // Engagement signals
    followUpQuestionSuccessRate: {
      type: Number,
      min: 0,
      max: 1,
      description: 'Success rate when responding to follow-up questions',
    },

    clarifyingQuestionsAsked: Number,

    clarifyingQuestionQuality: {
      type: String,
      enum: ['poor', 'average', 'good', 'excellent'],
    },

    // Tone & mood
    tone: {
      type: String,
      enum: ['uncertain', 'neutral', 'confident', 'overconfident'],
    },

    mood: {
      type: String,
      enum: ['relaxed', 'neutral', 'stressed', 'frustrated'],
    },

    // Recovery signals (after mistakes)
    recoveryAfterMistake: Boolean,

    mistakeRecognitionTime: Number, // seconds to realize mistake

    correctionClarityScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    // Engagement level
    engagementLevel: {
      type: String,
      enum: ['low', 'moderate', 'high'],
    },

    attentionToDetails: {
      type: Number,
      min: 0,
      max: 100,
    },

    // Comparison signals
    communicationTrajectory: {
      type: String,
      enum: ['declining', 'stable', 'improving'],
      description: 'Communication quality over session duration',
    },

    initialPerformance: Number,

    finalPerformance: Number,

    // Overall communication score
    overallCommunicationScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    communicationLevel: {
      type: String,
      enum: ['needs-improvement', 'average', 'good', 'excellent'],
    },

    // Recommendations
    communicationFeedback: [String],

    suggestedImprovements: [String],

    // Transcript analysis
    transcriptKeyPhrases: [String],

    sentimentDistribution: {
      positive: {
        type: Number,
        min: 0,
        max: 1,
      },
      neutral: {
        type: Number,
        min: 0,
        max: 1,
      },
      negative: {
        type: Number,
        min: 0,
        max: 1,
      },
    },

    // Recording metadata
    audioLength: Number, // seconds

    voiceQuality: {
      type: String,
      enum: ['poor', 'fair', 'good', 'excellent'],
    },

    backgroundNoiseDetected: Boolean,

    // Recorded at
    recordedAt: {
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
    collection: 'mock_interview_voice_signals',
  }
);

// Indexes
mockInterviewVoiceSignalSchema.index({ userId: 1, recordedAt: -1 });
mockInterviewVoiceSignalSchema.index({ sessionId: 1 });
mockInterviewVoiceSignalSchema.index({ userId: 1, overallCommunicationScore: -1 });

module.exports = mongoose.model('MockInterviewVoiceSignal', mockInterviewVoiceSignalSchema);

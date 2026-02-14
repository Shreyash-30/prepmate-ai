const mongoose = require('mongoose');

const aiMentorConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    conversationId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    conversationType: {
      type: String,
      enum: ['general', 'problem-solving', 'concept-explanation', 'interview-prep', 'career-guidance'],
      default: 'general',
      index: true,
    },
    contextTopic: String,
    contextProblemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
    },
    messageHistory: [
      {
        role: {
          type: String,
          enum: ['user', 'assistant'],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: () => new Date(),
        },
        tokens: Number,
        model: String,
      },
    ],
    conversationSummary: String,
    keyConceptsCovered: [String],
    userLearningLevel: {
      type: Number,
      min: 1,
      max: 5,
    },
    clarityScore: {
      type: Number,
      min: 1,
      max: 5,
    },
    helpfulnessRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    userFeedback: String,
    suggestedTopicsForFollowUp: [String],
    totalMessages: {
      type: Number,
      default: 0,
    },
    totalTokens: {
      type: Number,
      default: 0,
    },
    sessionDuration: {
      type: Number, // in seconds
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastMessageTime: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

aiMentorConversationSchema.index({ userId: 1, createdAt: -1 });
aiMentorConversationSchema.index({ userId: 1, isActive: 1 });
aiMentorConversationSchema.index({ lastMessageTime: -1 });
aiMentorConversationSchema.index({ conversationType: 1 });

module.exports = mongoose.model('AIMentorConversation', aiMentorConversationSchema);

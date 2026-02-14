const mongoose = require('mongoose');

const practiceSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionType: {
      type: String,
      enum: ['practice', 'mock-interview', 'revision', 'learning-session'],
      required: true,
      index: true,
    },
    sessionName: String,
    problemIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
      },
    ],
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: Date,
    durationMinutes: Number,
    problemsSolved: {
      type: Number,
      default: 0,
    },
    problemsAttempted: {
      type: Number,
      default: 0,
    },
    successRate: {
      type: Number,
      min: 0,
      max: 100,
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
    },
    averageAccuracy: {
      type: Number,
      min: 0,
      max: 100,
    },
    explanationScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    codeQuality: {
      type: Number,
      min: 0,
      max: 100,
    },
    timeManagement: {
      type: Number,
      min: 0,
      max: 100,
    },
    topicsCovered: [String],
    problemPerformance: [
      {
        problemId: mongoose.Schema.Types.ObjectId,
        solved: Boolean,
        timeTaken: Number,
        attempts: Number,
        score: Number,
      },
    ],
    feedback: String,
    aiGeneratedInsights: {
      strengths: [String],
      areasForImprovement: [String],
      recommendations: [String],
    },
    sessionDifficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'mixed'],
    },
    sessionRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

practiceSessionSchema.index({ userId: 1, startTime: -1 });
practiceSessionSchema.index({ userId: 1, sessionType: 1 });
practiceSessionSchema.index({ startTime: -1 });
practiceSessionSchema.index({ score: -1 });

module.exports = mongoose.model('PracticeSession', practiceSessionSchema);

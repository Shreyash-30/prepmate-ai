const mongoose = require('mongoose');

const masteryMetricSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    topicName: {
      type: String,
      required: true,
    },
    masteryProbability: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    retentionProbability: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
    improvementTrend: {
      type: String,
      enum: ['improving', 'stable', 'declining', 'insufficient-data'],
      default: 'insufficient-data',
    },
    problemsAttempted: {
      type: Number,
      default: 0,
    },
    problemsSolved: {
      type: Number,
      default: 0,
    },
    totalTimeSpent: {
      type: Number, // in minutes
      default: 0,
    },
    recentPerformance: [
      {
        submissionId: mongoose.Schema.Types.ObjectId,
        correct: Boolean,
        timestamp: Date,
        timeTaken: Number,
      },
    ],
    estimatedReadyDate: Date,
    lastUpdated: {
      type: Date,
      default: () => new Date(),
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

masteryMetricSchema.index({ userId: 1, topicId: 1 }, { unique: true });
masteryMetricSchema.index({ userId: 1, masteryProbability: -1 });
masteryMetricSchema.index({ lastUpdated: -1 });

module.exports = mongoose.model('MasteryMetric', masteryMetricSchema);

const mongoose = require('mongoose');

const readinessScoreSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    overallReadinessScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      index: true,
    },
    readinessLevel: {
      type: String,
      enum: ['not-ready', 'somewhat-ready', 'ready', 'very-ready', 'interview-ready'],
      index: true,
    },
    companyReadiness: {
      type: Map,
      of: {
        readinessScore: Number,
        strongAreas: [String],
        weakAreas: [String],
        estimatedInterviewSuccess: Number,
      },
    },
    subjectWiseReadiness: {
      type: Map,
      of: {
        masteryScore: Number,
        completionPercentage: Number,
        readyForInterview: Boolean,
      },
    },
    readinessTrend: {
      type: String,
      enum: ['improving', 'stable', 'declining'],
    },
    trendData: [
      {
        date: Date,
        score: Number,
      },
    ],
    estimatedReadyDate: {
      type: Date,
      index: true,
    },
    confidenceInterval: {
      lower: Number,
      upper: Number,
    },
    topStrengths: [String],
    topWeaknesses: [String],
    recommendedFocus: [String],
    calculatedAt: {
      type: Date,
      default: () => new Date(),
      index: true,
    },
    calculationMethod: {
      type: String,
      enum: ['mastery-based', 'submission-based', 'ai-estimated', 'hybrid'],
    },
  },
  {
    timestamps: true,
  }
);

readinessScoreSchema.index({ overallReadinessScore: -1 });
readinessScoreSchema.index({ estimatedReadyDate: 1 });
readinessScoreSchema.index({ readinessLevel: 1 });

module.exports = mongoose.model('ReadinessScore', readinessScoreSchema);

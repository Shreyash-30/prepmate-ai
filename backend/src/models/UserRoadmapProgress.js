const mongoose = require('mongoose');

const userRoadmapProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    roadmapId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Roadmap',
      required: true,
      index: true,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    totalTopics: {
      type: Number,
      default: 0,
    },
    completedTopics: {
      type: Number,
      default: 0,
    },
    topicProgress: [
      {
        topicId: {
          type: mongoose.Schema.Types.ObjectId,
          index: true,
        },
        topicName: String,
        completed: {
          type: Boolean,
          default: false,
        },
        masteryScore: {
          type: Number,
          min: 0,
          max: 100,
        },
        retentionScore: {
          type: Number,
          min: 0,
          max: 100,
        },
        lastPracticedAt: Date,
        practiceCount: {
          type: Number,
          default: 0,
        },
        correctAttempts: {
          type: Number,
          default: 0,
        },
      },
    ],
    startedAt: {
      type: Date,
      default: () => new Date(),
    },
    estimatedCompletionDate: Date,
    actualCompletionDate: Date,
    status: {
      type: String,
      enum: ['in-progress', 'paused', 'completed', 'abandoned'],
      default: 'in-progress',
      index: true,
    },
    // PCI (Preparation Completeness Index) fields
    pciScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
      index: true,
    },
    pciScorePercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    completedWeightSum: {
      type: Number,
      default: 0,
    },
    totalWeightSum: {
      type: Number,
      default: 0,
    },
    topicsCompleted: {
      type: Number,
      default: 0,
    },
    topicsTotal: {
      type: Number,
      default: 0,
    },
    masteryThreshold: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.6,
    },
    pciLastUpdated: {
      type: Date,
      index: true,
    },
    // Topic-wise progress with mastery data
    topicProgresses: [
      {
        topicId: mongoose.Schema.Types.ObjectId,
        topicName: String,
        weight: {
          type: Number,
          default: 1,
        },
        layer: {
          type: String,
          default: 'core',
        },
        estimatedMastery: {
          type: Number,
          min: 0,
          max: 1,
          default: 0,
        },
        isCompleted: {
          type: Boolean,
          default: false,
        },
        completionStatus: {
          type: String,
          enum: ['incomplete', 'minimal', 'moderate', 'strong', 'proficient'],
          default: 'incomplete',
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

userRoadmapProgressSchema.index({ userId: 1, roadmapId: 1 }, { unique: true });
userRoadmapProgressSchema.index({ userId: 1, status: 1 });
userRoadmapProgressSchema.index({ 'topicProgress.topicId': 1 });

module.exports = mongoose.model('UserRoadmapProgress', userRoadmapProgressSchema);

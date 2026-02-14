const mongoose = require('mongoose');

const revisionScheduleSchema = new mongoose.Schema(
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
    topicName: String,
    nextRevisionDate: {
      type: Date,
      required: true,
      index: true,
    },
    lastRevisionDate: Date,
    revisionPriority: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
      index: true,
    },
    stabilityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    revisionCount: {
      type: Number,
      default: 0,
    },
    revisionInterval: {
      type: Number, // in days
      default: 1,
    },
    maxIntervalReached: {
      type: Boolean,
      default: false,
    },
    problemsToRevise: [
      {
        problemId: mongoose.Schema.Types.ObjectId,
        difficulty: String,
        category: String,
      },
    ],
    revisionHistory: [
      {
        revisionDate: Date,
        performanceScore: Number,
        timeSpent: Number,
      },
    ],
    spaceRepetitionPhase: {
      type: Number,
      min: 1,
      max: 5,
      default: 1,
    },
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'overdue'],
      default: 'scheduled',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

revisionScheduleSchema.index({ userId: 1, nextRevisionDate: 1 });
revisionScheduleSchema.index({ userId: 1, status: 1 });
revisionScheduleSchema.index({ nextRevisionDate: 1, revisionPriority: -1 });

module.exports = mongoose.model('RevisionSchedule', revisionScheduleSchema);

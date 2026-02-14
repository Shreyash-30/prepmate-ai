const mongoose = require('mongoose');

const platformIntegrationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    platformName: {
      type: String,
      enum: ['leetcode', 'codeforces', 'hackerrank', 'interviewbit', 'codechef', 'geeksforgeeks'],
      required: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    lastSyncTime: {
      type: Date,
    },
    syncStatus: {
      type: String,
      enum: ['pending', 'syncing', 'success', 'failed'],
      default: 'pending',
    },
    syncErrorMessage: {
      type: String,
    },
    profile: {
      solvedProblems: Number,
      totalSubmissions: Number,
      acceptanceRate: Number,
      ranking: Number,
      badge: String,
    },
  },
  {
    timestamps: true,
  }
);

platformIntegrationSchema.index({ userId: 1, platformName: 1 }, { unique: true });
platformIntegrationSchema.index({ lastSyncTime: -1 });
platformIntegrationSchema.index({ syncStatus: 1 });

module.exports = mongoose.model('PlatformIntegration', platformIntegrationSchema);

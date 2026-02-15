const mongoose = require('mongoose');

/**
 * ExternalPlatformSubmissions Schema - Platform integration cache
 * Denormalized sync of external platform submissions
 * Includes problem metadata and platform-specific info
 * 
 * Used by: SyncServices, ProblemNormalization, RecommendationEngine
 */
const externalPlatformSubmissionsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    platform: {
      type: String,
      enum: ['leetcode', 'codeforces', 'hackerrank', 'geeksforgeeks', 'interviewbit', 'codechef'],
      required: true,
      index: true,
    },

    platformUsername: {
      type: String,
      required: true,
    },

    platformProblemId: {
      type: String,
      required: true,
      index: true,
    },

    //Problem metadata from platform
    problemTitle: String,

    // Problem difficulty (normalized)
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      index: true,
    },

    // Platform-specific tags
    tags: [String],

    // Submission status
    accepted: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Submission metrics
    submissionCount: {
      type: Number,
      default: 1,
      min: 0,
    },

    acceptedSubmissionCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Temporal data
    firstSubmissionDate: Date,

    lastSubmissionDate: {
      type: Date,
      index: true,
    },

    acceptedDate: Date,

    // Performance metrics (platform-specific)
    runtime: {
      ms: Number,
      percentile: Number, // Runtime percentile on platform
    },

    memoryUsage: {
      mb: Number,
      percentile: Number, // Memory percentile on platform
    },

    // Categorization
    category: String,
    companyTags: [String],

    // Platform-specific metadata
    platformMetadata: {
      isPremium: Boolean,
      isFrequent: Boolean, // Asked frequently in interviews
      acceptanceRate: Number,
    },

    // Mapping to canonical problem
    canonicalProblemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CanonicalProblem',
      index: true,
    },

    // Mapping to internal Topic
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      index: true,
    },

    // Sync metadata
    lastSyncedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    syncSource: {
      batchId: String,
      timestamp: Date,
      method: {
        type: String,
        enum: ['graphql', 'rest-api', 'csv', 'manual'],
      },
    },

    // Deduplication
    _deduplicationKey: {
      type: String,
      unique: true,
      sparse: true,
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
    collection: 'external_platform_submissions',
  }
);

// Indexes for efficient querying
externalPlatformSubmissionsSchema.index({ userId: 1, platform: 1 });
externalPlatformSubmissionsSchema.index({ platform: 1, accepted: 1 });
externalPlatformSubmissionsSchema.index({ userId: 1, accepted: 1, lastSubmissionDate: -1 });
externalPlatformSubmissionsSchema.index({ canonicalProblemId: 1 });

// Pre-save hook for deduplication key
externalPlatformSubmissionsSchema.pre('save', function(next) {
  if (!this._deduplicationKey && this.userId && this.platform && this.platformProblemId) {
    this._deduplicationKey = `${this.userId}-${this.platform}-${this.platformProblemId}`;
  }
  next();
});

module.exports = mongoose.model('ExternalPlatformSubmission', externalPlatformSubmissionsSchema);

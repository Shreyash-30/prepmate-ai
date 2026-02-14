const mongoose = require('mongoose');

/**
 * PlatformProblemMapping Schema
 * Maps platform-specific problems to canonical problems
 * Enables deduplication and unified tracking
 */
const platformProblemMappingSchema = new mongoose.Schema(
  {
    // Platform identifier
    platform: {
      type: String,
      enum: ['leetcode', 'codeforces', 'hackerrank', 'geeksforgeeks', 'interviewbit', 'codechef'],
      required: true,
      index: true,
    },

    // Platform-specific problem ID
    platform_problem_id: {
      type: String,
      required: true,
      index: true,
    },

    // Reference to canonical problem
    canonical_problem_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CanonicalProblem',
      required: true,
      index: true,
    },

    // Mapping metadata
    mapping_confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.95, // High confidence = algorithmic match, Low = manual, Medium = heuristic
    },
    mapping_method: {
      type: String,
      enum: ['exact_title_match', 'hash_match', 'manual', 'heuristic', 'community_verified'],
      default: 'heuristic',
    },

    // Platform-specific metadata preservation
    platform_metadata: {
      title: String,
      difficulty: String,
      platform_url: String,
      last_verified: Date,
    },

    // Sync tracking
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
    last_synced: Date,
    sync_count: {
      type: Number,
      default: 0,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    collection: 'platform_problem_mappings',
    timestamps: true,
  }
);

// Unique constraint: one platform problem maps to one canonical problem
platformProblemMappingSchema.index({ platform: 1, platform_problem_id: 1 }, { unique: true });

// Query indexes
platformProblemMappingSchema.index({ canonical_problem_id: 1, platform: 1 });
platformProblemMappingSchema.index({ mapping_confidence: -1 });

module.exports = mongoose.model('PlatformProblemMapping', platformProblemMappingSchema);

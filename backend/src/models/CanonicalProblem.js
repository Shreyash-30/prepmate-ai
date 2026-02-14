const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

/**
 * CanonicalProblem Schema
 * Platform-agnostic unified problem representation
 * Deduplicates identical problems across platforms
 */
const canonicalProblemSchema = new mongoose.Schema(
  {
    // Unique canonical identifier
    canonical_problem_id: {
      type: String,
      default: uuidv4,
      unique: true,
      index: true,
    },

    // Problem core metadata
    title: {
      type: String,
      required: true,
      index: true,
      text: true,
    },
    description: String,
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
      index: true,
    },

    // Normalized taxonomy
    topics: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic',
        index: true,
      },
    ],
    normalized_tags: [
      {
        type: String,
        lowercase: true,
        index: true,
      },
    ],

    // Cross-platform metadata
    solution_url: String,
    company_frequency: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    interview_frequency_score: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },

    // Platform presence tracking
    platforms: [
      {
        platform: {
          type: String,
          enum: ['leetcode', 'codeforces', 'hackerrank', 'geeksforgeeks', 'interviewbit', 'codechef'],
        },
        platform_count: Number,
        first_seen: Date,
        last_seen: Date,
      },
    ],

    // Problem telemetry aggregation
    aggregate_telemetry: {
      total_submissions: {
        type: Number,
        default: 0,
      },
      successful_submissions: {
        type: Number,
        default: 0,
      },
      aggregate_success_rate: {
        type: Number,
        min: 0,
        max: 1,
        default: 0,
      },
      avg_solve_time_seconds: Number,
      last_updated: Date,
    },

    // ML features
    ml_signals: {
      discriminative_power: Number,
      concept_coverage: [String],
      prerequisite_topics: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'CanonicalProblem',
        },
      ],
    },

    // Versioning & status
    version: {
      type: Number,
      default: 1,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
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
    collection: 'canonical_problems',
    timestamps: true,
  }
);

// Indexes for performance
canonicalProblemSchema.index({ title: 'text', description: 'text' }); // Full text search
canonicalProblemSchema.index({ difficulty: 1, 'aggregate_telemetry.aggregate_success_rate': -1 }); // Success rate by difficulty
canonicalProblemSchema.index({ normalized_tags: 1, difficulty: 1 }); // Tag + difficulty queries
canonicalProblemSchema.index({ 'platforms.platform': 1 }); // Platform queries
canonicalProblemSchema.index({ interview_frequency_score: -1 }); // Interview frequency ranking
canonicalProblemSchema.index({ createdAt: -1 }); // Recent problems

module.exports = mongoose.model('CanonicalProblem', canonicalProblemSchema);

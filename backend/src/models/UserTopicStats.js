const mongoose = require('mongoose');

/**
 * UserTopicStats Schema
 * Aggregated topic-level statistics for user telemetry
 * Updated via background workers after submission ingestion
 * Powers AI engine feeds and UI analytics
 */
const userTopicStatsSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    topic_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      required: true,
      index: true,
    },

    // Attempt statistics
    total_attempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    successful_attempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    failed_attempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Success rate and consistency
    success_rate: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },

    consistency_score: {
      type: Number,
      min: 0,
      max: 1,
      description: 'Measure of consistent performance across attempts (prevents luck)',
    },

    // Difficulty metrics
    attempts_by_difficulty: {
      easy: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      hard: { type: Number, default: 0 },
    },

    success_by_difficulty: {
      easy: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      hard: { type: Number, default: 0 },
    },

    // Time metrics
    avg_solve_time_seconds: Number,
    min_solve_time_seconds: Number,
    max_solve_time_seconds: Number,
    median_solve_time_seconds: Number,

    // Engagement
    last_activity: {
      type: Date,
      index: true,
    },

    days_since_last_activity: Number,

    // Retention & mastery (denormalized from ML services for performance)
    estimated_mastery: {
      type: Number,
      min: 0,
      max: 1,
      description: 'Current mastery probability (from Bayesian Knowledge Tracing)',
    },

    mastery_trend: {
      type: String,
      enum: ['improving', 'stable', 'declining'],
    },

    retention_level: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
    },

    // Problem-solving quality
    first_attempt_success_rate: {
      type: Number,
      min: 0,
      max: 1,
    },

    retry_count: {
      type: Number,
      default: 0,
    },

    avg_retries_per_problem: Number,

    // Hints and interventions
    hints_used_total: {
      type: Number,
      default: 0,
    },

    avg_hints_per_problem: Number,

    // Problem coverage
    unique_problems_attempted: {
      type: Number,
      default: 0,
    },

    unique_problems_solved: {
      type: Number,
      default: 0,
    },

    // Spaced repetition tracking
    problems_due_for_revision: {
      type: Number,
      default: 0,
    },

    problems_in_critical_state: {
      type: Number,
      default: 0,
    },

    // Computational signals for ML features
    engagement_score: {
      type: Number,
      min: 0,
      max: 1,
    },

    difficulty_adaptation: {
      type: Number,
      description: 'How well user adapts to difficulty progression (-1 to 1)',
    },

    // Benchmarking
    percentile_rank: Number,
    comparison_vs_average: Number,

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

    last_aggregation_time: {
      type: Date,
      description: 'When this record was last updated by aggregation worker',
    },
  },
  {
    collection: 'user_topic_stats',
    timestamps: true,
  }
);

// Unique constraint: one stats record per user-topic combination
userTopicStatsSchema.index({ user_id: 1, topic_id: 1 }, { unique: true });

// Query indexes
userTopicStatsSchema.index({ user_id: 1, last_activity: -1 }); // Recent activity by user
userTopicStatsSchema.index({ user_id: 1, success_rate: -1 }); // Sorted by success rate
userTopicStatsSchema.index({ user_id: 1, estimated_mastery: -1 }); // Mastery ranking
userTopicStatsSchema.index({ user_id: 1, mastery_trend: 1 }); // Trend filtering
userTopicStatsSchema.index({ topic_id: 1, percentile_rank: 1 }); // Community benchmarking

module.exports = mongoose.model('UserTopicStats', userTopicStatsSchema);

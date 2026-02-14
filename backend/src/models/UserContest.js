const mongoose = require('mongoose');

/**
 * UserContest Schema - Contest participation and performance
 * Feeds interview readiness prediction and stress resilience scoring
 */
const userContestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    
    // Contest identifiers
    platform: {
      type: String,
      enum: ['leetcode', 'codeforces', 'hackerrank', 'atcoder', 'manual'],
      required: true,
      index: true,
    },
    contestId: {
      type: String,
      required: true,
      index: true,
    },
    
    // Contest metadata
    contestName: String,
    contestDate: {
      type: Date,
      index: true,
    },
    contestType: {
      type: String,
      enum: ['biweekly', 'weekly', 'monthly', 'annual', 'mock'],
    },
    
    // Performance metrics
    rank: {
      type: Number,
      min: 1,
    },
    totalParticipants: Number,
    percentileRank: Number, // 0-100
    
    // Problem-solving performance
    problemsSolved: {
      type: Number,
      default: 0,
    },
    totalProblems: Number,
    score: Number,
    maxScore: Number,
    
    // Rating dynamics (for platforms that track it)
    ratingBefore: Number,
    ratingAfter: Number,
    ratingChange: Number,
    ratingChangePercent: Number,
    
    // Time-based metrics
    totalTimeSpent: Number, // seconds
    averageProblemTime: Number, // seconds
    timeToFirstAccept: Number, // seconds
    
    // Submission history in contest
    submissions: [{
      problemId: String,
      problemName: String,
      attempt: Number,
      verdict: String,
      timestamp: Date,
      timeToSolve: Number,
      wrongAttempts: Number,
    }],
    
    // Performance signals for ML
    consistency: {
      type: Number,
      min: 0,
      max: 1,
      description: 'Consistency in solving across difficulties',
    },
    pressureHandling: {
      type: Number,
      min: 0,
      max: 1,
      description: 'Performance degradation under time pressure',
    },
    
    // Difficulty progression
    easyProblems: {
      solved: Number,
      attempted: Number,
    },
    mediumProblems: {
      solved: Number,
      attempted: Number,
    },
    hardProblems: {
      solved: Number,
      attempted: Number,
    },
    
    // External sync metadata
    syncedFrom: {
      platform: String,
      timestamp: Date,
      source: {
        type: String,
        enum: ['api', 'manual'],
      },
    },
    
    // ML pipeline
    mlSignals: {
      readiness_predictor_included: Boolean,
      performance_trend_analyzed: Boolean,
      consistency_computed: Boolean,
    },
    
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes
userContestSchema.index({ userId: 1, platform: 1 });
userContestSchema.index({ userId: 1, contestDate: -1 });
userContestSchema.index({ platform: 1, contestDate: -1 });
userContestSchema.index({ userId: 1, ratingChange: 1 });

userContestSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate consistency
  if (this.problemsSolved > 0 && this.totalProblems > 0) {
    this.consistency = Math.min(1, this.problemsSolved / this.totalProblems);
  }
  
  // Calculate pressure handling (lower score when rushed)
  if (this.totalTimeSpent && this.problemsSolved > 0) {
    const avgTime = this.totalTimeSpent / this.problemsSolved;
    this.pressureHandling = Math.max(0, Math.min(1, 1 - avgTime / 3600)); // 1 hour baseline
  }
  
  next();
});

module.exports = mongoose.model('UserContest', userContestSchema);

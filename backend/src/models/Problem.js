const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema(
  {
    // Platform identifiers
    externalId: {
      type: String,
      sparse: true,
      index: true,
    },
    platformId: {
      type: String,
      index: true,
    },
    platform: {
      type: String,
      enum: ['leetcode', 'codeforces', 'hackerrank', 'interviewbit', 'codechef', 'geeksforgeeks', 'internal', 'manual'],
      required: true,
      index: true,
    },
    
    // Problem metadata
    title: {
      type: String,
      required: true,
      index: true,
      text: true,
    },
    description: {
      type: String,
      text: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
      index: true,
    },
    
    // Topic taxonomy (internal)
    topics: [
      {
        type: String,
        index: true,
      },
    ],
    platformTags: [String],
    
    // Problem content
    url: {
      type: String,
    },
    editorialUrl: String,
    constraints: [String],
    examples: [
      {
        input: String,
        output: String,
        explanation: String,
      },
    ],
    
    // Statistics
    acceptanceRate: {
      type: Number,
      min: 0,
      max: 100,
    },
    submissionCount: {
      type: Number,
      default: 0,
    },
    
    // Interview relevance scoring
    interviewFrequencyScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
      index: true,
    },
    companyFrequency: [{
      company: String,
      frequency: Number,
      lastSeen: Date,
    }],
    
    // Constraints for analysis
    constraintMetadata: {
      timeLimit: Number,
      memoryLimit: Number,
      inputSize: String,
    },
    
    // Telemetry aggregates (updated by workers)
    telemetry: {
      averageAttempts: Number,
      averageSolveTime: Number,
      successRate: Number,
      hintsUsedAverage: Number,
      lastUpdated: Date,
    },
    
    // Sync metadata
    syncedFrom: {
      platform: String,
      timestamp: Date,
      source: {
        type: String,
        enum: ['api', 'csv', 'manual', 'webhook'],
      },
      syncBatchId: String,
    },
    
    isActive: {
      type: Boolean,
      default: true,
      index: true,
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
  {
    timestamps: true,
  }
);

// Composite indexes for performance
problemSchema.index({ platform: 1, platformId: 1 }, { sparse: true });
problemSchema.index({ difficulty: 1, interviewFrequencyScore: -1 });
problemSchema.index({ topics: 1, difficulty: 1 });
problemSchema.index({ title: 'text', description: 'text' });
problemSchema.index({ 'syncedFrom.timestamp': -1 });
problemSchema.index({ platform: 1, createdAt: -1 });

module.exports = mongoose.model('Problem', problemSchema);

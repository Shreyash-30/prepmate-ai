const mongoose = require('mongoose');

/**
 * RoadmapTopicProblem Schema - Problems mapped to topics in roadmaps
 * Enables personalized roadmap adaptation based on user performance
 */
const roadmapTopicProblemSchema = new mongoose.Schema(
  {
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoadmapTopic',
      required: true,
      index: true,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
      index: true,
    },
    
    // Sequencing
    recommendedOrder: {
      type: Number,
      min: 0,
    },
    prerequisiteProblems: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoadmapTopicProblem',
    }],
    
    // Importance scoring
    importanceScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
    },
    // Spec-compliant field name: importance_weight
    importance_weight: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
    },
    
    // Pedagogical value
    learnsConcepts: [String],
    reinforcesConcepts: [String],
    skills: [String],
    
    // Problem rationale in context
    pedagogicalReason: String,
    typicalMistakes: [String],
    
    // Submission analytics for this problem in this topic
    aggregateStats: {
      timesAttempted: Number,
      solveRate: Number,
      averageAttempts: Number,
      averageSolveTime: Number,
      averageHintsUsed: Number,
    },
    
    // Estimation
    estimatedMinutes: {
      easy: { type: Number, default: 15 },
      medium: { type: Number, default: 35 },
      hard: { type: Number, default: 75 },
    },
    
    // Adaptive flags
    isOptional: {
      type: Boolean,
      default: false,
    },
    canSkip: {
      type: Boolean,
      default: false,
    },
    
    // Variant problems (similar but different)
    variants: [{
      problemId: mongoose.Schema.Types.ObjectId,
      difficulty: String,
    }],
    
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

roadmapTopicProblemSchema.index({ topicId: 1, recommendedOrder: 1 });
roadmapTopicProblemSchema.index({ topicId: 1, importanceScore: -1 });
roadmapTopicProblemSchema.index({ problemId: 1 });

module.exports = mongoose.model('RoadmapTopicProblem', roadmapTopicProblemSchema);

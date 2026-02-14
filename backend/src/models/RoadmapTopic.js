const mongoose = require('mongoose');

/**
 * RoadmapTopic Schema - Topics within each roadmap
 * Links topics to problems and tracks completion progress
 */
const roadmapTopicSchema = new mongoose.Schema(
  {
    roadmapId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Roadmap',
      required: true,
      index: true,
    },
    
    // Topic identity
    name: {
      type: String,
      required: true,
      index: true,
    },
    description: String,
    
    // Topic importance & sequencing
    weight: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
    },
    priority: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    order: Number,
    layer: {
      type: String,
      enum: ['core', 'reinforcement', 'advanced', 'optional'],
      default: 'core',
    },
    
    // Dependencies
    dependencyTopics: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoadmapTopic',
    }],
    
    // Interview metrics
    interviewFrequencyScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    difficultyLevel: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    
    // Content
    estimatedHours: {
      type: Number,
      default: 4,
    },
    resourceLinks: [String],
    
    // Topic progress
    totalProblems: {
      type: Number,
      default: 0,
    },
    requiredProblems: {
      type: Number,
      default: 5,
    },
    completionThreshold: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.7,
    },
    
    // Learning resources
    concepts: [String],
    keywords: [String],
    
    // Problem space
    problems: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoadmapTopicProblem',
    }],
    
    // Telemetry
    telemetry: {
      averageCompletionRate: Number,
      averageTimeSpent: Number,
      adoptionRate: Number,
      lastUpdated: Date,
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

roadmapTopicSchema.index({ roadmapId: 1, order: 1 });
roadmapTopicSchema.index({ roadmapId: 1, interviewFrequencyScore: -1 });
roadmapTopicSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('RoadmapTopic', roadmapTopicSchema);

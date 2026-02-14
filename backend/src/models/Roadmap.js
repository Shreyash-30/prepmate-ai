const mongoose = require('mongoose');

const roadmapSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    subject: {
      type: String,
      enum: ['DSA', 'OS', 'DBMS', 'Networks', 'SystemDesign', 'Behavioral', 'FullStack', 'Frontend', 'Backend', 'dsa', 'os', 'dbms', 'networking', 'system_design', 'behavioral'],
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['dsa', 'system_design', 'os', 'dbms', 'networking', 'oops', 'database', 'javascript', 'python', 'java'],
    },
    description: {
      type: String,
    },
    difficultyLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
      index: true,
    },
    estimatedDurationDays: {
      type: Number,
    },
    estimatedHours: Number,
    
    // Roadmap structure
    layers: [
      {
        layerName: {
          type: String,
          enum: ['core', 'reinforcement', 'advanced', 'optional'],
        },
        topics: [
          {
            topicId: mongoose.Schema.Types.ObjectId,
            topicName: String,
            priority: {
              type: Number,
              min: 1,
              max: 5,
            },
            estimatedHours: Number,
            resourceLinks: [String],
          },
        ],
      },
    ],
    
    // Enhanced topic structure for telemetry
    topics: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoadmapTopic',
    }],
    
    prerequisites: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Roadmap',
    }],
    
    // Target audience
    targetRole: {
      type: String,
      enum: ['junior', 'mid-level', 'senior', 'intern', 'general'],
    },
    
    // Metadata
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    isOfficial: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isCustom: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    
    // Versioning
    version: {
      type: Number,
      default: 1,
    },
    
    // Statistics (updated by telemetry workers)
    statistics: {
      averageCompletionTime: Number,
      averagePCI: Number,
      userCount: Number,
      lastUpdated: Date,
    },
  },
  {
    timestamps: true,
  }
);

roadmapSchema.index({ subject: 1, difficultyLevel: 1 });
roadmapSchema.index({ isPublished: 1, usageCount: -1 });
roadmapSchema.index({ category: 1, isPublished: 1 });
roadmapSchema.index({ targetRole: 1 });

module.exports = mongoose.model('Roadmap', roadmapSchema);

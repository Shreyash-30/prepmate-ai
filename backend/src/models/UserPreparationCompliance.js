const mongoose = require('mongoose');

/**
 * User Preparation Compliance Schema
 * Tracks task completion, compliance rates, and consistency metrics
 * Used for compliance scoring and automation status
 */
const userPreparationComplianceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    
    // Task tracking
    tasksAssigned: {
      type: Number,
      default: 0,
      min: 0,
    },
    tasksCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
    tasksPending: {
      type: Number,
      default: 0,
      min: 0,
    },
    tasksSkipped: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Completion rates
    completionRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    
    // Weekly metrics
    weeklyMetrics: [
      {
        week: {
          type: Date,
          required: true,
        },
        weekStart: Date,
        weekEnd: Date,
        tasksAssignedWeek: Number,
        tasksCompletedWeek: Number,
        weeklyComplianceScore: {
          type: Number,
          min: 0,
          max: 100,
        },
        dayStreak: Number,
        activedays: {
          type: Number,
          min: 0,
          max: 7,
        },
      },
    ],
    
    // Consistency tracking
    currentStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    streakStartDate: Date,
    lastActiveDate: Date,
    
    // Overall compliance
    consistency_index: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    
    // Performance tracking
    averageCompletionTime: {
      type: Number, // minutes
      default: 0,
      min: 0,
    },
    averageCompletionScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    
    // Compliance status
    complianceStatus: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'inactive'],
      default: 'inactive',
      index: true,
    },
    
    // Historical data
    complianceTrend: [
      {
        date: Date,
        score: Number,
        taskCount: Number,
        completedCount: Number,
      },
    ],
    
    // Automation status
    automationEnabledAt: Date,
    automationDisabledAt: Date,
    automationStatus: {
      type: String,
      enum: ['active', 'paused', 'disabled'],
      default: 'active',
    },
    
    // Automation health metrics
    lastAutomationRun: Date,
    lastAutomationError: String,
    automationRunCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // ML sync status
    lastMLSync: Date,
    pendingMLSync: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
userPreparationComplianceSchema.index({ userId: 1, createdAt: -1 });
userPreparationComplianceSchema.index({ complianceStatus: 1 });
userPreparationComplianceSchema.index({ automationStatus: 1 });
userPreparationComplianceSchema.index({ completionRate: -1 });
userPreparationComplianceSchema.index({ 'weeklyMetrics.week': -1 });
userPreparationComplianceSchema.index({ lastActiveDate: -1 });

module.exports = mongoose.model(
  'UserPreparationCompliance',
  userPreparationComplianceSchema
);

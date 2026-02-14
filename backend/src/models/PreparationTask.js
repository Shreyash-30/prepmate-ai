const mongoose = require('mongoose');

const preparationTaskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    taskType: {
      type: String,
      enum: ['practice', 'revision', 'learning', 'mock-interview', 'concept-review', 'weak-topic'],
      required: true,
      index: true,
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    topicName: String,
    difficultyLevel: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    estimatedDurationMinutes: Number,
    priority: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
      index: true,
    },
    scheduledDate: {
      type: Date,
      index: true,
    },
    dueDate: Date,
    completed: {
      type: Boolean,
      default: false,
      index: true,
    },
    completedAt: Date,
    completionTimeMinutes: Number,
    score: {
      type: Number,
      min: 0,
      max: 100,
    },
    feedback: String,
    reasoning: String,
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'skipped'],
      default: 'pending',
      index: true,
    },
    generatedBy: {
      type: String,
      enum: ['adaptive-planner', 'user', 'system', 'mentor'],
    },
  },
  {
    timestamps: true,
  }
);

preparationTaskSchema.index({ userId: 1, scheduledDate: 1 });
preparationTaskSchema.index({ userId: 1, status: 1 });
preparationTaskSchema.index({ scheduledDate: 1, priority: -1 });
preparationTaskSchema.index({ completedAt: -1 });

module.exports = mongoose.model('PreparationTask', preparationTaskSchema);

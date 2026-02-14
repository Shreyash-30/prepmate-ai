const mongoose = require('mongoose');

const weakTopicSignalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    topicName: {
      type: String,
      required: true,
    },
    mistakeRate: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
      index: true,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      index: true,
    },
    signalType: [
      {
        type: String,
        enum: ['low-accuracy', 'high-time', 'multiple-attempts', 'pattern-mismatch', 'careless-mistakes'],
      },
    ],
    problemsWithMistakes: [
      {
        problemId: mongoose.Schema.Types.ObjectId,
        mistakeType: String,
        attemptCount: Number,
      },
    ],
    lastDetectedAt: {
      type: Date,
      index: true,
    },
    interventionRequired: {
      type: Boolean,
      default: false,
    },
    suggestedActions: [String],
  },
  {
    timestamps: true,
  }
);

weakTopicSignalSchema.index({ userId: 1, topicId: 1 }, { unique: true });
weakTopicSignalSchema.index({ riskScore: -1 });
weakTopicSignalSchema.index({ riskLevel: 1, userId: 1 });

module.exports = mongoose.model('WeakTopicSignal', weakTopicSignalSchema);

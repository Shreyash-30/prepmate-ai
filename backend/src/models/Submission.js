const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
      index: true,
    },
    solved: {
      type: Boolean,
      default: false,
      index: true,
    },
    attempts: {
      type: Number,
      default: 1,
      min: 1,
    },
    timeTaken: {
      type: Number, // in seconds
      default: 0,
    },
    hintUsed: {
      type: Boolean,
      default: false,
    },
    hintCount: {
      type: Number,
      default: 0,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
    },
    language: {
      type: String,
      enum: ['python', 'java', 'cpp', 'javascript', 'csharp', 'go', 'rust'],
    },
    code: {
      type: String,
    },
    output: {
      type: String,
    },
    submissionTime: {
      type: Date,
      default: () => new Date(),
      index: true,
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
    },
    memory: {
      type: Number, // in MB
    },
    runtime: {
      type: Number, // in ms
    },
  },
  {
    timestamps: true,
  }
);

submissionSchema.index({ userId: 1, problemId: 1 });
submissionSchema.index({ userId: 1, solved: 1 });
submissionSchema.index({ submissionTime: -1 });
submissionSchema.index({ difficulty: 1, submissionTime: -1 });

module.exports = mongoose.model('Submission', submissionSchema);

/**
 * Topic Model
 * Represents knowledge topics (DSA, OS, DBMS, CN, etc.)
 */

const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Topic name is required'],
      unique: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['DSA', 'OS', 'DBMS', 'CN', 'OOPs', 'ML', 'System Design', 'Other'],
      default: 'Other',
    },
    description: {
      type: String,
      default: '',
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    estimated_hours: {
      type: Number,
      default: 10,
      min: 1,
      max: 1000,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
    metadata: {
      prerequisites: [String],
      related_topics: [String],
      key_concepts: [String],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
topicSchema.index({ category: 1, is_active: 1 });
topicSchema.index({ name: 1, category: 1 });

module.exports = mongoose.model('Topic', topicSchema);

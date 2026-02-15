/**
 * Topics Controller
 * Handles topic-level operations: listing by category, updating progress
 */

const UserTopicStats = require('../models/UserTopicStats');
const Topic = require('../models/Topic');

/**
 * Helper to convert mastery score to level
 */
const getMasteryLevel = (mastery) => {
  if (mastery >= 0.8) return 'strong';
  if (mastery >= 0.6) return 'improving';
  if (mastery >= 0.3) return 'weak';
  return 'not_started';
};

/**
 * GET /api/topics?category=DSA
 * Get topics by category with user's progress
 */
exports.getTopicsByCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category } = req.query;

    if (!category) {
      return res.status(400).json({
        error: 'Category is required',
      });
    }

    // Get topics by category
    const topics = await Topic.find({
      category: { $regex: category, $options: 'i' },
    }).limit(20);

    // Get user's stats for these topics
    const topicsWithProgress = await Promise.all(
      topics.map(async (topic) => {
        const topicId = topic._id || topic.id;
        const stats = await UserTopicStats.findOne({
          user_id: userId,
          topic_id: topicId,
        });

        return {
          id: topicId,
          name: topic.name,
          category: category,
          mastery: stats ? getMasteryLevel(stats.estimated_mastery) : 'not_started',
          problems_solved: stats?.solved_count || 0,
          total_problems: topic.totalProblems || 0,
          last_practiced: stats?.last_practiced_at || '',
          confidence: Math.round((stats?.estimated_mastery || 0) * 100),
        };
      })
    );

    return res.json({
      success: true,
      data: topicsWithProgress,
    });
  } catch (error) {
    console.error('Get topics by category error:', error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

/**
 * GET /api/topics/categories
 * Get all available topic categories
 */
exports.getCategories = async (req, res) => {
  try {
    const categories = [
      'DSA',
      'OS',
      'DBMS',
      'CN',
      'OOPs',
      'System Design',
      'ML',
    ];

    return res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

/**
 * PUT /api/topics/:topicId
 * Update user's progress on a topic
 */
exports.updateTopicProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { topicId } = req.params;
    const { mastery, problems_solved, confidence } = req.body;

    // Update or create user stats for this topic
    const stats = await UserTopicStats.findOneAndUpdate(
      { user_id: userId, topic_id: topicId },
      {
        user_id: userId,
        topic_id: topicId,
        estimated_mastery: mastery ? mastery / 100 : undefined, // Convert percentage to decimal
        solved_count: problems_solved,
        last_practiced_at: new Date(),
      },
      { upsert: true, new: true }
    );

    // Return updated progress
    return res.json({
      success: true,
      data: {
        id: topicId,
        mastery: getMasteryLevel(stats.estimated_mastery),
        problems_solved: stats.solved_count,
        confidence: Math.round(stats.estimated_mastery * 100),
        last_practiced: stats.last_practiced_at.toISOString(),
      },
    });
  } catch (error) {
    console.error('Update topic progress error:', error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

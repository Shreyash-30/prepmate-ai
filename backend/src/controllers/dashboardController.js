/**
 * Dashboard Controller
 * Handles dashboard data: readiness scores, tasks, weak topics, daily activity
 */

const UserTopicStats = require('../models/UserTopicStats');
const Roadmap = require('../models/Roadmap');

/**
 * GET /api/dashboard/readiness
 * Get overall readiness score across all topics and by category
 */
exports.getReadiness = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's topic stats for all categories
    const stats = await UserTopicStats.find({ user_id: userId });

    if (!stats || stats.length === 0) {
      return res.json({
        success: true,
        data: {
          overall: 0,
          dsa: 0,
          os: 0,
          dbms: 0,
          cn: 0,
          oops: 0,
        },
      });
    }

    // Calculate readiness by category
    const readinessByCategory = {
      overall: 0,
      dsa: 0,
      os: 0,
      dbms: 0,
      cn: 0,
      oops: 0,
    };

    let totalMastery = 0;
    let totalCount = 0;

    stats.forEach(stat => {
      const mastery = Math.round((stat.estimated_mastery || 0) * 100);
      const topic = stat.topic_name || stat.topic_category || 'other';

      // Map to category
      const categoryKey = topic.toLowerCase().includes('dsa') ? 'dsa'
        : topic.toLowerCase().includes('os') ? 'os'
        : topic.toLowerCase().includes('dbms') || topic.toLowerCase().includes('database') ? 'dbms'
        : topic.toLowerCase().includes('cn') || topic.toLowerCase().includes('network') ? 'cn'
        : topic.toLowerCase().includes('oop') ? 'oops'
        : 'dsa'; // default

      if (readinessByCategory[categoryKey]) {
        readinessByCategory[categoryKey] = Math.max(readinessByCategory[categoryKey], mastery);
      }

      totalMastery += mastery;
      totalCount += 1;
    });

    readinessByCategory.overall = totalCount > 0 ? Math.round(totalMastery / totalCount) : 0;

    return res.json({
      success: true,
      data: readinessByCategory,
    });
  } catch (error) {
    console.error('Get readiness error:', error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

/**
 * GET /api/dashboard/tasks/today
 * Get today's recommended tasks based on weak areas and schedule
 */
exports.getTodayTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's weak topics (mastery < 0.5)
    const weakTopics = await UserTopicStats.find({
      user_id: userId,
      estimated_mastery: { $lt: 0.5 },
    }).sort({ estimated_mastery: 1 }).limit(3);

    // Generate tasks based on weak topics
    const tasks = [];

    weakTopics.forEach((topic, index) => {
      const taskTypes = ['practice', 'learn', 'revision'];
      const difficulties = ['easy', 'medium', 'hard'];

      tasks.push({
        id: `task-${index}-practice`,
        title: `Practice: ${topic.topic_name}`,
        type: 'practice',
        topic: topic.topic_name,
        difficulty: 'medium',
        estimated_minutes: 45,
        completed: false,
        due_date: new Date().toISOString().split('T')[0],
      });

      tasks.push({
        id: `task-${index}-review`,
        title: `Review: ${topic.topic_name}`,
        type: 'revision',
        topic: topic.topic_name,
        difficulty: 'easy',
        estimated_minutes: 30,
        completed: false,
        due_date: new Date().toISOString().split('T')[0],
      });
    });

    // Add mock interview task
    tasks.push({
      id: 'task-mock-interview',
      title: 'Mock System Design Interview',
      type: 'mock',
      topic: 'System Design',
      difficulty: 'hard',
      estimated_minutes: 60,
      completed: false,
      due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });

    return res.json({
      success: true,
      data: tasks.slice(0, 6), // Return max 6 tasks
    });
  } catch (error) {
    console.error('Get today tasks error:', error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

/**
 * GET /api/dashboard/weak-topics
 * Get list of topics where user is weak (mastery < 0.5)
 */
exports.getWeakTopics = async (req, res) => {
  try {
    const userId = req.user.id;

    const weakTopics = await UserTopicStats.find({
      user_id: userId,
      estimated_mastery: { $lt: 0.5 },
    }).sort({ estimated_mastery: 1 }).limit(5);

    const topicNames = weakTopics.map(t => t.topic_name);

    return res.json({
      success: true,
      data: topicNames,
    });
  } catch (error) {
    console.error('Get weak topics error:', error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

/**
 * GET /api/dashboard/activity
 * Get daily activity chart data
 */
exports.getActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 7;

    const activity = [];

    // Generate mock activity data for past N days
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      activity.push({
        date: dateStr,
        problems_solved: Math.floor(Math.random() * 8) + 2,
        hours_studied: Math.floor(Math.random() * 3) + 1,
        topics_covered: Math.floor(Math.random() * 4) + 1,
      });
    }

    return res.json({
      success: true,
      data: activity,
    });
  } catch (error) {
    console.error('Get activity error:', error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

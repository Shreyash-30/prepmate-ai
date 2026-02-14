/**
 * Dashboard Intelligence Controller
 * Production-grade SaaS dashboard powered by real MongoDB telemetry and AI outputs
 * Aggregates preparation progress, mastery signals, and actionable intelligence
 */

const UserSubmission = require('../models/UserSubmission');
const UserTopicStats = require('../models/UserTopicStats');
const ReadinessScore = require('../models/ReadinessScore');
const WeakTopicSignal = require('../models/WeakTopicSignal');
const PlatformIntegration = require('../models/PlatformIntegration');
const Problem = require('../models/Problem');
const RevisionSchedule = require('../models/RevisionSchedule');
const UserRoadmapProgress = require('../models/UserRoadmapProgress');
const mongoose = require('mongoose');

/**
 * GET /api/dashboard/summary
 * High-level overview: problems solved, platforms synced, completion metrics
 * Powered by real UserSubmission aggregation
 */
exports.getSummary = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Aggregation: Submissions grouped by difficulty and platform
    const submissionStats = await UserSubmission.aggregate([
      { $match: { userId, isSolved: true } },
      {
        $facet: {
          totalStats: [
            {
              $group: {
                _id: null,
                totalSolved: { $sum: 1 },
                last7Days: {
                  $sum: {
                    $cond: [{ $gte: ['$lastAttemptTime', sevenDaysAgo] }, 1, 0],
                  },
                },
              },
            },
          ],
          difficultyBreakdown: [
            {
              $lookup: {
                from: 'problems',
                localField: 'problemId',
                foreignField: '_id',
                as: 'problem',
              },
            },
            { $unwind: '$problem' },
            {
              $group: {
                _id: '$problem.difficulty',
                count: { $sum: 1 },
              },
            },
          ],
          platformBreakdown: [
            {
              $group: {
                _id: '$platform',
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    // Get platform integrations
    const platforms = await PlatformIntegration.find({ userId });

    // Build response
    const totalData = submissionStats[0]?.totalStats[0] || { totalSolved: 0, last7Days: 0 };
    const difficultyDist = submissionStats[0]?.difficultyBreakdown || [];
    const platformDist = submissionStats[0]?.platformBreakdown || [];

    // Get readiness score
    const readinessScore = await ReadinessScore.findOne({ userId });

    res.json({
      success: true,
      data: {
        totalProblemsSolved: totalData.totalSolved,
        problemsSolvedLast7Days: totalData.last7Days,
        difficultyDistribution: {
          easy: difficultyDist.find(d => d._id === 'easy')?.count || 0,
          medium: difficultyDist.find(d => d._id === 'medium')?.count || 0,
          hard: difficultyDist.find(d => d._id === 'hard')?.count || 0,
        },
        syncedPlatforms: platforms.map(p => ({
          name: p.platformName,
          connected: true,
          username: p.username,
          problemsSynced: platformDist.find(pd => pd._id === p.platformName)?.count || 0,
          lastSync: p.lastSyncTime,
        })),
        readinessScore: readinessScore?.overallReadinessScore || 0,
        readinessLevel: readinessScore?.readinessLevel || 'not-ready',
      },
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
};

/**
 * GET /api/dashboard/activity
 * Real activity timeline: submissions, competitions, roadmap progress over time
 */
exports.getActivity = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get submissions by day
    const dailyActivity = await UserSubmission.aggregate([
      {
        $match: {
          userId,
          lastAttemptTime: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$lastAttemptTime',
            },
          },
          solved: {
            $sum: { $cond: ['$isSolved', 1, 0] },
          },
          total: { $sum: 1 },
          solveTime: { $avg: '$solveTime' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get recent submissions with problem details
    const recentSubmissions = await UserSubmission.aggregate([
      {
        $match: {
          userId,
          lastAttemptTime: { $gte: startDate },
        },
      },
      { $sort: { lastAttemptTime: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'problems',
          localField: 'problemId',
          foreignField: '_id',
          as: 'problem',
        },
      },
      { $unwind: '$problem' },
      {
        $project: {
          title: '$problem.title',
          platform: 1,
          difficulty: '$problem.difficulty',
          isSolved: 1,
          solveTime: 1,
          attempts: 1,
          language: 1,
          lastAttemptTime: 1,
        },
      },
    ]);

    // Fill missing dates with zero activity
    const dateMap = new Map();
    dailyActivity.forEach(day => {
      dateMap.set(day._id, {
        date: day._id,
        problemsSolved: day.solved,
        totalAttempts: day.total,
        avgSolveTime: Math.round(day.solveTime || 0),
      });
    });

    const activityTimeline = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      activityTimeline.push(
        dateMap.get(dateStr) || {
          date: dateStr,
          problemsSolved: 0,
          totalAttempts: 0,
          avgSolveTime: 0,
        }
      );
    }

    res.json({
      success: true,
      data: {
        timeline: activityTimeline,
        recentSubmissions: recentSubmissions.map(s => ({
          id: s._id,
          title: s.title,
          platform: s.platform,
          difficulty: s.difficulty,
          solved: s.isSolved,
          timestamp: s.lastAttemptTime,
          attempts: s.attempts,
        })),
      },
    });
  } catch (error) {
    console.error('Dashboard activity error:', error);
    res.status(500).json({ error: 'Failed to fetch activity data' });
  }
};

/**
 * GET /api/dashboard/intelligence
 * AI-powered intelligence: readiness, completeness, consistency, improvement velocity, weak topics
 */
exports.getIntelligence = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // Get readiness score
    const readiness = await ReadinessScore.findOne({ userId }).lean();

    // Get topic stats for completeness
    const topicStats = await UserTopicStats.find({ user_id: userId }).lean();
    const totalTopics = topicStats.length;
    const masteredTopics = topicStats.filter(t => (t.estimated_mastery || 0) >= 0.8).length;
    const completenessIndex = totalTopics > 0 ? Math.round((masteredTopics / totalTopics) * 100) : 0;

    // Calculate consistency score (last 7/14/30 days)
    const consistency7 = await UserSubmission.countDocuments({
      userId,
      lastAttemptTime: { $gte: sevenDaysAgo },
    });

    const consistency14 = await UserSubmission.countDocuments({
      userId,
      lastAttemptTime: { $gte: fourteenDaysAgo },
    });

    const consistency30 = await UserSubmission.countDocuments({
      userId,
      lastAttemptTime: { $gte: thirtyDaysAgo },
    });

    // Calculate improvement velocity
    const last7Solved = await UserSubmission.countDocuments({
      userId,
      isSolved: true,
      lastAttemptTime: { $gte: sevenDaysAgo },
    });

    const prev7Solved = await UserSubmission.countDocuments({
      userId,
      isSolved: true,
      lastAttemptTime: {
        $gte: fourteenDaysAgo,
        $lt: sevenDaysAgo,
      },
    });

    const improvementVelocity = prev7Solved > 0 
      ? Math.round(((last7Solved - prev7Solved) / prev7Solved) * 100)
      : 0;

    // Get weak topics with risk signals
    const weakTopics = await WeakTopicSignal.find({
      userId,
      riskLevel: { $in: ['high', 'critical'] },
    })
      .sort({ riskScore: -1 })
      .limit(5)
      .lean();

    // Get upcoming revision topics
    const revisions = await RevisionSchedule.find({
      userId,
      scheduledDate: { $lte: new Date(now + 7 * 24 * 60 * 60 * 1000) },
      completed: false,
    })
      .sort({ scheduledDate: 1 })
      .limit(5)
      .lean();

    // Calculate consistency score (0-100) based on submissions frequency
    const consistencyScore = Math.min(
      100,
      Math.round((consistency7 > 5 ? 100 : (consistency7 / 5) * 100))
    );

    res.json({
      success: true,
      data: {
        readinessScore: readiness?.overallReadinessScore || 0,
        readinessLevel: readiness?.readinessLevel || 'not-ready',
        preparationCompletenessIndex: completenessIndex,
        totalTopics,
        masteredTopics,
        consistencyScore,
        submissionsLast7Days: consistency7,
        submissionsLast14Days: consistency14,
        submissionsLast30Days: consistency30,
        improvementVelocity,
        velocityTrend: improvementVelocity > 0 ? 'improving' : improvementVelocity < 0 ? 'declining' : 'stable',
        weakTopics: weakTopics.map(t => ({
          topicName: t.topicName,
          riskScore: t.riskScore,
          riskLevel: t.riskLevel,
          mistakeRate: (t.mistakeRate * 100).toFixed(1),
          signalTypes: t.signalType || [],
        })),
        upcomingRevisions: revisions.map(r => ({
          topicName: r.topicName,
          scheduledDate: r.scheduledDate,
          priority: r.priority || 'medium',
        })),
      },
    });
  } catch (error) {
    console.error('Dashboard intelligence error:', error);
    res.status(500).json({ error: 'Failed to fetch intelligence data' });
  }
};

/**
 * GET /api/dashboard/today-tasks
 * Real tasks from database with weak topic recommendations
 */
exports.getTodayTasks = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Get weak topics
    const weakTopics = await WeakTopicSignal.find({
      userId,
      riskLevel: { $in: ['high', 'critical', 'medium'] },
    })
      .sort({ riskScore: -1 })
      .limit(3)
      .lean();

    const tasks = [];

    // Create practice tasks for weak topics
    weakTopics.forEach((topic, index) => {
      tasks.push({
        id: `task-practice-${index}`,
        title: `Practice: ${topic.topicName}`,
        type: 'practice',
        topicName: topic.topicName,
        priority: topic.riskLevel === 'critical' ? 'high' : 'medium',
        difficulty: 'medium',
        estimatedMinutes: 45,
        completed: false,
      });

      tasks.push({
        id: `task-revision-${index}`,
        title: `Review: ${topic.topicName}`,
        type: 'revision',
        topicName: topic.topicName,
        priority: topic.riskLevel === 'critical' ? 'high' : 'medium',
        difficulty: 'easy',
        estimatedMinutes: 30,
        completed: false,
      });
    });

    // Get roadmap recommendations
    const roadmapProgress = await UserRoadmapProgress.findOne({ userId }).lean();
    if (roadmapProgress?.nextTopicId) {
      tasks.push({
        id: 'task-roadmap',
        title: 'Complete Roadmap Topic',
        type: 'roadmap',
        topicName: roadmapProgress.nextTopicName || 'Next Topic',
        priority: 'medium',
        difficulty: 'medium',
        estimatedMinutes: 60,
        completed: false,
      });
    }

    // Add interview prep task
    tasks.push({
      id: 'task-interview',
      title: 'Mock Interview Prep',
      type: 'mock',
      topicName: 'System Design',
      priority: 'high',
      difficulty: 'hard',
      estimatedMinutes: 90,
      completed: false,
    });

    res.json({
      success: true,
      data: tasks.slice(0, 8),
    });
  } catch (error) {
    console.error('Dashboard today tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch today tasks' });
  }
};

/**
 * GET /api/dashboard/readiness-trend
 * Historical readiness trend for chart visualization
 */
exports.getReadinessTrend = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const days = parseInt(req.query.days) || 30;

    const readinessRecord = await ReadinessScore.findOne({ userId }).lean();
    const trendData = readinessRecord?.trendData || [];

    // Filter to last N days
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const filtered = trendData.filter(t => new Date(t.date) >= cutoffDate);

    // Fill gaps with last known value
    const trend = [];
    let lastScore = readinessRecord?.overallReadinessScore || 0;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayData = filtered.find(
        t => new Date(t.date).toISOString().split('T')[0] === dateStr
      );

      if (dayData) {
        lastScore = dayData.score;
      }

      trend.push({
        date: dateStr,
        score: lastScore,
      });
    }

    res.json({
      success: true,
      data: trend,
    });
  } catch (error) {
    console.error('Dashboard readiness trend error:', error);
    res.status(500).json({ error: 'Failed to fetch readiness trend' });
  }
};

/**
 * GET /api/dashboard/mastery-growth
 * Mastery progression by topic
 */
exports.getMasteryGrowth = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const topicStats = await UserTopicStats.find({ user_id: userId })
      .sort({ estimated_mastery: -1 })
      .lean();

    const masteryData = topicStats
      .slice(0, 8) // Top 8 topics
      .map(stat => ({
        topic: stat.topic_name,
        mastery: Math.round((stat.estimated_mastery || 0) * 100),
        problemsSolved: stat.problems_solved || 0,
        lastUpdated: stat.last_attempt_at,
      }));

    res.json({
      success: true,
      data: masteryData,
    });
  } catch (error) {
    console.error('Dashboard mastery growth error:', error);
    res.status(500).json({ error: 'Failed to fetch mastery growth' });
  }
};

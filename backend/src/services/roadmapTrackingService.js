/**
 * Roadmap Tracking Service
 * Fetches user roadmap progress with problem completion stats
 * Prepares data for ML analysis
 */

const UserRoadmapProgress = require('../models/UserRoadmapProgress');
const RoadmapTopicProblem = require('../models/RoadmapTopicProblem');
const UserSubmission = require('../models/UserSubmission');
const Roadmap = require('../models/Roadmap');
const Problem = require('../models/Problem');
const logger = require('../utils/logger');

class RoadmapTrackingService {
  /**
   * Get user's current roadmap with progress details
   * Returns roadmap progress, topic completion, and problem stats
   */
  async getUserRoadmapProgress(userId) {
    try {
      // Get user's active roadmap progress
      const roadmapProgress = await UserRoadmapProgress.findOne({ userId })
        .populate('roadmapId')
        .lean();

      if (!roadmapProgress) {
        return {
          hasRoadmap: false,
          roadmapId: null,
          roadmapName: null,
          overallProgress: 0,
          completedTopics: 0,
          totalTopics: 0,
          pciScore: 0,
          topicProgress: [],
          problemStats: {
            totalProblems: 0,
            solvedProblems: 0,
            completionRate: 0,
            byDifficulty: {},
          },
        };
      }

      // Get problem completion stats
      const problemStats = await this.getProblemCompletionStats(userId, roadmapProgress.roadmapId);

      return {
        hasRoadmap: true,
        roadmapId: roadmapProgress.roadmapId._id,
        roadmapName: roadmapProgress.roadmapId.name,
        overallProgress: roadmapProgress.progress || 0,
        completedTopics: roadmapProgress.completedTopics || 0,
        totalTopics: roadmapProgress.totalTopics || 0,
        pciScore: roadmapProgress.pciScore || 0,
        pciScorePercentage: roadmapProgress.pciScorePercentage || 0,
        status: roadmapProgress.status,
        startedAt: roadmapProgress.startedAt,
        estimatedCompletionDate: roadmapProgress.estimatedCompletionDate,
        topicProgress: roadmapProgress.topicProgress || [],
        problemStats,
      };
    } catch (error) {
      logger.error(`Error fetching roadmap progress for user ${userId}:`, error);
      return {
        hasRoadmap: false,
        error: error.message,
      };
    }
  }

  /**
   * Get problem completion statistics for a roadmap
   */
  async getProblemCompletionStats(userId, roadmapId) {
    try {
      const roadmap = await Roadmap.findById(roadmapId).populate({
        path: 'topics',
      }).lean();

      if (!roadmap || !roadmap.topics) {
        return {
          totalProblems: 0,
          solvedProblems: 0,
          completionRate: 0,
          byDifficulty: {
            easy: { total: 0, solved: 0, completionRate: 0 },
            medium: { total: 0, solved: 0, completionRate: 0 },
            hard: { total: 0, solved: 0, completionRate: 0 },
          },
          byTopic: [],
        };
      }

      let totalProblems = 0;
      let solvedProblems = 0;
      const difficultyStats = {
        easy: { total: 0, solved: 0 },
        medium: { total: 0, solved: 0 },
        hard: { total: 0, solved: 0 },
      };
      const topicStats = [];

      // For each topic, get problem stats
      for (const topic of roadmap.topics) {
        const topicProblems = await RoadmapTopicProblem.find({
          topicId: topic._id,
        }).lean();

        if (!topicProblems || topicProblems.length === 0) {
          continue;
        }

        let topicTotal = topicProblems.length;
        let topicSolved = 0;

        for (const rtp of topicProblems) {
          totalProblems += 1;

          // Check if user has solved this problem
          const submission = await UserSubmission.findOne({
            userId,
            problemId: rtp.problemId,
            status: { $in: ['accepted', 'success'] },
          }).lean();

          const difficulty = rtp.difficulty || 'medium';
          difficultyStats[difficulty].total += 1;

          if (submission) {
            solvedProblems += 1;
            topicSolved += 1;
            difficultyStats[difficulty].solved += 1;
          }
        }

        topicStats.push({
          topicId: topic._id,
          topicName: topic.name,
          totalProblems: topicTotal,
          solvedProblems: topicSolved,
          completionRate: topicTotal > 0 ? Math.round((topicSolved / topicTotal) * 100) : 0,
        });
      }

      // Calculate completion rates
      const completionRate = totalProblems > 0 ? Math.round((solvedProblems / totalProblems) * 100) : 0;

      return {
        totalProblems,
        solvedProblems,
        completionRate,
        byDifficulty: {
          easy: {
            total: difficultyStats.easy.total,
            solved: difficultyStats.easy.solved,
            completionRate: difficultyStats.easy.total > 0 
              ? Math.round((difficultyStats.easy.solved / difficultyStats.easy.total) * 100)
              : 0,
          },
          medium: {
            total: difficultyStats.medium.total,
            solved: difficultyStats.medium.solved,
            completionRate: difficultyStats.medium.total > 0
              ? Math.round((difficultyStats.medium.solved / difficultyStats.medium.total) * 100)
              : 0,
          },
          hard: {
            total: difficultyStats.hard.total,
            solved: difficultyStats.hard.solved,
            completionRate: difficultyStats.hard.total > 0
              ? Math.round((difficultyStats.hard.solved / difficultyStats.hard.total) * 100)
              : 0,
          },
        },
        byTopic: topicStats,
      };
    } catch (error) {
      logger.error(`Error fetching problem completion stats:`, error);
      return {
        totalProblems: 0,
        solvedProblems: 0,
        completionRate: 0,
        error: error.message,
      };
    }
  }

  /**
   * Get recent roadmap problem completions for ML analysis
   */
  async getRecentCompletions(userId, days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const submissions = await UserSubmission.find({
        userId,
        createdAt: { $gte: startDate },
        status: { $in: ['accepted', 'success'] },
      })
        .populate('problemId', 'title difficulty')
        .sort('-createdAt')
        .lean();

      return submissions.map(sub => ({
        problemId: sub.problemId._id,
        problemTitle: sub.problemId.title,
        difficulty: sub.problemId.difficulty,
        completedAt: sub.createdAt,
        timeToSolve: sub.runtime || 0,
        testsPassed: sub.testsPassed || 0,
        totalTests: sub.totalTests || 0,
      }));
    } catch (error) {
      logger.error(`Error fetching recent completions:`, error);
      return [];
    }
  }

  /**
   * Get roadmap completion trends for ML features
   */
  async getRoadmapTrends(userId, roadmapId) {
    try {
      const roadmapProgress = await UserRoadmapProgress.findOne({ userId, roadmapId }).lean();

      if (!roadmapProgress) {
        return {
          hasData: false,
          trends: [],
        };
      }

      // Get topic progress with timestamps
      const topicTrends = (roadmapProgress.topicProgress || []).map(topic => ({
        topicId: topic.topicId,
        topicName: topic.topicName,
        masteryScore: topic.masteryScore || 0,
        retentionScore: topic.retentionScore || 0,
        practiceCount: topic.practiceCount || 0,
        correctAttempts: topic.correctAttempts || 0,
        lastPracticedAt: topic.lastPracticedAt,
        completed: topic.completed || false,
      }));

      return {
        hasData: true,
        pciScore: roadmapProgress.pciScore || 0,
        pciScorePercentage: roadmapProgress.pciScorePercentage || 0,
        completionPercentage: Math.round((roadmapProgress.completedTopics / roadmapProgress.totalTopics) * 100) || 0,
        topicTrends,
        startedAt: roadmapProgress.startedAt,
        estimatedCompletionDate: roadmapProgress.estimatedCompletionDate,
      };
    } catch (error) {
      logger.error(`Error fetching roadmap trends:`, error);
      return { hasData: false, error: error.message };
    }
  }

  /**
   * Get difficulty distribution of completed problems
   */
  async getDifficultyDistribution(userId, roadmapId) {
    try {
      const roadmap = await Roadmap.findById(roadmapId).populate('topics').lean();
      if (!roadmap) return null;

      const distribution = { easy: 0, medium: 0, hard: 0, total: 0 };

      for (const topic of roadmap.topics) {
        const problems = await RoadmapTopicProblem.find({ topicId: topic._id }).lean();

        for (const rtp of problems) {
          const difficulty = rtp.difficulty || 'medium';
          distribution[difficulty] += 1;
          distribution.total += 1;

          // Check completion
          const submission = await UserSubmission.findOne({
            userId,
            problemId: rtp.problemId,
            status: { $in: ['accepted', 'success'] },
          }).lean();

          if (submission && !distribution[`${difficulty}_completed`]) {
            distribution[`${difficulty}_completed`] = 0;
          }
          if (submission) {
            distribution[`${difficulty}_completed`] += 1;
          }
        }
      }

      return distribution;
    } catch (error) {
      logger.error(`Error fetching difficulty distribution:`, error);
      return null;
    }
  }
}

module.exports = new RoadmapTrackingService();

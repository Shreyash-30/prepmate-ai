/**
 * Recommendation Decision Service
 * Central recommendation engine for entire platform
 * 
 * Unified decision point for:
 * - Practice problem recommendations
 * - Revision scheduling
 * - Interview preparation guidance
 * - Learning content suggestions
 * - Behavioral-based adaptations
 * 
 * All product features (dashboard, practice, revision, planner, interview) call this service
 */

const logger = require('../../utils/logger');
const UserSubmission = require('../../models/UserSubmission');
const UserTopicStats = require('../../models/UserTopicStats');
const WeakTopicSignal = require('../../models/WeakTopicSignal');
const ReadinessScore = require('../../models/ReadinessScore');
const RevisionSchedule = require('../../models/RevisionSchedule');
const PreparationTask = require('../../models/PreparationTask');
const Problem = require('../../models/Problem');

class RecommendationDecisionService {
  /**
   * Generate comprehensive recommendations for user
   * Input: Mastery signals, retention signals, behavioral efficiency, readiness prediction
   * Output: Actionable recommendations across all product dimensions
   */
  async generateRecommendations(userId) {
    try {
      const [mastery, behavioral, readiness, weakTopics] = await Promise.all([
        this._getMasterySignals(userId),
        this._getBehavioralSignals(userId),
        this._getReadinessPrediction(userId),
        this._getWeakTopics(userId)
      ]);

      return {
        practice: this._generatePracticeRecommendations(userId, mastery, behavioral, weakTopics),
        revision: await this._generateRevisionRecommendations(userId, mastery, behavioral),
        learning: this._generateLearningRecommendations(mastery, behavioral, weakTopics),
        interview: this._generateInterviewRecommendations(readiness, mastery),
        adaptive: this._generateAdaptivePathRecommendations(mastery, behavioral, readiness),
        timestamp: new Date()
      };
    } catch (error) {
      logger.error(`Error generating recommendations: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate interview-specific recommendations
   * Used after interview session or for interview prep path
   */
  async generateInterviewRecommendations(userId) {
    try {
      const [readiness, mastery, weakTopics] = await Promise.all([
        this._getReadinessPrediction(userId),
        this._getMasterySignals(userId),
        this._getWeakTopics(userId)
      ]);

      const recommendations = [];

      // Determine readiness level
      const readinessScore = readiness?.overallScore || 0;

      // Critical gaps first
      if (readinessScore < 0.5) {
        recommendations.push({
          priority: 'critical',
          action: 'fundamentals_practice',
          message: 'Focus on DSA fundamentals - take more easy/medium problems before advanced topics',
          estimatedDays: 14,
          topics: mastery.filter(t => t.masteryScore < 0.4).map(t => t.topicId)
        });
      }

      // Weak topic reinforcement
      if (weakTopics.length > 0) {
        recommendations.push({
          priority: 'high',
          action: 'weak_topic_drill',
          message: `Strengthen weak topics: ${weakTopics.slice(0, 3).map(t => t.topicId).join(', ')}`,
          topics: weakTopics.map(t => t.topicId),
          estimatedDays: 7
        });
      }

      // Advanced mock interviews
      if (readinessScore >= 0.7) {
        recommendations.push({
          priority: 'high',
          action: 'mock_interview_series',
          message: 'Take 2-3 mock interviews per week to test interview readiness',
          frequency: 'bi_weekly',
          difficulty: 'hard'
        });
      }

      // Communication and reasoning practice
      recommendations.push({
        priority: 'medium',
        action: 'communication_practice',
        message: 'Record voice explanation for each problem to improve communication clarity',
        frequency: 'after_every_problem'
      });

      return recommendations;
    } catch (error) {
      logger.error(`Error generating interview recommendations: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get next recommended practice problems
   * Called by practice module
   */
  async getNextPracticeProblems(userId, count = 3) {
    try {
      const [mastery, weak, behavioral] = await Promise.all([
        this._getMasterySignals(userId),
        this._getWeakTopics(userId),
        this._getBehavioralSignals(userId)
      ]);

      const recommendations = [];

      // Prioritize weak topics
      if (weak.length > 0) {
        const weakTopic = weak[0];
        const problems = await this._findProblemsByTopic(
          weakTopic.topicId,
          weakTopic.recommendedDifficulty,
          count,
          userId
        );
        recommendations.push(...problems);
      }

      // Fill remaining with difficulty progression
      if (recommendations.length < count) {
        const remainingCount = count - recommendations.length;
        const progressionProblems = await this._getProgressionProblems(
          userId,
          mastery,
          remainingCount
        );
        recommendations.push(...progressionProblems);
      }

      return recommendations.slice(0, count);
    } catch (error) {
      logger.error(`Error getting practice problems: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get cached recommendations (updated after pipeline processes)
   */
  async getRecommendations(userId) {
    try {
      // Check if cached recommendations exist
      const cachedTasks = await PreparationTask.findOne({
        userId,
        type: 'recommendation_batch'
      }).sort({ createdAt: -1 });

      if (cachedTasks) {
        return cachedTasks.recommendations;
      }

      // Generate fresh if not cached
      return await this.generateRecommendations(userId);
    } catch (error) {
      logger.error(`Error getting cached recommendations: ${error.message}`);
      throw error;
    }
  }

  // === Private Helper Methods ===

  async _getMasterySignals(userId) {
    const stats = await UserTopicStats.find({ userId }).lean();
    return stats.map(s => ({
      topicId: s.topicId,
      masteryScore: s.masterScore || 0,
      attempts: s.totalAttempts || 0,
      successRate: s.successRate || 0,
      trend: s.trend || 'stable'
    }));
  }

  async _getBehavioralSignals(userId) {
    const submissions = await UserSubmission.find({ userId }).sort({ submittedAt: -1 }).limit(50);
    if (submissions.length === 0) return {};

    const signals = {
      consistency: this._calculateConsistency(submissions),
      improvement: this._calculateImprovement(submissions),
      hintDependency: this._calculateHintDependency(submissions),
      timeEfficiency: this._calculateTimeEfficiency(submissions)
    };

    return signals;
  }

  async _getReadinessPrediction(userId) {
    const latest = await ReadinessScore.findOne({ userId }).sort({ createdAt: -1 });
    return latest || { overallScore: 0 };
  }

  async _getWeakTopics(userId) {
    return await WeakTopicSignal.find({ userId })
      .sort({ riskScore: -1 })
      .limit(5)
      .lean();
  }

  _generatePracticeRecommendations(userId, mastery, behavioral, weakTopics) {
    const recommendations = [];

    // High-value weak topics
    weakTopics.forEach(weak => {
      recommendations.push({
        type: 'practice',
        priority: 'high',
        topicId: weak.topicId,
        difficulty: weak.recommendedDifficulty || 'medium',
        rationale: `High risk score (${weak.riskScore.toFixed(2)}) - reinforce fundamentals`,
        estimatedTime: 30,
        problemCount: 5
      });
    });

    // Difficulty progression
    const masteryGaps = mastery.filter(m => m.masteryScore >= 0.3 && m.masteryScore < 0.7);
    if (masteryGaps.length > 0) {
      const topic = masteryGaps[0];
      recommendations.push({
        type: 'practice',
        priority: 'medium',
        topicId: topic.topicId,
        difficulty: 'hard',
        rationale: 'Challenge yourself with harder problems in intermediate mastery topics',
        estimatedTime: 45,
        problemCount: 3
      });
    }

    return recommendations;
  }

  async _generateRevisionRecommendations(userId, mastery, behavioral) {
    const recommendations = [];

    // Calculate revision priority: (1 - retention) * mastery * importance
    const revisionCandidates = mastery
      .filter(m => m.masteryScore > 0.5) // Solved before
      .map(m => ({
        topicId: m.topicId,
        priority: (1 - (m.masteryScore * 0.1)) * m.masteryScore,
        lastAttemptDaysAgo: this._daysAgo(m.lastAttemptTime),
        masteryScore: m.masteryScore
      }))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5);

    revisionCandidates.forEach(topic => {
      recommendations.push({
        type: 'revision',
        priority: topic.priority > 0.5 ? 'high' : 'medium',
        topicId: topic.topicId,
        rationale: `Retention-based review (Last: ${topic.lastAttemptDaysAgo}d ago)`,
        problemCount: 3,
        estimatedTime: 20
      });
    });

    return recommendations;
  }

  _generateLearningRecommendations(mastery, behavioral, weakTopics) {
    const recommendations = [];

    // Conceptual learning for weak topics
    weakTopics.slice(0, 3).forEach(weak => {
      recommendations.push({
        type: 'learning',
        priority: 'high',
        topicId: weak.topicId,
        action: 'study_concept',
        message: 'Review fundamentals before practice'
      });
    });

    return recommendations;
  }

  _generateInterviewRecommendations(readiness, mastery) {
    const recommendations = [];

    if (readiness.overallScore >= 0.7) {
      recommendations.push({
        type: 'interview',
        priority: 'high',
        action: 'mock_interview',
        message: 'You\'re ready for mock interviews',
        frequency: 'weekly'
      });
    } else {
      recommendations.push({
        type: 'interview',
        priority: 'medium',
        action: 'focused_prep',
        message: 'Continue focused preparation before mock interviews',
        estimatedDaysToReady: 14
      });
    }

    return recommendations;
  }

  _generateAdaptivePathRecommendations(mastery, behavioral, readiness) {
    // Path recommendations based on all signals
    return [{
      type: 'adaptive',
      consistency: behavioral.consistency || 0,
      recommendedStudyMinutesPerDay: this._calculateOptimalStudyTime(behavioral),
      focusAreas: mastery.filter(m => m.masteryScore < 0.5).map(m => m.topicId)
    }];
  }

  async _findProblemsByTopic(topicId, difficulty, count, userId) {
    // Find unsolved problems in weak topic
    const submissions = await UserSubmission.find({ userId }).select('problemId').lean();
    const solvedProblemIds = submissions.map(s => s.problemId.toString());

    return await Problem.find({
      topicTags: topicId,
      difficulty,
      _id: { $nin: solvedProblemIds }
    })
      .limit(count)
      .lean();
  }

  async _getProgressionProblems(userId, mastery, count) {
    const masteryTopics = mastery.filter(m => m.masteryScore >= 0.6);
    if (masteryTopics.length === 0) return [];

    const topic = masteryTopics[0];
    return await this._findProblemsByTopic(topic.topicId, 'hard', count, userId);
  }

  _calculateConsistency(submissions) {
    if (submissions.length < 5) return 0;
    const last7Days = submissions.filter(s => 
      Date.now() - s.submittedAt < 7 * 24 * 60 * 60 * 1000
    );
    return Math.min(last7Days.length / 10, 1);
  }

  _calculateImprovement(submissions) {
    if (submissions.length < 10) return 0;
    const firstHalf = submissions.slice(0, submissions.length / 2);
    const secondHalf = submissions.slice(submissions.length / 2);
    const improvement = 
      (secondHalf.filter(s => s.isCorrect).length / secondHalf.length) -
      (firstHalf.filter(s => s.isCorrect).length / firstHalf.length);
    return improvement;
  }

  _calculateHintDependency(submissions) {
    const withHints = submissions.filter(s => (s.hintsUsed || 0) > 0).length;
    return submissions.length > 0 ? withHints / submissions.length : 0;
  }

  _calculateTimeEfficiency(submissions) {
    const avgTime = submissions.reduce((sum, s) => sum + (s.solutionTimeMs || 0), 0) / submissions.length;
    return Math.min(1, 60000 / Math.max(avgTime, 1)); // Normalized to 60s target
  }

  _daysAgo(date) {
    if (!date) return 999;
    return Math.floor((Date.now() - date) / (24 * 60 * 60 * 1000));
  }

  _calculateOptimalStudyTime(behavioral) {
    const consistency = behavioral.consistency || 0;
    // Recommend 60-180 min based on consistency
    return 60 + consistency * 120;
  }
}

module.exports = RecommendationDecisionService;

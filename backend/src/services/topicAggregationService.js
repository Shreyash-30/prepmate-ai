/**
 * Topic Aggregation Service
 * Aggregates UserSubmission data to UserTopicStats
 * Runs after ingestion batches to compute topic-level telemetry
 * Powers ML feature engineering and user analytics
 */

const UserTopicStats = require('../models/UserTopicStats');
const UserSubmission = require('../models/UserSubmission');
const logger = require('../utils/logger');

class TopicAggregationService {
  /**
   * Aggregate submissions for a user-topic combination
   * @param {ObjectId} userId - User ID
   * @param {ObjectId} topicId - Topic ID
   * @returns {Object} - Updated topic stats
   */
  async aggregateTopicStats(userId, topicId) {
    try {
      // 1. Get all submissions for this user-topic
      const submissions = await UserSubmission.find({
        userId,
        topics: topicId,
      }).lean();

      if (submissions.length === 0) {
        // Create empty stats record
        return await UserTopicStats.findOneAndUpdate(
          { user_id: userId, topic_id: topicId },
          {
            user_id: userId,
            topic_id: topicId,
            total_attempts: 0,
            successful_attempts: 0,
            failed_attempts: 0,
            success_rate: 0,
            last_aggregation_time: new Date(),
          },
          { upsert: true, new: true }
        );
      }

      // 2. Compute aggregated statistics
      const stats = this.computeAggregates(submissions);

      // 3. Compute derived scores
      const consistency_score = this.computeConsistencyScore(submissions);
      const engagement_score = this.computeEngagementScore(submissions);
      const difficulty_adaptation = this.computeDifficultyAdaptation(submissions);

      // 4. Determine mastery trend based on recent performance
      const mastery_trend = this.determineMasteryTrend(submissions);

      // 5. Determine retention level (from spaced repetition urgency)
      const retention_level = this.determineRetentionLevel(submissions);

      // 6. Upsert stats record
      const topicStats = await UserTopicStats.findOneAndUpdate(
        { user_id: userId, topic_id: topicId },
        {
          user_id: userId,
          topic_id: topicId,
          total_attempts: stats.totalAttempts,
          successful_attempts: stats.successfulAttempts,
          failed_attempts: stats.failedAttempts,
          success_rate: stats.success_rate,
          consistency_score,
          engagement_score,
          difficulty_adaptation,
          mastery_trend,
          retention_level,
          attempts_by_difficulty: stats.attemptsByDifficulty,
          success_by_difficulty: stats.successByDifficulty,
          avg_solve_time_seconds: stats.avgSolveTime,
          min_solve_time_seconds: stats.minSolveTime,
          max_solve_time_seconds: stats.maxSolveTime,
          median_solve_time_seconds: stats.medianSolveTime,
          first_attempt_success_rate: stats.firstAttemptSuccessRate,
          retry_count: stats.retryCount,
          avg_retries_per_problem: stats.avgRetriesPerProblem,
          hints_used_total: stats.hintsUsedTotal,
          avg_hints_per_problem: stats.avgHintsPerProblem,
          unique_problems_attempted: stats.uniqueProblems,
          unique_problems_solved: stats.uniqueProblemsSolved,
          last_activity: submissions[submissions.length - 1].lastAttemptTime,
          days_since_last_activity: Math.floor(
            (Date.now() - submissions[submissions.length - 1].lastAttemptTime) / (1000 * 60 * 60 * 24)
          ),
          last_aggregation_time: new Date(),
        },
        { upsert: true, new: true }
      );

      logger.info(`Aggregated topic stats for user ${userId}, topic ${topicId}: ${stats.totalAttempts} attempts`);

      return topicStats;
    } catch (error) {
      logger.error('Error aggregating topic stats:', { userId, topicId, error: error.message });
      throw error;
    }
  }

  /**
   * Compute aggregate statistics from submissions
   * @param {Array} submissions - Array of submissions
   * @returns {Object} - Aggregated stats
   */
  computeAggregates(submissions) {
    const totalAttempts = submissions.length;
    const successfulAttempts = submissions.filter((s) => s.isSolved).length;
    const failedAttempts = totalAttempts - successfulAttempts;
    const success_rate = totalAttempts > 0 ? successfulAttempts / totalAttempts : 0;

    // Attempts by difficulty
    const attemptsByDifficulty = { easy: 0, medium: 0, hard: 0 };
    const successByDifficulty = { easy: 0, medium: 0, hard: 0 };
    const solveTimes = [];
    const uniqueProblems = new Set();
    const solvedProblems = new Set();
    let hintsUsedTotal = 0;
    let firstAttemptSuccesses = 0;
    let totalRetries = 0;

    submissions.forEach((sub) => {
      // Difficulty tracking
      if (attemptsByDifficulty.hasOwnProperty(sub.problemId?.difficulty)) {
        attemptsByDifficulty[sub.problemId?.difficulty] += 1;
        if (sub.isSolved) {
          successByDifficulty[sub.problemId?.difficulty] += 1;
        }
      }

      // Solve time tracking
      if (sub.solveTime) {
        solveTimes.push(sub.solveTime);
      }

      // Unique problem tracking
      if (sub.problemId) {
        uniqueProblems.add(sub.problemId.toString());
        if (sub.isSolved) {
          solvedProblems.add(sub.problemId.toString());
        }
      }

      // Hints tracking
      hintsUsedTotal += sub.hintsUsed || 0;

      // First attempt success tracking
      if (sub.attempts === 1 && sub.isSolved) {
        firstAttemptSuccesses += 1;
      }

      // Retry tracking
      totalRetries += (sub.attempts || 1) - 1;
    });

    // Compute time statistics
    let avgSolveTime = 0;
    let minSolveTime = null;
    let maxSolveTime = null;
    let medianSolveTime = null;

    if (solveTimes.length > 0) {
      avgSolveTime = solveTimes.reduce((a, b) => a + b, 0) / solveTimes.length;
      minSolveTime = Math.min(...solveTimes);
      maxSolveTime = Math.max(...solveTimes);

      const sorted = solveTimes.sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      medianSolveTime =
        sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    return {
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      success_rate,
      attemptsByDifficulty,
      successByDifficulty,
      avgSolveTime,
      minSolveTime,
      maxSolveTime,
      medianSolveTime,
      firstAttemptSuccessRate:
        totalAttempts > 0 ? firstAttemptSuccesses / totalAttempts : 0,
      retryCount: totalRetries,
      avgRetriesPerProblem:
        uniqueProblems.size > 0 ? totalRetries / uniqueProblems.size : 0,
      hintsUsedTotal,
      avgHintsPerProblem:
        uniqueProblems.size > 0 ? hintsUsedTotal / uniqueProblems.size : 0,
      uniqueProblems: uniqueProblems.size,
      uniqueProblemsSolved: solvedProblems.size,
    };
  }

  /**
   * Compute consistency score from submission patterns
   * Prevents luck from inflating mastery estimates
   * @param {Array} submissions - User submissions
   * @returns {Number} - Consistency score (0-1)
   */
  computeConsistencyScore(submissions) {
    if (submissions.length < 2) return submissions.length > 0 && submissions[0].isSolved ? 0.5 : 0;

    // Group by problem
    const problemAttempts = {};

    submissions.forEach((sub) => {
      const pid = sub.problemId?.toString() || 'unknown';
      if (!problemAttempts[pid]) {
        problemAttempts[pid] = [];
      }
      problemAttempts[pid].push(sub.isSolved ? 1 : 0);
    });

    // Calculate consistency per problem (variance in success)
    let totalConsistency = 0;
    let problemCount = 0;

    Object.values(problemAttempts).forEach((attempts) => {
      if (attempts.length > 1) {
        const mean = attempts.reduce((a, b) => a + b, 0) / attempts.length;
        const variance = attempts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / attempts.length;
        // Consistency = 1 - variance (high variance = low consistency)
        totalConsistency += 1 - variance;
        problemCount += 1;
      }
    });

    return problemCount > 0 ? totalConsistency / problemCount : 0.5;
  }

  /**
   * Compute engagement score from recency and frequency
   * @param {Array} submissions - User submissions
   * @returns {Number} - Engagement score (0-1)
   */
  computeEngagementScore(submissions) {
    if (submissions.length === 0) return 0;

    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    const lastActivity = submissions[submissions.length - 1].lastAttemptTime;
    const daysSinceActivity = (now - lastActivity) / dayInMs;

    // Recency factor (decay over time)
    let recencyFactor = Math.max(0, 1 - daysSinceActivity / 30); // 30-day decay

    // Frequency factor (submissions in last 7 days)
    const recentSubmissions = submissions.filter(
      (s) => (now - s.lastAttemptTime) / dayInMs <= 7
    ).length;
    const frequencyFactor = Math.min(1, recentSubmissions / 7);

    return (recencyFactor + frequencyFactor) / 2;
  }

  /**
   * Compute difficulty adaptation score
   * @param {Array} submissions - User submissions
   * @returns {Number} - Difficulty adaptation (-1 to 1)
   */
  computeDifficultyAdaptation(submissions) {
    if (submissions.length < 5) return 0; // Need enough data

    // Split into first half and second half
    const midpoint = Math.floor(submissions.length / 2);
    const firstHalf = submissions.slice(0, midpoint);
    const secondHalf = submissions.slice(midpoint);

    // Compute average difficulty progression
    const difficultyMap = { easy: 1, medium: 2, hard: 3 };

    const avgFirstHalf =
      firstHalf.reduce((sum, s) => sum + (difficultyMap[s.problemId?.difficulty] || 2), 0) /
      firstHalf.length;
    const avgSecondHalf =
      secondHalf.reduce((sum, s) => sum + (difficultyMap[s.problemId?.difficulty] || 2), 0) /
      secondHalf.length;

    // Positive = tackling harder problems, Negative = regressing
    return Math.min(1, Math.max(-1, (avgSecondHalf - avgFirstHalf) / 2));
  }

  /**
   * Determine mastery trend from recent attempts
   * @param {Array} submissions - User submissions
   * @returns {String} - Trend: improving, stable, declining
   */
  determineMasteryTrend(submissions) {
    if (submissions.length < 5) {
      return 'stable';
    }

    // Look at last 5 vs previous 5
    const recent5 = submissions.slice(-5).filter((s) => s.isSolved).length;
    const previous5 =
      submissions.length >= 10
        ? submissions.slice(-10, -5).filter((s) => s.isSolved).length
        : 3; // Default if not enough data

    if (recent5 > previous5 + 1) return 'improving';
    if (recent5 < previous5 - 1) return 'declining';
    return 'stable';
  }

  /**
   * Determine retention level based on time since last activity
   * @param {Array} submissions - User submissions
   * @returns {String} - Level: critical, high, medium, low
   */
  determineRetentionLevel(submissions) {
    if (submissions.length === 0) return 'low';

    const lastActivity = submissions[submissions.length - 1].lastAttemptTime;
    const daysSince = (Date.now() - lastActivity) / (1000 * 60 * 60 * 24);

    if (daysSince > 14) return 'critical';
    if (daysSince > 7) return 'high';
    if (daysSince > 2) return 'medium';
    return 'low';
  }

  /**
   * Batch aggregate topics for user after ingestion
   * @param {ObjectId} userId - User ID
   * @param {Array} topicIds - Topic IDs to aggregate
   * @returns {Array} - Array of updated topic stats
   */
  async batchAggregateUserTopics(userId, topicIds) {
    try {
      const results = [];

      for (const topicId of topicIds) {
        try {
          const stats = await this.aggregateTopicStats(userId, topicId);
          results.push(stats);
        } catch (error) {
          logger.warn(
            `Failed to aggregate topic ${topicId} for user ${userId}:`,
            error.message
          );
        }
      }

      logger.info(`Batch aggregated ${results.length} topics for user ${userId}`);
      return results;
    } catch (error) {
      logger.error('Error in batchAggregateUserTopics:', error);
      throw error;
    }
  }

  /**
   * Aggregate all topics for a user (full recalculation)
   * @param {ObjectId} userId - User ID
   * @returns {Array} - Updated stats for all topics
   */
  async aggregateAllUserTopics(userId) {
    try {
      // Get all unique topics for this user
      const submissions = await UserSubmission.find({ userId }).select('topics').lean();

      const topicSet = new Set();

      submissions.forEach((sub) => {
        if (sub.topics && Array.isArray(sub.topics)) {
          sub.topics.forEach((t) => topicSet.add(t.toString()));
        }
      });

      const topicIds = Array.from(topicSet);
      return await this.batchAggregateUserTopics(userId, topicIds);
    } catch (error) {
      logger.error('Error in aggregateAllUserTopics:', error);
      throw error;
    }
  }

  /**
   * Get user topic stats for analytics
   * @param {ObjectId} userId - User ID
   * @param {Number} limit - Limit results
   * @returns {Array} - User topic stats sorted by strength
   */
  async getUserTopicStats(userId, limit = 20) {
    try {
      return await UserTopicStats.find({ user_id: userId })
        .sort({ estimated_mastery: -1 })
        .limit(limit)
        .populate('topic_id', 'name')
        .lean();
    } catch (error) {
      logger.error('Error getting user topic stats:', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get weak topics for user
   * @param {ObjectId} userId - User ID
   * @param {Number} limit - Limit results
   * @returns {Array} - Topics with lowest mastery
   */
  async getWeakTopics(userId, limit = 10) {
    try {
      return await UserTopicStats.find({ user_id: userId })
        .sort({ estimated_mastery: 1 })
        .limit(limit)
        .populate('topic_id', 'name')
        .lean();
    } catch (error) {
      logger.error('Error getting weak topics:', { userId, error: error.message });
      throw error;
    }
  }
}

module.exports = new TopicAggregationService();

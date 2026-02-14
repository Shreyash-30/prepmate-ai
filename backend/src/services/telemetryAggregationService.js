/**
 * Telemetry Aggregation Service
 * Aggregates and processes ingested data after sync completion
 * Triggers AI pipeline and updates user statistics
 */

const UserSubmission = require('../models/UserSubmission');
const UserContest = require('../models/UserContest');
const UserTopicStats = require('../models/UserTopicStats');
const Problem = require('../models/Problem');
const RoadmapTopicProblem = require('../models/RoadmapTopicProblem');
const topicMappingService = require('./topicMappingService');
const aiTelemetryBridgeService = require('./aiTelemetryBridgeService');
const pciComputationService = require('./pciComputationService');
const logger = require('../utils/logger');

class TelemetryAggregationService {
  /**
   * Aggregate sync results after ingestion
   * Processes submissions, updates statistics, triggers AI
   * @param {Object} syncResult - Result from sync service
   * @param {ObjectId} userId - User ID
   * @returns {Object} - Aggregation result
   */
  async aggregateSyncResults(syncResult, userId) {
    try {
      logger.info(`Aggregating sync results for user ${userId}`);

      const aggregation = {
        startTime: new Date(),
        userId,
        stats: {
          submissionsProcessed: 0,
          contestsProcessed: 0,
          topicStatsUpdated: 0,
          problemsMapped: 0,
          errors: [],
        },
        tasks: [],
      };

      // 1. Calculate submission statistics
      aggregation.submissionStats = await this.calculateSubmissionStats(userId);
      aggregation.stats.submissionsProcessed = aggregation.submissionStats.total;

      // 2. Process contest data
      aggregation.contestStats = await this.calculateContestStats(userId);
      aggregation.stats.contestsProcessed = aggregation.contestStats.total;

      // 3. Update topic statistics
      const topicUpdateResult = await this.updateTopicStatistics(userId);
      aggregation.stats.topicStatsUpdated = topicUpdateResult.updated;

      // 4. Map problems to topics
      const mappingResult = await this.mapProblesToTopics(userId);
      aggregation.stats.problemsMapped = mappingResult.mapped;

      // 5. Trigger AI pipeline
      try {
        await this.triggerAIPipeline(userId);
        aggregation.tasks.push('ai_pipeline_triggered');
      } catch (error) {
        aggregation.stats.errors.push({
          task: 'ai_pipeline',
          error: error.message,
        });
      }

      // 6. Trigger PCI computation
      try {
        await this.triggerPCIComputation(userId);
        aggregation.tasks.push('pci_computation_triggered');
      } catch (error) {
        aggregation.stats.errors.push({
          task: 'pci_computation',
          error: error.message,
        });
      }

      aggregation.endTime = new Date();
      aggregation.durationMs = aggregation.endTime - aggregation.startTime;

      logger.info('✅ Sync aggregation complete:', aggregation.stats);

      return aggregation;
    } catch (error) {
      logger.error('Error aggregating sync results:', error);
      throw error;
    }
  }

  /**
   * Calculate submission statistics
   * @param {ObjectId} userId
   * @returns {Promise<Object>}
   */
  async calculateSubmissionStats(userId) {
    try {
      const submissions = await UserSubmission.find({ userId });

      if (submissions.length === 0) {
        return {
          total: 0,
          accepted: 0,
          successRate: 0,
          byPlatform: {},
          byDifficulty: {},
        };
      }

      // Count by verdict
      const verdictCounts = {};
      const platformCounts = {};
      const difficultyCounts = {};
      let totalSolveTime = 0;
      let averageAttempts = 0;

      submissions.forEach(sub => {
        // Count by verdict
        verdictCounts[sub.verdict] = (verdictCounts[sub.verdict] || 0) + 1;

        // Count by platform
        platformCounts[sub.platform] = (platformCounts[sub.platform] || 0) + 1;

        // Count by difficulty
        if (sub.problemId?.difficulty) {
          difficultyCounts[sub.problemId.difficulty] = (difficultyCounts[sub.problemId.difficulty] || 0) + 1;
        }

        // Aggregate metrics
        totalSolveTime += sub.solveTime || 0;
        averageAttempts += sub.attempts || 1;
      });

      return {
        total: submissions.length,
        accepted: verdictCounts.accepted || 0,
        successRate: ((verdictCounts.accepted || 0) / submissions.length * 100).toFixed(2),
        verdictCounts,
        byPlatform: platformCounts,
        byDifficulty: difficultyCounts,
        averageSolveTime: Math.round(totalSolveTime / submissions.length),
        averageAttempts: (averageAttempts / submissions.length).toFixed(2),
      };
    } catch (error) {
      logger.error('Error calculating submission stats:', error);
      throw error;
    }
  }

  /**
   * Calculate contest statistics
   * @param {ObjectId} userId
   * @returns {Promise<Object>}
   */
  async calculateContestStats(userId) {
    try {
      const contests = await UserContest.find({ userId });

      if (contests.length === 0) {
        return {
          total: 0,
          avgRank: 0,
          avgPercentile: 0,
          byPlatform: {},
        };
      }

      const platformCounts = {};
      let totalRank = 0;
      let totalPercentile = 0;
      let validRanks = 0;
      let validPercentiles = 0;

      contests.forEach(contest => {
        platformCounts[contest.platform] = (platformCounts[contest.platform] || 0) + 1;

        if (contest.rank) {
          totalRank += contest.rank;
          validRanks++;
        }

        if (contest.percentileRank) {
          totalPercentile += contest.percentileRank;
          validPercentiles++;
        }
      });

      return {
        total: contests.length,
        avgRank: validRanks > 0 ? Math.round(totalRank / validRanks) : 0,
        avgPercentile: validPercentiles > 0 ? Math.round(totalPercentile / validPercentiles) : 0,
        byPlatform: platformCounts,
      };
    } catch (error) {
      logger.error('Error calculating contest stats:', error);
      throw error;
    }
  }

  /**
   * Update topic statistics based on submissions
   * @param {ObjectId} userId
   * @returns {Promise<Object>}
   */
  async updateTopicStatistics(userId) {
    try {
      const submissions = await UserSubmission.find({ userId }).populate('problemId');

      const topicUpdates = new Map();

      // Aggregate by topic
      for (const submission of submissions) {
        if (!submission.problemId) continue;

        const mappings = await RoadmapTopicProblem.find({
          problemId: submission.problemId._id,
        });

        for (const mapping of mappings) {
          if (!topicUpdates.has(mapping.topicId.toString())) {
            topicUpdates.set(mapping.topicId.toString(), {
              topicId: mapping.topicId,
              total: 0,
              solved: 0,
              avgSolveTime: 0,
            });
          }

          const stats = topicUpdates.get(mapping.topicId.toString());
          stats.total += 1;

          if (submission.isSolved) {
            stats.solved += 1;
          }

          stats.avgSolveTime += submission.solveTime || 0;
        }
      }

      // Write updates
      let updated = 0;

      for (const [topicIdStr, stats] of topicUpdates.entries()) {
        const avgTime = stats.avgSolveTime / stats.total;
        const successRate = stats.solved / stats.total;

        const userTopicStats = await UserTopicStats.findOneAndUpdate(
          { user_id: userId, topic_id: stats.topicId },
          {
            problems_solved: stats.solved,
            total_attempts: stats.total,
            estimated_mastery: Math.min(1, successRate * 1.2), // Slightly weight towards success
            average_time: Math.round(avgTime),
            last_updated: new Date(),
          },
          { upsert: true, new: true }
        );

        if (userTopicStats) {
          updated++;
        }
      }

      logger.info(`Updated ${updated} topic statistics for user ${userId}`);

      return { updated, topicsProcessed: topicUpdates.size };
    } catch (error) {
      logger.error('Error updating topic statistics:', error);
      throw error;
    }
  }

  /**
   * Map newly ingested problems to topics
   * @param {ObjectId} userId
   * @returns {Promise<Object>}
   */
  async mapProblesToTopics(userId) {
    try {
      // Get recent submissions without topic mappings
      const recentSubmissions = await UserSubmission.find({
        userId,
        topics: { $exists: false },
      })
        .populate('problemId')
        .limit(100);

      if (recentSubmissions.length === 0) {
        return { mapped: 0 };
      }

      let mapped = 0;

      for (const submission of recentSubmissions) {
        if (!submission.problemId) continue;

        try {
          const matchedTopics = await topicMappingService.mapProblemToTopics(
            submission.problemId._id
          );

          if (matchedTopics.length > 0) {
            // Update submission with topic info
            submission.topics = matchedTopics.map(t => t.topicName);
            await submission.save();
            mapped++;
          }
        } catch (error) {
          logger.warn(`Failed to map problem ${submission.problemId._id}:`, error.message);
        }
      }

      logger.info(`Mapped ${mapped} problems to topics for user ${userId}`);

      return { mapped };
    } catch (error) {
      logger.error('Error mapping problems to topics:', error);
      throw error;
    }
  }

  /**
   * Trigger AI mastery and readiness computation
   * @param {ObjectId} userId
   */
  async triggerAIPipeline(userId) {
    try {
      logger.info(`Triggering AI pipeline for user ${userId}`);

      // Prepare and send mastery data to AI service
      const masteryInput = await aiTelemetryBridgeService.prepareMasteryInput(userId);

      if (masteryInput.success) {
        // Call AI service (async, non-blocking)
        aiTelemetryBridgeService.submitMasteryAnalysis(masteryInput)
          .catch(error => {
            logger.error('Failed to submit mastery analysis:', error);
          });
      }

      logger.info('✅ AI pipeline triggered');
    } catch (error) {
      logger.error('Error triggering AI pipeline:', error);
      throw error;
    }
  }

  /**
   * Trigger PCI computation update
   * @param {ObjectId} userId
   */
  async triggerPCIComputation(userId) {
    try {
      logger.info(`Triggering PCI computation for user ${userId}`);

      if (pciComputationService?.computeUserPCI) {
        await pciComputationService.computeUserPCI(userId);
      }

      logger.info('✅ PCI computation triggered');
    } catch (error) {
      logger.error('Error triggering PCI computation:', error);
      throw error;
    }
  }

  /**
   * Get aggregation summary for user
   * @param {ObjectId} userId
   * @returns {Promise<Object>}
   */
  async getAggregationSummary(userId) {
    try {
      const summary = {
        submissions: await this.calculateSubmissionStats(userId),
        contests: await this.calculateContestStats(userId),
        topicStats: await UserTopicStats.find({ user_id: userId }),
      };

      return summary;
    } catch (error) {
      logger.error('Error getting aggregation summary:', error);
      throw error;
    }
  }
}

module.exports = new TelemetryAggregationService();

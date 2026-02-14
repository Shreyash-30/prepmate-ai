/**
 * User Roadmap Progress Service
 * Computes Preparation Completeness Index (PCI)
 * Tracks user progress against roadmap topics
 * Powers adaptive planning and ML features
 */

const UserRoadmapProgress = require('../models/UserRoadmapProgress');
const RoadmapTopic = require('../models/RoadmapTopic');
const UserTopicStats = require('../models/UserTopicStats');
const Roadmap = require('../models/Roadmap');
const logger = require('../utils/logger');

class UserRoadmapProgressService {
  /**
   * PCI Formula: Σ(completed_topic_weight) / Σ(total_topic_weight)
   * Topic completed when: topic_mastery_probability > threshold (default 0.6)
   */
  async computePCI(userId, roadmapId, masteryThreshold = 0.6) {
    try {
      // 1. Get roadmap with all topics
      const roadmap = await Roadmap.findById(roadmapId).populate('topics');

      if (!roadmap) {
        throw new Error(`Roadmap not found: ${roadmapId}`);
      }

      if (!roadmap.topics || roadmap.topics.length === 0) {
        logger.warn(`Roadmap has no topics: ${roadmapId}`);
        return {
          pci_score: 0,
          completed_weight_sum: 0,
          total_weight_sum: 0,
          topics_completed: 0,
          topics_total: 0,
          completion_percentage: 0,
        };
      }

      // 2. Calculate weights for all topics
      let totalWeight = 0;
      let completedWeight = 0;
      let topicsCompleted = 0;
      const topicProgresses = [];

      for (const topic of roadmap.topics) {
        const weight = topic.weight || 1; // Use weight field consistently
        totalWeight += weight;

        // Get user stats for this topic
        const userStats = await UserTopicStats.findOne({
          user_id: userId,
          topic_id: topic._id,
        });

        const estimatedMastery = userStats?.estimated_mastery || 0;
        const isCompleted = estimatedMastery >= masteryThreshold;

        if (isCompleted) {
          completedWeight += weight;
          topicsCompleted += 1;
        }

        topicProgresses.push({
          topicId: topic._id,
          topicName: topic.name,
          weight,
          layer: topic.layer || 'core',
          estimatedMastery,
          isCompleted,
          completionStatus: this.getCompletionStatus(estimatedMastery),
        });
      }

      // 3. Compute PCI score
      const pciScore = totalWeight > 0 ? completedWeight / totalWeight : 0;
      const completionPercentage = (topicsCompleted / roadmap.topics.length) * 100;

      // 4. Store/update progress record
      const progress = await UserRoadmapProgress.findOneAndUpdate(
        { userId, roadmapId },
        {
          userId,
          roadmapId,
          completedWeightSum: completedWeight,
          totalWeightSum: totalWeight,
          pciScore: Math.round(pciScore * 1000) / 1000, // 3 decimal places
          pciScorePercentage: Math.round(completionPercentage),
          topicsCompleted,
          topicsTotal: roadmap.topics.length,
          topicProgresses,
          pciLastUpdated: new Date(),
          masteryThreshold,
        },
        { upsert: true, new: true }
      );

      logger.info(
        `Computed PCI for user ${userId}, roadmap ${roadmapId}: ${(pciScore * 100).toFixed(1)}%`
      );

      return {
        pci_score: pciScore,
        completion_percentage: completionPercentage,
        completed_weight_sum: completedWeight,
        total_weight_sum: totalWeight,
        topics_completed: topicsCompleted,
        topics_total: roadmap.topics.length,
        topic_progresses: topicProgresses,
        last_updated: progress.pciLastUpdated,
      };
    } catch (error) {
      logger.error('Error computing PCI:', { userId, roadmapId, error: error.message });
      throw error;
    }
  }

  /**
   * Compute PCI for all roadmaps for a user
   * @param {ObjectId} userId - User ID
   * @returns {Array} - PCI scores for all user roadmaps
   */
  async computeAllUserRoadmapPCI(userId) {
    try {
      const roadmaps = await Roadmap.find({ is_active: true }).select('_id');

      const results = [];

      for (const roadmap of roadmaps) {
        try {
          const pci = await this.computePCI(userId, roadmap._id);
          results.push({
            roadmap_id: roadmap._id,
            ...pci,
          });
        } catch (error) {
          logger.warn(`Could not compute PCI for roadmap ${roadmap._id}:`, error.message);
        }
      }

      return results;
    } catch (error) {
      logger.error('Error in computeAllUserRoadmapPCI:', error);
      throw error;
    }
  }

  /**
   * Get completion status label
   * @param {Number} mastery - Mastery probability (0-1)
   * @returns {String} - Status label
   */
  getCompletionStatus(mastery) {
    if (mastery >= 0.85) return 'mastered';
    if (mastery >= 0.6) return 'proficient';
    if (mastery >= 0.3) return 'in_progress';
    if (mastery > 0) return 'started';
    return 'not_started';
  }

  /**
   * Get user's roadmap progress
   * @param {ObjectId} userId - User ID
   * @param {ObjectId} roadmapId - Roadmap ID
   * @returns {Object} - User progress with detailed breakdown
   */
  async getUserRoadmapProgress(userId, roadmapId) {
    try {
      let progress = await UserRoadmapProgress.findOne({
        userId,
        roadmapId,
      });

      if (!progress || !progress.pciLastUpdated || this.isProgressStale(progress.pciLastUpdated)) {
        // Recompute if not found or stale (older than 1 hour)
        const computed = await this.computePCI(userId, roadmapId);
        progress = await UserRoadmapProgress.findOne({
          userId,
          roadmapId,
        });
      }

      // Sort topic progresses by layer and weight
      if (progress.topicProgresses) {
        progress.topicProgresses.sort((a, b) => {
          const layerOrder = { core: 0, reinforcement: 1, advanced: 2, optional: 3 };
          const layerDiff =
            (layerOrder[a.layer] || 99) - (layerOrder[b.layer] || 99);
          return layerDiff !== 0 ? layerDiff : b.weight - a.weight;
        });
      }

      return progress;
    } catch (error) {
      logger.error('Error getting user roadmap progress:', { userId, roadmapId, error: error.message });
      throw error;
    }
  }

  /**
   * Check if progress data is stale
   * @param {Date} lastUpdated - Last update timestamp
   * @returns {Boolean} - True if older than 1 hour
   */
  isProgressStale(lastUpdated) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return lastUpdated < oneHourAgo;
  }

  /**
   * Get topic-level progress details
   * @param {ObjectId} userId - User ID
   * @param {ObjectId} roadmapId - Roadmap ID
   * @param {ObjectId} topicId - Topic ID
   * @returns {Object} - Detailed topic progress
   */
  async getTopicProgress(userId, roadmapId, topicId) {
    try {
      const topic = await RoadmapTopic.findOne({
        _id: topicId,
        roadmapId,
      });

      if (!topic) {
        throw new Error(`Topic not found in roadmap: ${topicId}, ${roadmapId}`);
      }

      const userStats = await UserTopicStats.findOne({
        user_id: userId,
        topic_id: topicId,
      });

      const progress = await UserRoadmapProgress.findOne({
        user_id: userId,
        roadmap_id: roadmapId,
      });

      const topicProgreess = progress?.topic_progresses?.find(
        (tp) => tp.topic_id.toString() === topicId.toString()
      );

      return {
        topic: {
          _id: topic._id,
          name: topic.name,
          description: topic.description,
          weight: topic.topic_weight || topic.weight,
          layer: topic.layer,
          estimated_hours: topic.estimatedHours,
        },
        user_stats: userStats || {
          total_attempts: 0,
          successful_attempts: 0,
          success_rate: 0,
          estimated_mastery: 0,
          consistency_score: 0,
        },
        progress: topicProgreess || {
          estimated_mastery: 0,
          is_completed: false,
          completion_status: 'not_started',
        },
      };
    } catch (error) {
      logger.error('Error getting topic progress:', { userId, roadmapId, topicId, error: error.message });
      throw error;
    }
  }

  /**
   * Estimate time to completion
   * @param {ObjectId} userId - User ID
   * @param {ObjectId} roadmapId - Roadmap ID
   * @returns {Object} - Time estimates
   */
  async estimateTimeToCompletion(userId, roadmapId) {
    try {
      const progress = await this.getUserRoadmapProgress(userId, roadmapId);

      if (!progress.topic_progresses) {
        return { estimated_days: 0, estimated_hours: 0 };
      }

      let totalHoursNeeded = 0;
      let completedHours = 0;

      for (const topicProg of progress.topic_progresses) {
        const topic = await RoadmapTopic.findById(topicProg.topic_id);

        if (topic) {
          const hoursNeeded = topic.estimatedHours || 4;
          totalHoursNeeded += hoursNeeded;

          if (topicProg.is_completed) {
            completedHours += hoursNeeded;
          }
        }
      }

      const hoursRemaining = totalHoursNeeded - completedHours;
      const daysEstimate = Math.ceil(hoursRemaining / 2); // Assume 2 hours per day

      return {
        total_hours: totalHoursNeeded,
        completed_hours: completedHours,
        remaining_hours: hoursRemaining,
        estimated_days: daysEstimate,
        estimated_completion_date: new Date(Date.now() + daysEstimate * 24 * 60 * 60 * 1000),
      };
    } catch (error) {
      logger.error('Error estimating time to completion:', { userId, roadmapId, error: error.message });
      throw error;
    }
  }

  /**
   * Get PCI recommendations - what to focus on next
   * @param {ObjectId} userId - User ID
   * @param {ObjectId} roadmapId - Roadmap ID
   * @returns {Array} - Recommended topics to focus on
   */
  async getPCIRecommendations(userId, roadmapId) {
    try {
      const progress = await this.getUserRoadmapProgress(userId, roadmapId);

      if (!progress.topic_progresses) {
        return [];
      }

      // Filter incomplete topics and sort by potential impact
      const recommendations = progress.topic_progresses
        .filter((tp) => !tp.is_completed)
        .sort((a, b) => {
          // Prioritize:
          // 1. Core topics first
          const layerOrder = { core: 0, reinforcement: 1, advanced: 2, optional: 3 };
          const layerDiff =
            (layerOrder[a.layer] || 99) - (layerOrder[b.layer] || 99);
          if (layerDiff !== 0) return layerDiff;

          // 2. Higher weight topics
          return b.weight - a.weight;
        })
        .slice(0, 5); // Top 5 recommendations

      return recommendations;
    } catch (error) {
      logger.error('Error getting PCI recommendations:', { userId, roadmapId, error: error.message });
      throw error;
    }
  }

  /**
   * Recalculate all user PCIs (background job)
   * Used after mastery estimates update from ML engine
   * @param {ObjectId} userId - User ID
   */
  async recalculateUserAllPCIs(userId) {
    try {
      const roadmaps = await Roadmap.find({ is_active: true });
      const results = [];

      for (const roadmap of roadmaps) {
        try {
          const pci = await this.computePCI(userId, roadmap._id);
          results.push({
            roadmap_id: roadmap._id,
            pci_score: pci.pci_score,
            completed_weight_sum: pci.completed_weight_sum,
            total_weight_sum: pci.total_weight_sum,
          });
        } catch (error) {
          logger.warn(`Failed to recalculate PCI for roadmap ${roadmap._id}:`, error.message);
        }
      }

      logger.info(`Recalculated PCI for user ${userId} across ${results.length} roadmaps`);
      return results;
    } catch (error) {
      logger.error('Error in recalculateUserAllPCIs:', error);
      throw error;
    }
  }
}

module.exports = new UserRoadmapProgressService();

/**
 * Telemetry Controller
 * Exposes telemetry aggregation, topic stats, and PCI computation endpoints
 */

const userRoadmapProgressService = require('../services/userRoadmapProgressService');
const topicAggregationService = require('../services/topicAggregationService');
const UserTopicStats = require('../models/UserTopicStats');
const UserRoadmapProgress = require('../models/UserRoadmapProgress');
const logger = require('../utils/logger');

// GET /telemetry/topic-stats/:userId
const getTopicStats = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;

    const stats = await topicAggregationService.getUserTopicStats(userId, parseInt(limit));

    res.json({
      success: true,
      data: {
        user_id: userId,
        topic_count: stats.length,
        stats,
      },
    });
  } catch (error) {
    logger.error('Error in getTopicStats:', error);
    next(error);
  }
};

// GET /telemetry/weak-topics/:userId
const getWeakTopics = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 5 } = req.query;

    const weakTopics = await topicAggregationService.getWeakTopics(userId, parseInt(limit));

    res.json({
      success: true,
      data: {
        user_id: userId,
        weak_topics: weakTopics,
        count: weakTopics.length,
      },
    });
  } catch (error) {
    logger.error('Error in getWeakTopics:', error);
    next(error);
  }
};

// GET /roadmap/pci/:roadmapId
const getRoadmapPCI = async (req, res, next) => {
  try {
    const { roadmapId } = req.params;
    const userId = req.user?.id || req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID required',
      });
    }

    const pciData = await userRoadmapProgressService.computePCI(userId, roadmapId);

    res.json({
      success: true,
      data: {
        user_id: userId,
        roadmap_id: roadmapId,
        ...pciData,
      },
    });
  } catch (error) {
    logger.error('Error in getRoadmapPCI:', error);
    next(error);
  }
};

// GET /roadmap/progress/:roadmapId
const getRoadmapProgress = async (req, res, next) => {
  try {
    const { roadmapId } = req.params;
    const userId = req.user?.id || req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID required',
      });
    }

    const progress = await userRoadmapProgressService.getUserRoadmapProgress(userId, roadmapId);

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress not found',
      });
    }

    res.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    logger.error('Error in getRoadmapProgress:', error);
    next(error);
  }
};

// GET /roadmap/topic/:topicId/:roadmapId
const getTopicProgress = async (req, res, next) => {
  try {
    const { topicId, roadmapId } = req.params;
    const userId = req.user?.id || req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID required',
      });
    }

    const topicProg = await userRoadmapProgressService.getTopicProgress(
      userId,
      roadmapId,
      topicId
    );

    res.json({
      success: true,
      data: topicProg,
    });
  } catch (error) {
    logger.error('Error in getTopicProgress:', error);
    next(error);
  }
};

// GET /roadmap/time-estimate/:roadmapId
const getTimeEstimate = async (req, res, next) => {
  try {
    const { roadmapId } = req.params;
    const userId = req.user?.id || req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID required',
      });
    }

    const estimate = await userRoadmapProgressService.estimateTimeToCompletion(
      userId,
      roadmapId
    );

    res.json({
      success: true,
      data: {
        user_id: userId,
        roadmap_id: roadmapId,
        ...estimate,
      },
    });
  } catch (error) {
    logger.error('Error in getTimeEstimate:', error);
    next(error);
  }
};

// GET /roadmap/recommendations/:roadmapId
const getPCIRecommendations = async (req, res, next) => {
  try {
    const { roadmapId } = req.params;
    const userId = req.user?.id || req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID required',
      });
    }

    const recommendations = await userRoadmapProgressService.getPCIRecommendations(
      userId,
      roadmapId
    );

    res.json({
      success: true,
      data: {
        user_id: userId,
        roadmap_id: roadmapId,
        recommendations,
        count: recommendations.length,
      },
    });
  } catch (error) {
    logger.error('Error in getPCIRecommendations:', error);
    next(error);
  }
};

// POST /sync/state/:platform
const getSyncState = async (req, res, next) => {
  try {
    const { platform } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const UserPlatformSyncState = require('../models/UserPlatformSyncState');

    const syncState = await UserPlatformSyncState.findOne({
      user_id: userId,
      platform,
    });

    res.json({
      success: true,
      data: syncState || {
        user_id: userId,
        platform,
        last_synced_submission_id: null,
        last_synced_timestamp: null,
        last_sync_status: 'pending',
      },
    });
  } catch (error) {
    logger.error('Error in getSyncState:', error);
    next(error);
  }
};

// GET /roadmap/all-pci
const getAllRoadmapPCI = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID required',
      });
    }

    const allPCI = await userRoadmapProgressService.computeAllUserRoadmapPCI(userId);

    res.json({
      success: true,
      data: {
        user_id: userId,
        roadmaps: allPCI,
        count: allPCI.length,
      },
    });
  } catch (error) {
    logger.error('Error in getAllRoadmapPCI:', error);
    next(error);
  }
};

module.exports = {
  getTopicStats,
  getWeakTopics,
  getRoadmapPCI,
  getRoadmapProgress,
  getTopicProgress,
  getTimeEstimate,
  getPCIRecommendations,
  getSyncState,
  getAllRoadmapPCI,
};

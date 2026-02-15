/**
 * Telemetry Controller
 * Exposes telemetry aggregation and topic stats endpoints
 */

const topicAggregationService = require('../services/topicAggregationService');
const UserTopicStats = require('../models/UserTopicStats');
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

// GET /telemetry/sync/state/:platform
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

module.exports = {
  getTopicStats,
  getWeakTopics,
  getSyncState,
};

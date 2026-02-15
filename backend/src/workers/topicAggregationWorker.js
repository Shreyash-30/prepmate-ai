/**
 * Topic Aggregation Worker
 * Background job that runs after ingestion batches
 * Aggregates UserSubmission data to UserTopicStats
 * Updates mastery estimates and retention levels
 */

const BullQueue = require('bull');
const topicAggregationService = require('../services/topicAggregationService');
const UserSubmission = require('../models/UserSubmission');
const logger = require('../utils/logger');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
};

// Create Bull queue for topic aggregation
const topicAggregationQueue = new BullQueue('topic-aggregation', redisConfig);

/**
 * Process topic aggregation job
 * Aggregates submissions for specific user-topic combinations
 */
topicAggregationQueue.process(100, async (job) => {
  try {
    const { userId, topicIds } = job.data;

    logger.info(`[TopicAggregation] Processing user ${userId}, ${topicIds.length} topics`);

    // Aggregate all topics
    const results = await topicAggregationService.batchAggregateUserTopics(
      userId,
      topicIds
    );

    job.progress(100);

    logger.info(
      `[TopicAggregation] Completed: aggregated ${results.length} topics`
    );

    return {
      aggregated_topics: results.length,
      success: true,
    };
  } catch (error) {
    logger.error('[TopicAggregation] Job failed:', error);
    throw error;
  }
});

/**
 * Queue topic aggregation after submission ingestion
 * @param {ObjectId} userId - User ID
 * @param {Array} topicIds - Topic IDs involved in ingestion
 * @param {Object} options - Bull job options
 */
async function scheduleTopicAggregation(userId, topicIds, options = {}) {
  try {
    if (!topicIds || topicIds.length === 0) {
      logger.warn('No topics provided for aggregation');
      return null;
    }

    const defaultOptions = {
      delay: 5000, // 5 second delay to batch submissions
      removeOnComplete: true,
      removeOnFail: false,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    };

    const job = await topicAggregationQueue.add(
      { userId, topicIds },
      { ...defaultOptions, ...options }
    );

    logger.info(`[TopicAggregation] Scheduled job ${job.id} for user ${userId}`);
    return job;
  } catch (error) {
    logger.error('[TopicAggregation] Failed to schedule:', error);
    throw error;
  }
}

/**
 * Full aggregation worker - runs periodically to aggregate all users
 * Used for background maintenance and batch recalculation
 * Triggered daily or on-demand
 */
async function runFullAggregation() {
  try {
    logger.info('[FullAggregation] Starting full topic aggregation');

    // Get all users with recent submissions
    const recentSubmissions = await UserSubmission.find({
      lastAttemptTime: {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    })
      .distinct('userId');

    logger.info(`[FullAggregation] Processing ${recentSubmissions.length} users`);

    let processedCount = 0;
    const batchSize = 10;

    for (let i = 0; i < recentSubmissions.length; i += batchSize) {
      const batch = recentSubmissions.slice(i, i + batchSize);

      const batchPromises = batch.map((userId) =>
        topicAggregationService
          .aggregateAllUserTopics(userId)
          .catch((err) => {
            logger.warn(`Failed to aggregate for user ${userId}:`, err.message);
            return [];
          })
      );

      await Promise.all(batchPromises);
      processedCount += batch.length;

      logger.info(`[FullAggregation] Processed ${processedCount}/${recentSubmissions.length} users`);
    }

    logger.info(`[FullAggregation] Completed aggregation for ${processedCount} users`);

    return {
      users_processed: processedCount,
      success: true,
    };
  } catch (error) {
    logger.error('[FullAggregation] Job failed:', error);
    throw error;
  }
}

/**
 * Set up periodic full aggregation
 * Runs every 6 hours
 */
function initializePeriodicAggregation() {
  const AGGREGATION_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

  setInterval(() => {
    logger.info('[Scheduler] Triggering periodic topic aggregation');
    runFullAggregation().catch((err) => {
      logger.error('[Scheduler] Periodic aggregation failed:', err);
    });
  }, AGGREGATION_INTERVAL);

  logger.info('[Scheduler] Periodic topic aggregation initialized (every 6 hours)');
}

module.exports = {
  topicAggregationQueue,
  scheduleTopicAggregation,
  runFullAggregation,
  initializePeriodicAggregation,
};

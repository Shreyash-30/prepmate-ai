/**
 * Intelligence Orchestration Pipeline Workers
 * 
 * Each worker handles one stage of the intelligence pipeline:
 * 1. masteryUpdateWorker - Compute/update mastery metrics
 * 2. weaknessUpdateWorker - Update weak topic signals based on new mastery
 * 3. revisionUpdateWorker - Generate revision schedule based on weakness
 * 4. readinessRecomputeWorker - Recompute overall readiness score
 * 5. dashboardSnapshotWorker - Refresh dashboard read model
 * 
 * All workers:
 * - Are async and non-blocking
 * - Support retry logic
 * - Emit events for next stage
 * - Handle errors gracefully
 */

const Queue = require('bull');
const logger = require('../utils/logger');
const MasteryMetric = require('../models/MasteryMetric');
const WeakTopicSignal = require('../models/WeakTopicSignal');
const RevisionSchedule = require('../models/RevisionSchedule');
const ReadinessScore = require('../models/ReadinessScore');
const UserDashboardSnapshot = require('../models/UserDashboardSnapshot');
const UserSubmission = require('../models/UserSubmission');
const UserTopicStats = require('../models/UserTopicStats');

const QUEUES_CONFIG = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  }
};

let masteryUpdateQueue = null;
let weaknessUpdateQueue = null;
let revisionUpdateQueue = null;
let readinessRecomputeQueue = null;
let dashboardSnapshotQueue = null;

/**
 * Initialize all workers
 */
function initializeWorkers() {
  try {
    masteryUpdateQueue = new Queue('mastery_update', QUEUES_CONFIG);
    weaknessUpdateQueue = new Queue('weakness_update', QUEUES_CONFIG);
    revisionUpdateQueue = new Queue('revision_update', QUEUES_CONFIG);
    readinessRecomputeQueue = new Queue('readiness_recompute', QUEUES_CONFIG);
    dashboardSnapshotQueue = new Queue('snapshot_refresh', QUEUES_CONFIG);

    logger.info('✅ Intelligence Workers initialized');

    // Setup job processors
    setupMasteryUpdateWorker();
    setupWeaknessUpdateWorker();
    setupRevisionUpdateWorker();
    setupReadinessRecomputeWorker();
    setupDashboardSnapshotWorker();

    return true;
  } catch (error) {
    logger.error(`❌ Worker initialization failed: ${error.message}`);
    throw error;
  }
}

/**
 * WORKER 1: Mastery Update
 * Computes or updates mastery metric for user+topic
 */
function setupMasteryUpdateWorker() {
  masteryUpdateQueue.process(process.env.QUEUE_CONCURRENCY || 5, async (job) => {
    try {
      const { userId, topicId, submissionId, pipelineId } = job.data;

      logger.info(`🔄 [Mastery] Processing pipeline ${pipelineId} for ${userId}/${topicId}`);

      // Get recent submissions for topic
      const submissions = await UserSubmission.find({
        userId,
        topicId,
      })
        .sort({ createdAt: -1 })
        .limit(50);

      if (!submissions.length) {
        logger.warn(`⚠️ No submissions found for ${userId}/${topicId}`);
        return { status: 'no-data' };
      }

      // Compute mastery score
      const correctCount = submissions.filter(s => s.verdict === 'accepted').length;
      const totalCount = submissions.length;
      const masteryScore = totalCount > 0 ? correctCount / totalCount : 0;

      // Update or create mastery metric
      const metric = await MasteryMetric.findOneAndUpdate(
        { userId, topicId },
        {
          userId,
          topicId,
          masteryScore,
          dataPointsCount: submissions.length,
          confidence: Math.min(submissions.length / 10, 1),
          lastUpdated: new Date(),
          sourceRecentSubmissions: submissions.map(s => s._id),
        },
        { upsert: true, new: true }
      );

      logger.info(`✅ [Mastery] Updated mastery score: ${masteryScore.toFixed(2)} (${correctCount}/${totalCount})`);

      job.progress(100);

      return {
        status: 'completed',
        masteryScore,
        correctCount,
        totalCount,
        pipelineId,
      };
    } catch (error) {
      logger.error(`❌ [Mastery] Worker error: ${error.message}`);
      throw error;
    }
  });

  masteryUpdateQueue.on('completed', (job) => {
    logger.info(`✅ [Mastery] Job ${job.id} completed`);
  });

  masteryUpdateQueue.on('failed', (job, error) => {
    logger.error(`❌ [Mastery] Job ${job.id} failed: ${error.message}`);
  });
}

/**
 * WORKER 2: Weakness Update
 * Identifies and records weak topic signals
 */
function setupWeaknessUpdateWorker() {
  weaknessUpdateQueue.process(process.env.QUEUE_CONCURRENCY || 5, async (job) => {
    try {
      const { userId, topicId, pipelineId } = job.data;

      logger.info(`🔄 [Weakness] Processing pipeline ${pipelineId} for ${userId}/${topicId}`);

      // Get mastery metric
      const mastery = await MasteryMetric.findOne({ userId, topicId });

      if (!mastery || mastery.masteryScore >= 0.7) {
        logger.info(`✅ [Weakness] No weak signals needed (mastery: ${mastery?.masteryScore || 0})`);
        return { status: 'no-weaknesses' };
      }

      // Get recent failed submissions
      const failedSubmissions = await UserSubmission.find({
        userId,
        topicId,
        verdict: { $ne: 'accepted' },
      })
        .sort({ createdAt: -1 })
        .limit(10);

      // Identify error patterns
      const errorPatterns = {};
      failedSubmissions.forEach(s => {
        const pattern = this.extractErrorPattern(s);
        errorPatterns[pattern] = (errorPatterns[pattern] || 0) + 1;
      });

      // Create weak signal for each significant pattern
      const signals = [];
      for (const [pattern, count] of Object.entries(errorPatterns)) {
        if (count >= 2) { // Require 2+ occurrences
          const signal = await WeakTopicSignal.findOneAndUpdate(
            { userId, topicId, signalType: 'mistake-cluster', errorPattern: pattern },
            {
              userId,
              topicId,
              signalType: 'mistake-cluster',
              errorPattern: pattern,
              severity: Math.min(count / failedSubmissions.length, 1),
              occurrences: count,
              sourceSubmissions: failedSubmissions.slice(0, count).map(s => s._id),
            },
            { upsert: true, new: true }
          );
          signals.push(signal);
        }
      }

      logger.info(`✅ [Weakness] Created ${signals.length} weakness signals`);

      job.progress(100);

      return {
        status: 'completed',
        signalsCreated: signals.length,
        pipelineId,
      };
    } catch (error) {
      logger.error(`❌ [Weakness] Worker error: ${error.message}`);
      throw error;
    }
  });

  weaknessUpdateQueue.on('failed', (job, error) => {
    logger.error(`❌ [Weakness] Job ${job.id} failed: ${error.message}`);
  });
}

/**
 * WORKER 3: Revision Update
 * Generates/updates revision schedule based on weak signals
 */
function setupRevisionUpdateWorker() {
  revisionUpdateQueue.process(process.env.QUEUE_CONCURRENCY || 5, async (job) => {
    try {
      const { userId, topicId, pipelineId } = job.data;

      logger.info(`🔄 [Revision] Processing pipeline ${pipelineId} for ${userId}/${topicId}`);

      // Get weak signals
      const signals = await WeakTopicSignal.find({
        userId,
        topicId,
      }).sort({ severity: -1 });

      if (!signals.length) {
        logger.info(`✅ [Revision] No revision needed (no weak signals)`);
        return { status: 'no-revision-needed' };
      }

      // Create/update revision schedule
      const revisionSchedule = await RevisionSchedule.findOneAndUpdate(
        { userId, topicId },
        {
          userId,
          topicId,
          scheduledForDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
          priorityLevel: signals[0].severity >= 0.7 ? 'high' : 'medium',
          targetWeakAreas: signals.map(s => s.errorPattern),
          status: 'scheduled',
        },
        { upsert: true, new: true }
      );

      logger.info(`✅ [Revision] Updated revision schedule for ${signals.length} weak areas`);

      job.progress(100);

      return {
        status: 'completed',
        revisionId: revisionSchedule._id,
        weakAreasCount: signals.length,
        pipelineId,
      };
    } catch (error) {
      logger.error(`❌ [Revision] Worker error: ${error.message}`);
      throw error;
    }
  });

  revisionUpdateQueue.on('failed', (job, error) => {
    logger.error(`❌ [Revision] Job ${job.id} failed: ${error.message}`);
  });
}

/**
 * WORKER 4: Readiness Recompute
 * Recomputes overall readiness score aggregating all topics
 */
function setupReadinessRecomputeWorker() {
  readinessRecomputeQueue.process(process.env.QUEUE_CONCURRENCY || 5, async (job) => {
    try {
      const { userId, pipelineId } = job.data;

      logger.info(`🔄 [Readiness] Processing pipeline ${pipelineId} for ${userId}`);

      // Get all mastery metrics for user
      const masteryMetrics = await MasteryMetric.find({ userId });

      if (!masteryMetrics.length) {
        logger.warn(`⚠️ No mastery metrics for ${userId}`);
        return { status: 'no-mastery-data' };
      }

      // Compute aggregate readiness
      const avgMastery = masteryMetrics.reduce((sum, m) => sum + m.masteryScore, 0) / masteryMetrics.length;
      const masteryAboveThreshold = masteryMetrics.filter(m => m.masteryScore >= 0.7).length;
      const masteryPercentage = masteryAboveThreshold / masteryMetrics.length;

      const readinessScore = Math.min(
        (avgMastery * 0.6 + masteryPercentage * 0.4),
        1
      );

      // Determine readiness level
      let readinessLevel = 'not-ready';
      if (readinessScore >= 0.8) readinessLevel = 'interview-ready';
      else if (readinessScore >= 0.65) readinessLevel = 'mostly-ready';
      else if (readinessScore >= 0.5) readinessLevel = 'progressing';
      else if (readinessScore >= 0.3) readinessLevel = 'early-stage';

      // Update readiness score record
      const readiness = await ReadinessScore.findOneAndUpdate(
        { userId },
        {
          userId,
          overallReadinessScore: readinessScore,
          readinessLevel,
          topicsAtMastery: masteryAboveThreshold,
          totalTopics: masteryMetrics.length,
          lastComputedAt: new Date(),
          sourceMetrics: masteryMetrics.map(m => m._id),
        },
        { upsert: true, new: true }
      );

      logger.info(`✅ [Readiness] Readiness score: ${readinessScore.toFixed(2)} (${readinessLevel})`);

      job.progress(100);

      return {
        status: 'completed',
        readinessScore,
        readinessLevel,
        pipelineId,
      };
    } catch (error) {
      logger.error(`❌ [Readiness] Worker error: ${error.message}`);
      throw error;
    }
  });

  readinessRecomputeQueue.on('failed', (job, error) => {
    logger.error(`❌ [Readiness] Job ${job.id} failed: ${error.message}`);
  });
}

/**
 * WORKER 5: Dashboard Snapshot
 * Refreshes the dashboard read model
 */
function setupDashboardSnapshotWorker() {
  dashboardSnapshotQueue.process(process.env.QUEUE_CONCURRENCY || 5, async (job) => {
    try {
      const { userId, reason, pipelineId } = job.data;

      logger.info(`🔄 [Snapshot] Processing pipeline ${pipelineId} for ${userId}`);

      // Gather all data
      const [mastery, readiness, stats, weakTopics] = await Promise.all([
        MasteryMetric.find({ userId }),
        ReadinessScore.findOne({ userId }),
        UserTopicStats.find({ userId }),
        WeakTopicSignal.find({ userId }).sort({ severity: -1 }).limit(5),
      ]);

      if (!mastery.length) {
        logger.warn(`⚠️ No data to snapshot for ${userId}`);
        return { status: 'no-data' };
      }

      // Build mastery distribution
      const masteryDistribution = {
        excellent: mastery.filter(m => m.masteryScore >= 0.8).length / mastery.length,
        good: mastery.filter(m => m.masteryScore >= 0.6 && m.masteryScore < 0.8).length / mastery.length,
        moderate: mastery.filter(m => m.masteryScore >= 0.4 && m.masteryScore < 0.6).length / mastery.length,
        weak: mastery.filter(m => m.masteryScore < 0.4).length / mastery.length,
      };

      // Build weak topics list
      const weakTopicsList = weakTopics.map(w => ({
        topicId: w.topicId,
        topicName: w.topicName,
        masteryScore: mastery.find(m => m.topicId.equals(w.topicId))?.masteryScore || 0,
        signalCount: w.occurrences || 1,
        recommendedAction: 'Review and practice',
        priority: w.severity >= 0.7 ? 'critical' : 'high',
      }));

      // Create/update snapshot
      const snapshot = await UserDashboardSnapshot.findOneAndUpdate(
        { userId },
        {
          userId,
          totalSolved: stats.reduce((sum, s) => sum + (s.totalSolved || 0), 0),
          masteryDistribution,
          weakTopics: weakTopicsList,
          readinessScore: readiness?.overallReadinessScore || 0,
          readinessLevel: readiness?.readinessLevel || 'not-ready',
          consistencyScore: 0.5, // TODO: Compute from practice frequency
          activeTasks: 0, // TODO: Fetch from tasks
          lastUpdated: new Date(),
          refreshedAt: new Date(),
          refreshReason: reason || 'pipeline-complete',
          dataFreshness: 'fresh',
        },
        { upsert: true, new: true }
      );

      logger.info(`✅ [Snapshot] Dashboard snapshot refreshed for ${userId}`);

      job.progress(100);

      return {
        status: 'completed',
        snapshotId: snapshot._id,
        pipelineId,
      };
    } catch (error) {
      logger.error(`❌ [Snapshot] Worker error: ${error.message}`);
      throw error;
    }
  });

  dashboardSnapshotQueue.on('failed', (job, error) => {
    logger.error(`❌ [Snapshot] Job ${job.id} failed: ${error.message}`);
  });
}

/**
 * Helper: Extract error pattern from submission
 */
function extractErrorPattern(submission) {
  // Simplified - in production, parse error output
  if (submission.errorMessage?.includes('compilation')) return 'compilation-error';
  if (submission.errorMessage?.includes('timeout')) return 'time-limit-exceeded';
  if (submission.errorMessage?.includes('runtime')) return 'runtime-error';
  return 'wrong-answer';
}

/**
 * Shutdown all workers
 */
async function shutdownWorkers() {
  try {
    await Promise.all([
      masteryUpdateQueue?.close(),
      weaknessUpdateQueue?.close(),
      revisionUpdateQueue?.close(),
      readinessRecomputeQueue?.close(),
      dashboardSnapshotQueue?.close(),
    ].filter(Boolean));

    logger.info('✅ Intelligence workers shut down');
  } catch (error) {
    logger.error(`❌ Worker shutdown failed: ${error.message}`);
  }
}

module.exports = {
  initializeWorkers,
  shutdownWorkers,
  masteryUpdateQueue: () => masteryUpdateQueue,
  weaknessUpdateQueue: () => weaknessUpdateQueue,
  revisionUpdateQueue: () => revisionUpdateQueue,
  readinessRecomputeQueue: () => readinessRecomputeQueue,
  dashboardSnapshotQueue: () => dashboardSnapshotQueue,
};

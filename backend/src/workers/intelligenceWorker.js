/**
 * Unified Intelligence Update Worker
 * Event-driven pipeline for asynchronous intelligence processing
 * 
 * Flow:
 * 1. Submission created
 * 2. Worker picks up submission event
 * 3. Runs through complete intelligence pipeline
 * 4. Updates all intelligence components asynchronously
 * 5. Updates dashboard cache
 * 6. Triggers notification if insights changed
 */

const Queue = require('bull');
const logger = require('../utils/logger');
const UserSubmission = require('../models/UserSubmission');

// Lazy-load services and queues to avoid initialization order issues
let intelligenceQueue = null;
let mlUpdateQueue = null;
let pipeline = null;
let behavioralExtractor = null;
let profileService = null;
let recommendationEngine = null;
let isInitialized = false;

/**
 * Initialize worker infrastructure
 * Called once to set up queues and services
 */
function initializeWorker() {
  if (isInitialized) return;

  try {
    // Load services only when needed
    const UnifiedIntelligencePipeline = require('../services/intelligenceCore/unifiedIntelligencePipeline');
    const BehavioralFeatureExtractor = require('../services/intelligenceCore/behavioralFeatureExtractor');
    const LearnerIntelligenceProfile = require('../services/intelligenceCore/learnerIntelligenceProfile');
    const RecommendationDecisionService = require('../services/intelligenceCore/recommendationDecisionService');

    // Create queues
    intelligenceQueue = new Queue('intelligence_pipeline', {
      redis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || 6379
      }
    });

    mlUpdateQueue = new Queue('ml_updates', {
      redis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || 6379
      }
    });

    // Create service instances
    pipeline = new UnifiedIntelligencePipeline();
    behavioralExtractor = new BehavioralFeatureExtractor();
    profileService = new LearnerIntelligenceProfile();
    recommendationEngine = new RecommendationDecisionService();

    // Set up queue processors
    setupQueueProcessors();

    isInitialized = true;
    logger.info('[WORKER] Intelligence worker initialized successfully');
  } catch (error) {
    logger.error(`Failed to initialize intelligence worker: ${error.message}`);
    throw error;
  }
}

/**
 * Set up queue processors
 */
function setupQueueProcessors() {
  if (!intelligenceQueue || !mlUpdateQueue) return;

  // Process submission intelligence
  intelligenceQueue.process(async (job) => {
    const { submissionId } = job.data;

    try {
      logger.info(`[WORKER] Processing submission ${submissionId}`);

      // Get submission
      const submission = await UserSubmission.findById(submissionId).populate('problemId');
      if (!submission) {
        throw new Error(`Submission not found: ${submissionId}`);
      }

      // Run full intelligence pipeline
      const result = await pipeline.processSubmissionEvent(submissionId);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Log completion
      logger.info(`[WORKER] ✅ Submission ${submissionId} processed successfully`, {
        userId: submission.userId,
        stages: Object.keys(result.stages),
        durationMs: result.durationMs
      });

      return {
        success: true,
        submissionId,
        userId: submission.userId,
        processedAt: new Date()
      };
    } catch (error) {
      logger.error(`[WORKER] ❌ Error processing submission ${submissionId}: ${error.message}`);
      throw error; // Will trigger retry
    }
  });

  // Process ML batch updates
  mlUpdateQueue.process(5, async (job) => {
    const { userId, force } = job.data;

    try {
      logger.info(`[WORKER] Processing ML batch update for user ${userId}`);

      // Update profile
      const profile = await profileService.recomputeFullProfile(userId);

      logger.info(`[WORKER] ✅ ML batch update completed for user ${userId}`);

      return { success: true, userId, profile };
    } catch (error) {
      logger.error(`[WORKER] ❌ Error in ML batch update for user ${userId}: ${error.message}`);
      throw error;
    }
  });

  // Setup event listeners
  setupEventListeners();
}

/**
 * Queue submission for intelligence processing
 * Called immediately after submission creation
 */
async function queueSubmissionIntelligence(submissionId) {
  try {
    initializeWorker(); // Ensure initialized
    
    const job = await intelligenceQueue.add(
      { submissionId },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: true,
        removeOnFail: false
      }
    );

    logger.info(`[WORKER] Queued submission ${submissionId} for intelligence processing`);
    return job.id;
  } catch (error) {
    logger.error(`Error queuing submission intelligence: ${error.message}`);
    throw error;
  }
}

/**
 * Queue batch ML updates
 * For heavy ML recomputation
 */
async function queueBatchMLUpdate(userId, force = false) {
  try {
    initializeWorker(); // Ensure initialized
    
    const job = await mlUpdateQueue.add(
      { userId, force },
      {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 5000
        },
        removeOnComplete: true,
        priority: force ? 10 : 5, // Higher priority for forced updates
        delay: force ? 0 : 60000 // Delay 1 minute if not forced (batch with others)
      }
    );

    logger.info(`[WORKER] Queued ML update for user ${userId}`);
    return job.id;
  } catch (error) {
    logger.error(`Error queuing ML update: ${error.message}`);
  }
}

/**
 * Delayed recommendation update worker
 * Batches multiple submissions into single recommendation computation
 */
async function scheduleRecommendationRefresh(userId) {
  try {
    initializeWorker(); // Ensure initialized
    
    // Debounce - only schedule if not already scheduled
    const existing = await intelligenceQueue.getJobs(['waiting', 'delayed']);
    const alreadyQueued = existing.some(job => job.data?.userId === userId && job.data?.type === 'recommendation_refresh');

    if (alreadyQueued) {
      logger.debug(`[WORKER] Recommendation refresh already queued for user ${userId}`);
      return;
    }

    await intelligenceQueue.add(
      {
        type: 'recommendation_refresh',
        userId
      },
      {
        delay: 30000, // Debounce - wait 30s to batch submissions
        removeOnComplete: true
      }
    );

    logger.info(`[WORKER] Scheduled recommendation refresh for user ${userId}`);
  } catch (error) {
    logger.error(`Error scheduling recommendation refresh: ${error.message}`);
  }
}

/**
 * Interview processing worker
 * For interview session intelligence analysis
 */
async function queueInterviewIntelligence(interviewSessionId) {
  try {
    initializeWorker(); // Ensure initialized
    
    const job = await intelligenceQueue.add(
      {
        type: 'interview',
        interviewSessionId
      },
      {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 3000
        },
        removeOnComplete: true,
        priority: 8 // Higher priority than regular submissions
      }
    );

    logger.info(`[WORKER] Queued interview ${interviewSessionId} for intelligence processing`);
    return job.id;
  } catch (error) {
    logger.error(`Error queuing interview intelligence: ${error.message}`);
  }
}

/**
 * Batch recomputation worker
 * Triggered periodically or on-demand
 */
async function queueBatchUserRecompute(userId) {
  try {
    initializeWorker(); // Ensure initialized
    
    await intelligenceQueue.add(
      {
        type: 'batch_recompute',
        userId
      },
      {
        attempts: 2,
        removeOnComplete: true,
        priority: 1 // Low priority - background task
      }
    );

    logger.info(`[WORKER] Queued batch recompute for user ${userId}`);
  } catch (error) {
    logger.error(`Error queuing batch recompute: ${error.message}`);
  }
}

/**
 * Setup event listeners
 * Call this after queues are initialized
 */
function setupEventListeners() {
  if (!intelligenceQueue || !mlUpdateQueue) return;

  intelligenceQueue.on('completed', (job, result) => {
    logger.debug(`[WORKER] Job ${job.id} completed`, result);
  });

  intelligenceQueue.on('failed', (job, error) => {
    logger.error(`[WORKER] Job ${job.id} failed: ${error.message}`);
  });

  intelligenceQueue.on('error', (error) => {
    logger.error(`[WORKER] Queue error: ${error.message}`);
  });

  mlUpdateQueue.on('completed', (job, result) => {
    logger.debug(`[ML WORKER] Job ${job.id} completed`);
  });

  mlUpdateQueue.on('failed', (job, error) => {
    logger.error(`[ML WORKER] Job ${job.id} failed: ${error.message}`);
  });
}

/**
 * Health check
 */
async function getWorkerStatus() {
  try {
    initializeWorker(); // Ensure initialized
    
    const counts = await intelligenceQueue.getJobCounts();
    const mlCounts = await mlUpdateQueue.getJobCounts();

    return {
      intelligencePipeline: {
        queue: 'intelligence_pipeline',
        ...counts
      },
      mlUpdates: {
        queue: 'ml_updates',
        ...mlCounts
      },
      timestamp: new Date()
    };
  } catch (error) {
    logger.error(`Error getting worker status: ${error.message}`);
    return { error: error.message };
  }
}

/**
 * Graceful shutdown
 */
async function shutdown() {
  try {
    logger.info('[WORKER] Shutting down workers...');
    
    if (intelligenceQueue) {
      await intelligenceQueue.close();
    }
    if (mlUpdateQueue) {
      await mlUpdateQueue.close();
    }
    
    logger.info('[WORKER] ✅ Workers shut down successfully');
  } catch (error) {
    logger.error(`Error during worker shutdown: ${error.message}`);
  }
}

module.exports = {
  // Initialization
  initializeWorker,
  
  // Queue functions
  queueSubmissionIntelligence,
  queueInterviewIntelligence,
  queueBatchMLUpdate,
  queueBatchUserRecompute,
  scheduleRecommendationRefresh,
  
  // Management
  getWorkerStatus,
  shutdown,
  
  // Lazy-loaded queues (available after initializeWorker is called)
  get intelligenceQueue() {
    initializeWorker();
    return intelligenceQueue;
  },
  get mlUpdateQueue() {
    initializeWorker();
    return mlUpdateQueue;
  }
};

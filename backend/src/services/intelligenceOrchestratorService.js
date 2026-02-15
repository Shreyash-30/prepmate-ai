/**
 * Intelligence Orchestration Service
 * 
 * Event-driven orchestration pipeline:
 * 
 * submission_processed_event
 *     → update_mastery
 *         → update_weak_topic_signals
 *             → update_revision_schedule
 *                 → recompute_readiness
 *                     → refresh_dashboard_snapshot
 *                         → emit dashboard_snapshot_refresh_event
 * 
 * Responsibilities:
 * - Coordinate multi-stage intelligence updates
 * - Enqueue jobs to BullMQ workers (NOT synchronous)
 * - Ensure idempotency with dedup keys
 * - Implement retry-safe job handling
 * - Emit completion events
 * 
 * Used by: Controllers, Workers, Event Listeners
 */

const Queue = require('bull');
const crypto = require('crypto');
const logger = require('../utils/logger');

// Lazy-loaded queues to avoid circular dependencies
let intelligenceQueue = null;
let masteryUpdateQueue = null;
let weaknessUpdateQueue = null;
let revisionUpdateQueue = null;
let readinessRecomputeQueue = null;
let snapshotRefreshQueue = null;

const QUEUES_CONFIG = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  }
};

// Dedup storage (Redis would be ideal, using in-memory for now)
const dedupKeys = new Map();
const DEDUP_WINDOW_MS = 5000; // 5 second dedup window

class IntelligenceOrchestratorService {
  /**
   * Initialize orchestra
   * Sets up all queues and listeners
   */
  static initialize() {
    try {
      intelligenceQueue = new Queue('intelligence_orchestration', QUEUES_CONFIG);
      masteryUpdateQueue = new Queue('mastery_update', QUEUES_CONFIG);
      weaknessUpdateQueue = new Queue('weakness_update', QUEUES_CONFIG);
      revisionUpdateQueue = new Queue('revision_update', QUEUES_CONFIG);
      readinessRecomputeQueue = new Queue('readiness_recompute', QUEUES_CONFIG);
      snapshotRefreshQueue = new Queue('snapshot_refresh', QUEUES_CONFIG);

      logger.info('✅ Intelligence Orchestrator initialized with 6 queues');

      // Set up inter-queue listeners for pipeline progression
      this.setupPipelineListeners();

      return true;
    } catch (error) {
      logger.error(`❌ Intelligence Orchestrator initialization failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * MAIN ENTRY POINT: Trigger complete intelligence pipeline
   * 
   * Called after:
   * - Submission processed
   * - Practice session completed
   * - Interview completed
   * - Manual user action
   * 
   * @param {ObjectId} userId
   * @param {ObjectId} topicId
   * @param {ObjectId} submissionId
   * @param {string} eventType - 'submission' | 'practice' | 'interview' | 'manual'
   * @returns {Promise<{pipelineId, stages}>}
   */
  static async triggerIntelligencePipeline(userId, topicId, submissionId, eventType = 'submission') {
    try {
      if (!intelligenceQueue) this.initialize();

      // Generate idempotency key to avoid duplicate recomputes
      const dedupKey = this.generateDedupKey(userId, topicId, eventType);
      if (this.isDuplicate(dedupKey)) {
        logger.warn(`⚠️ Duplicate pipeline trigger ignored for ${userId}/${topicId}`);
        return { success: false, reason: 'duplicate' };
      }

      // Track this dedup key
      this.recordDedup(dedupKey);

      const pipelineId = crypto.randomUUID();

      logger.info(`🚀 Starting intelligence pipeline: ${pipelineId}`);
      logger.info(`   Event: ${eventType} | User: ${userId} | Topic: ${topicId}`);

      // Stage 1: Enqueue mastery update
      const masteryJob = await this.enqueueMasteryUpdate({
        pipelineId,
        userId,
        topicId,
        submissionId,
        eventType,
        dedupKey,
      });

      return {
        success: true,
        pipelineId,
        startedAt: new Date(),
        stages: ['mastery-update', 'weakness-update', 'revision-update', 'readiness-recompute', 'snapshot-refresh'],
        masteryJobId: masteryJob.id,
      };
    } catch (error) {
      logger.error(`❌ Pipeline trigger failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Stage 1: Enqueue mastery update
   * Computes updated mastery metric for userId + topicId
   */
  static async enqueueMasteryUpdate(payload) {
    try {
      if (!masteryUpdateQueue) this.initialize();

      const job = await masteryUpdateQueue.add(payload, {
        jobId: `mastery-${payload.pipelineId}`,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        timeout: 30000,
        removeOnComplete: true,
        removeOnFail: false,
        priority: 10, // High priority
      });

      logger.info(`📌 Mastery update enqueued: Job ${job.id}`);
      return job;
    } catch (error) {
      logger.error(`❌ Mastery enqueue failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Stage 2: Enqueue weakness update
   * Triggered by mastery worker after completion
   */
  static async enqueueWeaknessUpdate(payload) {
    try {
      if (!weaknessUpdateQueue) this.initialize();

      const job = await weaknessUpdateQueue.add(payload, {
        jobId: `weakness-${payload.pipelineId}`,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        timeout: 30000,
        removeOnComplete: true,
        removeOnFail: false,
        priority: 9,
      });

      logger.info(`📌 Weakness update enqueued: Job ${job.id}`);
      return job;
    } catch (error) {
      logger.error(`❌ Weakness enqueue failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Stage 3: Enqueue revision update
   * Triggered by weakness worker
   */
  static async enqueueRevisionUpdate(payload) {
    try {
      if (!revisionUpdateQueue) this.initialize();

      const job = await revisionUpdateQueue.add(payload, {
        jobId: `revision-${payload.pipelineId}`,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        timeout: 30000,
        removeOnComplete: true,
        removeOnFail: false,
        priority: 8,
      });

      logger.info(`📌 Revision update enqueued: Job ${job.id}`);
      return job;
    } catch (error) {
      logger.error(`❌ Revision enqueue failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Stage 4: Enqueue readiness recompute
   * Triggered by revision worker
   */
  static async enqueueReadinessRecompute(payload) {
    try {
      if (!readinessRecomputeQueue) this.initialize();

      const job = await readinessRecomputeQueue.add(payload, {
        jobId: `readiness-${payload.pipelineId}`,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        timeout: 30000,
        removeOnComplete: true,
        removeOnFail: false,
        priority: 7,
      });

      logger.info(`📌 Readiness recompute enqueued: Job ${job.id}`);
      return job;
    } catch (error) {
      logger.error(`❌ Readiness enqueue failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Stage 5: Enqueue dashboard snapshot refresh
   * Final stage - refreshes read model after all updates
   */
  static async enqueueSnapshotRefresh(payload) {
    try {
      if (!snapshotRefreshQueue) this.initialize();

      const job = await snapshotRefreshQueue.add(payload, {
        jobId: `snapshot-${payload.pipelineId}`,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        timeout: 30000,
        removeOnComplete: true,
        removeOnFail: false,
        priority: 5, // Lower priority - can batch
      });

      logger.info(`📌 Snapshot refresh enqueued: Job ${job.id}`);
      return job;
    } catch (error) {
      logger.error(`❌ Snapshot enqueue failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Monitor pipeline progress
   */
  static async getPipelineStatus(pipelineId) {
    try {
      if (!intelligenceQueue) this.initialize();

      const countsPerQueue = await Promise.all([
        masteryUpdateQueue.getJob(`mastery-${pipelineId}`),
        weaknessUpdateQueue.getJob(`weakness-${pipelineId}`),
        revisionUpdateQueue.getJob(`revision-${pipelineId}`),
        readinessRecomputeQueue.getJob(`readiness-${pipelineId}`),
        snapshotRefreshQueue.getJob(`snapshot-${pipelineId}`),
      ]);

      return {
        pipelineId,
        stages: {
          mastery: countsPerQueue[0]?.getState?.() || 'pending',
          weakness: countsPerQueue[1]?.getState?.() || 'pending',
          revision: countsPerQueue[2]?.getState?.() || 'pending',
          readiness: countsPerQueue[3]?.getState?.() || 'pending',
          snapshot: countsPerQueue[4]?.getState?.() || 'pending',
        },
      };
    } catch (error) {
      logger.error(`❌ Pipeline status check failed: ${error.message}`);
      return { error: error.message };
    }
  }

  /**
   * Setup listeners for pipeline stages
   * Automatically triggers next stage when previous completes
   */
  static setupPipelineListeners() {
    try {
      if (!masteryUpdateQueue) return; // Not initialized yet

      // When mastery update completes, trigger weakness update
      masteryUpdateQueue.on('completed', async (job) => {
        try {
          const { pipelineId, userId } = job.data;
          await this.enqueueWeaknessUpdate({
            pipelineId,
            userId,
            masteryJobId: job.id,
          });
        } catch (error) {
          logger.error(`❌ Auto-trigger weakness failed: ${error.message}`);
        }
      });

      // When weakness update completes, trigger revision update
      weaknessUpdateQueue.on('completed', async (job) => {
        try {
          const { pipelineId, userId } = job.data;
          await this.enqueueRevisionUpdate({
            pipelineId,
            userId,
            weaknessJobId: job.id,
          });
        } catch (error) {
          logger.error(`❌ Auto-trigger revision failed: ${error.message}`);
        }
      });

      // When revision update completes, trigger readiness recompute
      revisionUpdateQueue.on('completed', async (job) => {
        try {
          const { pipelineId, userId } = job.data;
          await this.enqueueReadinessRecompute({
            pipelineId,
            userId,
            revisionJobId: job.id,
          });
        } catch (error) {
          logger.error(`❌ Auto-trigger readiness failed: ${error.message}`);
        }
      });

      // When readiness recomputes, trigger snapshot refresh
      readinessRecomputeQueue.on('completed', async (job) => {
        try {
          const { pipelineId, userId } = job.data;
          await this.enqueueSnapshotRefresh({
            pipelineId,
            userId,
            readinessJobId: job.id,
            reason: 'pipeline-complete',
          });
        } catch (error) {
          logger.error(`❌ Auto-trigger snapshot failed: ${error.message}`);
        }
      });

      // When snapshot refreshes, emit completion event
      snapshotRefreshQueue.on('completed', (job) => {
        logger.info(`✅ Pipeline ${job.data.pipelineId} completed`);
        // TODO: Emit dashboard_snapshot_refresh_event via WebSocket/EventEmitter
      });

      logger.info('✅ Pipeline stage listeners configured');
    } catch (error) {
      logger.error(`❌ Listener setup failed: ${error.message}`);
    }
  }

  /**
   * Deduplication helpers
   */
  static generateDedupKey(userId, topicId, eventType) {
    const data = `${userId}-${topicId}-${eventType}`;
    return crypto.createHash('md5').update(data).digest('hex');
  }

  static isDuplicate(dedupKey) {
    return dedupKeys.has(dedupKey);
  }

  static recordDedup(dedupKey) {
    dedupKeys.set(dedupKey, Date.now());
    // Clean up old entries
    setTimeout(() => {
      dedupKeys.delete(dedupKey);
    }, DEDUP_WINDOW_MS);
  }

  /**
   * Shutdown orchestrator
   */
  static async shutdown() {
    try {
      const queues = [
        intelligenceQueue,
        masteryUpdateQueue,
        weaknessUpdateQueue,
        revisionUpdateQueue,
        readinessRecomputeQueue,
        snapshotRefreshQueue,
      ].filter(q => q);

      await Promise.all(queues.map(q => q.close()));
      logger.info('✅ Intelligence Orchestrator shut down');
    } catch (error) {
      logger.error(`❌ Shutdown failed: ${error.message}`);
    }
  }
}

module.exports = IntelligenceOrchestratorService;

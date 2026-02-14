/**
 * Sync Queue Service
 * Manages background sync jobs with retry logic and exponential backoff
 * Uses Bull for queue management (requires Redis) or falls back to file-based queue
 */

const Queue = require('bull');
const codeforcesSyncService = require('./codeforcesSyncService');
const leetcodeSyncService = require('./leetcodeSyncService');
const hackerrankSyncService = require('./hackerrankSyncService');
const geeksforGeeksSyncService = require('./geeksforGeeksSyncService');
const manualUploadService = require('./manualUploadService');
const telemetryAggregationService = require('./telemetryAggregationService');
const SyncLog = require('../models/SyncLog');
const IntegrationMetadata = require('../models/IntegrationMetadata');

// Redis configuration with fallback
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
};

class SyncQueueService {
  constructor() {
    this.queues = {};
    this.initialized = false;
  }

  /**
   * Initialize queue service
   */
  async initialize() {
    try {
      // Create queues for each platform
      const platforms = ['codeforces', 'leetcode', 'hackerrank', 'geeksforgeeks', 'manual'];

      for (const platform of platforms) {
        this.queues[platform] = new Queue(`${platform}-sync`, redisConfig);

        // Set up job processors
        this.setupProcessor(platform);

        // Set up event listeners
        this.setupEventListeners(platform);
      }

      this.initialized = true;
      console.log('✅ Sync Queue Service initialized');
    } catch (error) {
      console.error('⚠️ Sync Queue Service failed to initialize:', error.message);
      console.log('Running in fallback mode without background processing');
    }
  }

  /**
   * Set up job processor for a platform
   */
  setupProcessor(platform) {
    const queue = this.queues[platform];

    queue.process(async (job) => {
      const { userId, data, syncType } = job.data;

      try {
        let result;

        switch (platform) {
          case 'codeforces':
            result = await codeforcesSyncService.syncUserData(userId, data.cfHandle, syncType);
            break;
          case 'leetcode':
            result = await leetcodeSyncService.syncUserData(userId, data.leetcodeUsername, syncType);
            break;
          case 'hackerrank':
            result = await hackerrankSyncService.syncUserData(userId, data.hackerrankUsername, syncType);
            break;
          case 'geeksforgeeks':
            result = await geeksforGeeksSyncService.syncUserData(userId, data.gfgUsername, syncType);
            break;
          case 'manual':
            result = await manualUploadService.syncCSVData(userId, data.csvContent);
            break;
          default:
            throw new Error(`Unknown platform: ${platform}`);
        }

        // Update progress
        await job.progress(100);

        return result;
      } catch (error) {
        console.error(`Error processing ${platform} sync job:`, error);
        throw error;
      }
    });
  }

  /**
   * Set up event listeners
   */
  setupEventListeners(platform) {
    const queue = this.queues[platform];

    queue.on('completed', async (job, result) => {
      console.log(`✅ ${platform} sync completed: ${job.id}`);
      
      // Trigger telemetry aggregation post-sync
      try {
        const aggregationResult = await telemetryAggregationService.aggregateSyncResults(
          result,
          job.data.userId
        );
        console.log(`✅ Telemetry aggregation triggered for user ${job.data.userId}`);
        console.log(`  - Submissions processed: ${aggregationResult.stats.submissionsProcessed}`);
        console.log(`  - Contests processed: ${aggregationResult.stats.contestsProcessed}`);
        console.log(`  - AI pipeline triggered: ${aggregationResult.tasks.includes('ai_pipeline_triggered')}`);
      } catch (error) {
        console.error(`⚠️ Telemetry aggregation failed for user ${job.data.userId}:`, error.message);
      }
    });

    queue.on('failed', (job, err) => {
      console.error(`❌ ${platform} sync failed: ${job.id} - ${err.message}`);
    });

    queue.on('stalled', (job) => {
      console.warn(`⚠️ ${platform} sync stalled: ${job.id}`);
    });

    queue.on('error', (error) => {
      console.error(`🔥 ${platform} queue error:`, error);
    });
  }

  /**
   * Enqueue a sync job
   */
  async enqueueSyncJob(userId, platform, data, syncType = 'incremental') {
    if (!this.initialized || !this.queues[platform]) {
      throw new Error('Sync queue not initialized for platform: ' + platform);
    }

    const queue = this.queues[platform];

    const job = await queue.add(
      {
        userId,
        data,
        syncType,
      },
      {
        attempts: 3, // Retry up to 3 times
        backoff: {
          type: 'exponential',
          delay: 2000, // Start with 2 seconds
        },
        removeOnComplete: true,
        removeOnFail: false,
        timeout: 60000, // 60 second timeout per job
      }
    );

    return {
      jobId: job.id,
      platform,
      status: 'queued',
      createdAt: job.createdTimestamp,
    };
  }

  /**
   * Get job status
   */
  async getJobStatus(platform, jobId) {
    if (!this.queues[platform]) {
      throw new Error('Unknown platform: ' + platform);
    }

    const queue = this.queues[platform];
    const job = await queue.getJob(jobId);

    if (!job) {
      return null;
    }

    const progress = job._progress;
    const state = await job.getState();
    const attempts = job.attemptsMade;

    return {
      jobId: job.id,
      platform,
      status: state,
      progress: progress || 0,
      attempts,
      data: job.data,
      result: job.returnvalue,
      error: job.failedReason,
    };
  }

  /**
   * Clear failed jobs
   */
  async clearFailedJobs(platform) {
    if (!this.queues[platform]) {
      throw new Error('Unknown platform: ' + platform);
    }

    const queue = this.queues[platform];
    const failedCount = await queue.count('failed');

    await queue.clean(0, 'failed');

    return { failedJobsCleared: failedCount };
  }

  /**
   * Get queue stats
   */
  async getQueueStats(platform) {
    if (!this.queues[platform]) {
      throw new Error('Unknown platform: ' + platform);
    }

    const queue = this.queues[platform];

    const [
      active,
      waiting,
      completed,
      failed,
      delayed,
    ] = await Promise.all([
      queue.getActiveCount(),
      queue.getWaitingCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      platform,
      active,
      waiting,
      completed,
      failed,
      delayed,
      total: active + waiting + completed + failed + delayed,
    };
  }

  /**
   * Retry failed job
   */
  async retryFailedJob(platform, jobId) {
    if (!this.queues[platform]) {
      throw new Error('Unknown platform: ' + platform);
    }

    const queue = this.queues[platform];
    const job = await queue.getJob(jobId);

    if (!job) {
      throw new Error('Job not found');
    }

    await job.retry();

    return {
      jobId: job.id,
      status: 'retrying',
    };
  }

  /**
   * Schedule recurring sync
   */
  async scheduleRecurringSyncJob(userId, platform, data, interval = '0 * * * *') {
    if (!this.initialized || !this.queues[platform]) {
      throw new Error('Sync queue not initialized for platform: ' + platform);
    }

    const queue = this.queues[platform];

    const job = await queue.add(
      {
        userId,
        data,
        syncType: 'incremental',
      },
      {
        repeat: {
          cron: interval, // Default: every hour
        },
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
      }
    );

    // Store recurring job info in metadata
    await IntegrationMetadata.findOneAndUpdate(
      { userId, platform },
      {
        recurringJobId: job.id,
        recurringJobInterval: interval,
      },
      { upsert: true }
    );

    return {
      recurringJobId: job.id,
      platform,
      userId,
      interval,
    };
  }

  /**
   * Close queues
   */
  async closeQueues() {
    for (const platform of Object.keys(this.queues)) {
      await this.queues[platform].close();
    }
    this.initialized = false;
  }
}

module.exports = new SyncQueueService();

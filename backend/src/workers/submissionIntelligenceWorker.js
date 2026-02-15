/**
 * Submission Intelligence Queue Worker
 * Processes submissions asynchronously using Bull queue backed by Redis
 * Implements retry logic with exponential backoff
 */

const Queue = require('bull');

// Note: submissionAutomationService removed - this worker is deprecated
// Use intelligenceWorker.js instead

const logger = console;

// Queue configuration
const QUEUE_NAME = 'submission-intelligence';
const QUEUE_CONFIG = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  },
};

// Create queue
let submissionQueue = null;

/**
 * Initialize submission intelligence queue
 */
function initializeSubmissionQueue() {
  if (submissionQueue) {
    return submissionQueue;
  }

  submissionQueue = new Queue(QUEUE_NAME, QUEUE_CONFIG);

  // Queue event listeners
  submissionQueue.on('ready', () => {
    logger.info(`✅ Submission intelligence queue ready`);
  });

  submissionQueue.on('error', error => {
    const errorMsg = error?.message || JSON.stringify(error) || 'Unknown error';
    logger.error(`❌ Submission queue error: ${errorMsg}`);
  });

  submissionQueue.on('stalled', job => {
    logger.warn(`⚠️ Job ${job.id} stalled`);
  });

  // Define job processor - DEPRECATED, use intelligenceWorker.js instead
  submissionQueue.process(
    process.env.QUEUE_CONCURRENCY || 5,
    async (job) => {
      logger.warn(`⚠️ submissionIntelligenceWorker is deprecated - use intelligenceWorker.js instead`);
      return { success: false, message: 'Worker deprecated' };
    }
  );

  // Job event listeners
  submissionQueue.on('completed', job => {
    logger.info(`✅ Job ${job.id} completed`);
  });

  submissionQueue.on('failed', (job, error) => {
    logger.error(`❌ Job ${job.id} failed: ${error.message}, attempt: ${job.attemptsMade + 1}`);
  });

  return submissionQueue;
}

/**
 * Process a submission intelligence job (DEPRECATED - use intelligenceWorker.js instead)
 */
async function processSubmissionIntelligence(job) {
  logger.warn(`⚠️ submissionIntelligenceWorker.processSubmissionIntelligence is deprecated`);
  return { success: false, message: 'Worker deprecated' };
}

/**
 * Add submission to intelligence queue
 * Called from submission controller after DB save
 */
async function queueSubmissionIntelligence(submissionId) {
  try {
    const queue = initializeSubmissionQueue();

    const jobOptions = {
      attempts: 3, // Retry up to 3 times
      backoff: {
        type: 'exponential',
        delay: 2000, // Start with 2 second delay
      },
      removeOnComplete: true,
      removeOnFail: false,
      timeout: 30000, // 30 second timeout per attempt
    };

    const job = await queue.add(
      { submissionId },
      jobOptions
    );

    logger.info(`📝 Submission ${submissionId} queued for intelligence processing (Job ${job.id})`);

    return job;
  } catch (error) {
    logger.error(`Failed to queue submission: ${error.message}`);
    throw error;
  }
}

/**
 * Batch queue multiple submissions
 */
async function batchQueueSubmissions(submissionIds) {
  try {
    const queue = initializeSubmissionQueue();

    const jobs = await Promise.all(
      submissionIds.map(submissionId =>
        queue.add({ submissionId }, {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        })
      )
    );

    logger.info(`📝 Queued ${jobs.length} submissions for intelligence processing`);

    return jobs;
  } catch (error) {
    logger.error(`Batch queuing failed: ${error.message}`);
    throw error;
  }
}

/**
 * Get queue statistics
 */
async function getQueueStats() {
  try {
    const queue = initializeSubmissionQueue();

    const counts = await queue.getJobCounts();
    const waiting = await queue.getWaitingCount();
    const active = await queue.getActiveCount();
    const completed = await queue.getCompletedCount();
    const failed = await queue.getFailedCount();

    return {
      name: QUEUE_NAME,
      waiting,
      active,
      completed,
      failed,
      ...counts,
    };
  } catch (error) {
    logger.error(`Failed to get queue stats: ${error.message}`);
    return null;
  }
}

/**
 * Clear failed jobs from queue
 */
async function clearFailedJobs() {
  try {
    const queue = initializeSubmissionQueue();

    const failedJobs = await queue.getFailed();
    for (const job of failedJobs) {
      await job.remove();
    }

    logger.info(`🧹 Cleared ${failedJobs.length} failed jobs`);

    return failedJobs.length;
  } catch (error) {
    logger.error(`Failed to clear jobs: ${error.message}`);
    throw error;
  }
}

/**
 * Pause queue processing
 */
async function pauseQueue() {
  try {
    const queue = initializeSubmissionQueue();
    await queue.pause();
    logger.info(`⏸️ Submission queue paused`);
  } catch (error) {
    logger.error(`Failed to pause queue: ${error.message}`);
    throw error;
  }
}

/**
 * Resume queue processing
 */
async function resumeQueue() {
  try {
    const queue = initializeSubmissionQueue();
    await queue.resume();
    logger.info(`▶️ Submission queue resumed`);
  } catch (error) {
    logger.error(`Failed to resume queue: ${error.message}`);
    throw error;
  }
}

module.exports = {
  initializeSubmissionQueue,
  queueSubmissionIntelligence,
  batchQueueSubmissions,
  getQueueStats,
  clearFailedJobs,
  pauseQueue,
  resumeQueue,
};

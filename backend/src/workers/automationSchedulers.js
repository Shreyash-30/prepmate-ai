/**
 * Automation Schedulers
 * Uses node-cron to schedule daily and weekly automation tasks
 * Environment-based enabling for different deployment scenarios
 */

const cron = require('node-cron');
const {
  plannerAutomationService,
  retentionAutomationService,
  readinessAutomationService,
  complianceService,
} = require('../services/automation');

const logger = console;

// Store scheduler references for cleanup
const schedulers = {};

/**
 * Initialize all automation schedulers
 */
function initializeSchedulers() {
  logger.info('🚀 Initializing automation schedulers');

  if (process.env.DAILY_PLANNER_ENABLED !== 'false') {
    setupDailyPlannerScheduler();
  }

  if (process.env.RETENTION_SCHEDULER_ENABLED !== 'false') {
    setupRetentionScheduler();
  }

  if (process.env.WEEKLY_READINESS_ENABLED !== 'false') {
    setupWeeklyReadinessScheduler();
  }

  if (process.env.WEEKLY_COMPLIANCE_ENABLED !== 'false') {
    setupWeeklyComplianceScheduler();
  }

  logger.info('✅ All enabled schedulers initialized');
}

/**
 * Daily Adaptive Planner
 * Runs daily at user local time (default: 00:00 UTC)
 * Generates next-day tasks based on weakness and revision needs
 */
function setupDailyPlannerScheduler() {
  const cronExpression = process.env.DAILY_PLANNER_CRON || '0 0 * * *'; // Daily at midnight UTC

  logger.info(`📋 Setting up daily planner scheduler: ${cronExpression}`);

  const scheduler = cron.schedule(cronExpression, async () => {
    logger.info('📋 Running daily adaptive planner');

    try {
      const result = await plannerAutomationService.batchGenerateAdaptivePlans();

      logger.info(
        `✅ Daily planner complete: ${result.successCount} success, ${result.failureCount} failed`
      );
    } catch (error) {
      logger.error(`❌ Daily planner failed: ${error.message}`);
    }
  });

  schedulers['daily-planner'] = scheduler;

  logger.info('✅ Daily planner scheduler configured');
}

/**
 * Retention Scheduler
 * Runs nightly at 23:00 UTC
 * Updates revision schedules and creates high-urgency revision tasks
 */
function setupRetentionScheduler() {
  const cronExpression = process.env.RETENTION_SCHEDULER_CRON || '0 23 * * *'; // Daily at 23:00 UTC

  logger.info(`🔄 Setting up retention scheduler: ${cronExpression}`);

  const scheduler = cron.schedule(cronExpression, async () => {
    logger.info('🔄 Running retention scheduler');

    try {
      const result = await retentionAutomationService.batchUpdateRetentionSchedules();

      logger.info(
        `✅ Retention scheduler complete: ${result.successCount} success, ${result.failureCount} failed`
      );
    } catch (error) {
      logger.error(`❌ Retention scheduler failed: ${error.message}`);
    }
  });

  schedulers['retention'] = scheduler;

  logger.info('✅ Retention scheduler configured');
}

/**
 * Weekly Readiness Recompute
 * Runs weekly on Sundays at 02:00 UTC
 * Recomputes readiness scores for all active users
 */
function setupWeeklyReadinessScheduler() {
  const cronExpression = process.env.WEEKLY_READINESS_CRON || '0 2 * * 0'; // Weekly Sunday at 02:00 UTC

  logger.info(`📊 Setting up weekly readiness scheduler: ${cronExpression}`);

  const scheduler = cron.schedule(cronExpression, async () => {
    logger.info('📊 Running weekly readiness recompute');

    try {
      const result = await readinessAutomationService.batchComputeReadiness();

      logger.info(
        `✅ Weekly readiness complete: ${result.successCount} success, ${result.failureCount} failed`
      );
    } catch (error) {
      logger.error(`❌ Weekly readiness failed: ${error.message}`);
    }
  });

  schedulers['weekly-readiness'] = scheduler;

  logger.info('✅ Weekly readiness scheduler configured');
}

/**
 * Weekly Compliance Recompute
 * Runs weekly on Mondays at 03:00 UTC
 * Recomputes compliance scores and generates weekly reports
 */
function setupWeeklyComplianceScheduler() {
  const cronExpression = process.env.WEEKLY_COMPLIANCE_CRON || '0 3 * * 1'; // Weekly Monday at 03:00 UTC

  logger.info(`📊 Setting up weekly compliance scheduler: ${cronExpression}`);

  const scheduler = cron.schedule(cronExpression, async () => {
    logger.info('📊 Running weekly compliance recompute');

    try {
      const result = await complianceService.recomputeWeeklyCompliance();

      logger.info(
        `✅ Weekly compliance complete: ${result.successCount} success, ${result.failureCount} failed`
      );
    } catch (error) {
      logger.error(`❌ Weekly compliance failed: ${error.message}`);
    }
  });

  schedulers['weekly-compliance'] = scheduler;

  logger.info('✅ Weekly compliance scheduler configured');
}

/**
 * Stop all schedulers
 * Call on server shutdown
 */
function stopAllSchedulers() {
  logger.info('🛑 Stopping all automation schedulers');

  Object.entries(schedulers).forEach(([name, scheduler]) => {
    try {
      scheduler.stop();
      logger.info(`✅ Stopped ${name} scheduler`);
    } catch (error) {
      logger.error(`Failed to stop ${name} scheduler: ${error.message}`);
    }
  });

  logger.info('✅ All schedulers stopped');
}

/**
 * Get scheduler status
 */
function getSchedulerStatus() {
  return {
    daily_planner: {
      enabled: process.env.DAILY_PLANNER_ENABLED !== 'false',
      schedule: process.env.DAILY_PLANNER_CRON || '0 0 * * *',
      running: schedulers['daily-planner']?.status === 'started',
    },
    retention: {
      enabled: process.env.RETENTION_SCHEDULER_ENABLED !== 'false',
      schedule: process.env.RETENTION_SCHEDULER_CRON || '0 23 * * *',
      running: schedulers['retention']?.status === 'started',
    },
    weekly_readiness: {
      enabled: process.env.WEEKLY_READINESS_ENABLED !== 'false',
      schedule: process.env.WEEKLY_READINESS_CRON || '0 2 * * 0',
      running: schedulers['weekly-readiness']?.status === 'started',
    },
    weekly_compliance: {
      enabled: process.env.WEEKLY_COMPLIANCE_ENABLED !== 'false',
      schedule: process.env.WEEKLY_COMPLIANCE_CRON || '0 3 * * 1',
      running: schedulers['weekly-compliance']?.status === 'started',
    },
  };
}

module.exports = {
  initializeSchedulers,
  stopAllSchedulers,
  getSchedulerStatus,
};

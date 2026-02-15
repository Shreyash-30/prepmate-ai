/**
 * Retention Automation Service
 * Schedules revisions and manages retention via ML model
 * Runs nightly to update revision schedules
 */

const axios = require('axios');
const {
  RevisionSchedule,
  PreparationTask,
  AutomationStatus,
  MasteryMetric,
  User,
} = require('../../models');

const logger = console;

const ML_SERVICE_BASE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000/ai/ml';

/**
 * Update retention schedule for a user
 * Calls ML retention model and schedules revisions
 */
async function updateRetentionSchedule(userId) {
  const executionId = `retention-${userId}-${Date.now()}`;

  try {
    const automationRecord = await AutomationStatus.create({
      pipelineType: 'retention-scheduler',
      userId,
      status: 'running',
      executionId,
      startTime: new Date(),
      steps: [],
    });

    logger.info(`🔄 Updating retention schedule for user: ${userId}`);

    // Get user's mastery metrics
    const masteryMetrics = await MasteryMetric.find({
      userId,
      problemsAttempted: { $gte: 1 },
    }).lean();

    if (!masteryMetrics.length) {
      logger.info(`No mastery metrics for user ${userId}, skipping retention update`);
      automationRecord.status = 'completed';
      automationRecord.endTime = new Date();
      automationRecord.duration = 0;
      await automationRecord.save();
      return { success: true, executionId };
    }

    // Update retention for each topic
    let updatedCount = 0;
    for (const metric of masteryMetrics) {
      const retentionStep = await executeRetentionUpdate(
        userId,
        metric.topicId || metric.topicName
      );

      if (retentionStep.status === 'completed') {
        updatedCount++;
        updateAutomationStep(automationRecord, `retention-${metric.topicName}`, retentionStep);
      }
    }

    // Identify high-urgency revisions and create tasks
    const highUrgencyStep = await handleHighUrgencyRevisions(userId);
    updateAutomationStep(automationRecord, 'high-urgency-revisions', highUrgencyStep);

    automationRecord.status = 'completed';
    automationRecord.endTime = new Date();
    automationRecord.duration = automationRecord.endTime - automationRecord.startTime;
    await automationRecord.save();

    logger.info(`✅ Retention schedule updated for user: ${userId}`);

    return {
      success: true,
      executionId,
      topicsUpdated: updatedCount,
    };
  } catch (error) {
    logger.error(`❌ Retention update failed: ${error.message}`);

    await AutomationStatus.updateOne(
      { executionId },
      {
        status: 'failed',
        error: error.message,
        endTime: new Date(),
      }
    );

    throw error;
  }
}

/**
 * Execute retention update via ML service
 */
async function executeRetentionUpdate(userId, topicId) {
  const startTime = new Date();

  try {
    // Get existing revision schedule
    const existingSchedule = await RevisionSchedule.findOne({
      userId,
      topicId: topicId.toString ? topicId : topicId._id,
    }).lean();

    const timeSinceLastRevisionHours = existingSchedule
      ? (Date.now() - new Date(existingSchedule.lastRevisionDate).getTime()) / (1000 * 60 * 60)
      : 0;

    // Call ML retention endpoint
    const response = await axios.post(`${ML_SERVICE_BASE_URL}/retention/update`, {
      user_id: userId.toString(),
      topic_id: topicId.toString(),
      is_successful_revision: existingSchedule?.status === 'completed',
      time_since_last_revision_hours: Math.max(0, timeSinceLastRevisionHours),
    });

    const retentionData = response.data?.data;

    if (retentionData) {
      const nextRevisionDate = new Date(retentionData.next_revision_date);

      await RevisionSchedule.updateOne(
        { userId, topicId: topicId.toString ? topicId.toString() : topicId },
        {
          $set: {
            nextRevisionDate,
            revisionPriority: calculateRevisionPriority(retentionData.retention_probability),
            stabilityScore: retentionData.stability_score || 0,
            revisionInterval: retentionData.revision_interval_days || 1,
            status: 'scheduled',
            lastRevisionDate: existingSchedule?.lastRevisionDate || new Date(),
          },
          $inc: {
            revisionCount: existingSchedule ? 0 : 1,
          },
        },
        { upsert: true }
      );
    }

    return {
      status: 'completed',
      result: retentionData,
      duration: new Date() - startTime,
    };
  } catch (error) {
    logger.error(`Retention update for topic failed: ${error.message}`);
    return {
      status: 'failed',
      error: error.message,
      duration: new Date() - startTime,
    };
  }
}

/**
 * Handle high-urgency revisions by creating tasks
 */
async function handleHighUrgencyRevisions(userId) {
  const startTime = new Date();

  try {
    // Get revisions due today or earlier with high priority
    const highUrgencyRevisions = await RevisionSchedule.find({
      userId,
      nextRevisionDate: { $lte: new Date() },
      revisionPriority: { $gte: 4 },
      status: 'scheduled',
    }).lean();

    logger.info(`Found ${highUrgencyRevisions.length} high-urgency revisions for user ${userId}`);

    // Create tasks for high-urgency revisions
    const tasksToCreate = highUrgencyRevisions.map(revision => ({
      userId,
      taskType: 'revision',
      topicId: revision.topicId,
      topicName: revision.topicName,
      title: `Urgent Revision: ${revision.topicName}`,
      description: `High-urgency revision to maintain stability and prevent forgetting`,
      estimatedDurationMinutes: 45,
      priority: 5, // Highest
      scheduledDate: new Date(),
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      completed: false,
      status: 'pending',
      generatedBy: 'system',
    }));

    let createdCount = 0;
    if (tasksToCreate.length) {
      const created = await PreparationTask.insertMany(tasksToCreate);
      createdCount = created.length;
    }

    return {
      status: 'completed',
      result: { tasksCreated: createdCount, revisionsFound: highUrgencyRevisions.length },
      duration: new Date() - startTime,
    };
  } catch (error) {
    logger.error(`High-urgency revision handling failed: ${error.message}`);
    return {
      status: 'failed',
      error: error.message,
      duration: new Date() - startTime,
    };
  }
}

/**
 * Calculate revision priority (1-5) from retention probability
 */
function calculateRevisionPriority(retentionProbability) {
  // Lower retention = higher priority (to revise sooner)
  if (retentionProbability < 0.3) return 5;
  if (retentionProbability < 0.5) return 4;
  if (retentionProbability < 0.7) return 3;
  if (retentionProbability < 0.85) return 2;
  return 1;
}

/**
 * Batch update retention schedules for all active users
 * Called nightly via scheduler
 */
async function batchUpdateRetentionSchedules(userIds = null) {
  try {
    logger.info('🔄 Starting batch retention schedule update');

    let query = { isActive: true };
    if (userIds?.length) {
      query._id = { $in: userIds };
    }

    const users = await User.find(query).select('_id').lean();

    logger.info(`Updating retention for ${users.length} users`);

    let successCount = 0;
    let failureCount = 0;

    // Process in batches
    const batchSize = 15;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);

      await Promise.all(
        batch.map(user =>
          updateRetentionSchedule(user._id)
            .then(() => {
              successCount++;
            })
            .catch(error => {
              logger.error(`Retention update failed for user ${user._id}: ${error.message}`);
              failureCount++;
            })
        )
      );
    }

    logger.info(
      `✅ Batch retention update complete: ${successCount} success, ${failureCount} failed`
    );

    return { successCount, failureCount, totalProcessed: users.length };
  } catch (error) {
    logger.error(`Batch retention update failed: ${error.message}`);
    throw error;
  }
}

/**
 * Helper: Update automation step
 */
function updateAutomationStep(automationRecord, stepName, stepResult) {
  automationRecord.steps.push({
    name: stepName,
    status: stepResult.status,
    startTime: new Date(Date.now() - stepResult.duration),
    endTime: new Date(),
    result: stepResult.result,
    error: stepResult.error,
  });
}

module.exports = {
  updateRetentionSchedule,
  batchUpdateRetentionSchedules,
  executeRetentionUpdate,
  handleHighUrgencyRevisions,
};

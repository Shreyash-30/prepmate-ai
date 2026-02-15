/**
 * Planner Automation Service
 * Generates daily adaptive tasks via ML planner
 * Runs daily at user-specified local time
 */

const axios = require('axios');
const {
  PreparationTask,
  AutomationStatus,
  User,
  WeakTopicSignal,
  RevisionSchedule,
} = require('../../models');
const RoadmapTrackingService = require('../roadmapTrackingService');

const logger = console;

const ML_SERVICE_BASE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000/ai/ml';

/**
 * Generate adaptive plan for a user
 * Creates tasks for the next day based on weakness, revision and roadmap
 */
async function generateAdaptivePlan(userId) {
  const executionId = `planner-${userId}-${Date.now()}`;

  try {
    const automationRecord = await AutomationStatus.create({
      pipelineType: 'daily-planner',
      userId,
      status: 'running',
      executionId,
      startTime: new Date(),
      steps: [],
    });

    logger.info(`📋 Generating adaptive plan for user: ${userId}`);

    // Get user data
    const user = await User.findById(userId).lean();
    if (!user) {
      throw new Error('User not found');
    }

    // Get weak topics for this user
    const weakTopics = await WeakTopicSignal.find({
      userId,
      riskLevel: { $in: ['high', 'critical'] },
    })
      .sort({ riskScore: -1 })
      .limit(3)
      .lean();

    // Get topics due for revision
    const revisionDue = await RevisionSchedule.find({
      userId,
      nextRevisionDate: { $lte: new Date() },
      status: { $ne: 'completed' },
    })
      .sort({ revisionPriority: -1 })
      .limit(2)
      .lean();

    // Get roadmap progress data
    const roadmapProgress = await RoadmapTrackingService.getUserRoadmapProgress(userId);

    // Call ML adaptive planner
    const planningStep = await executeAdaptivePlanner(userId, weakTopics, revisionDue, roadmapProgress);
    updateAutomationStep(automationRecord, 'adaptive-planning', planningStep);

    // Create tasks from plan
    if (planningStep.status === 'completed' && planningStep.result) {
      const tasksStep = await createTasksFromPlan(
        userId,
        planningStep.result
      );
      updateAutomationStep(automationRecord, 'task-creation', tasksStep);
    }

    // Mark automation complete
    automationRecord.status = 'completed';
    automationRecord.endTime = new Date();
    automationRecord.duration = automationRecord.endTime - automationRecord.startTime;
    await automationRecord.save();

    logger.info(`✅ Adaptive plan generated for user: ${userId}`);

    return {
      success: true,
      executionId,
      tasksCreated: planningStep.result?.tasks?.length || 0,
    };
  } catch (error) {
    logger.error(`❌ Adaptive plan generation failed: ${error.message}`);

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
 * Execute adaptive planner ML endpoint
 */
async function executeAdaptivePlanner(userId, weakTopics, revisionDue, roadmapProgress) {
  const startTime = new Date();

  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Prepare input for ML
    const weakTopicIds = weakTopics.map(t => t.topicId || t.topicName);
    const revisionTopicIds = revisionDue.map(r => r.topicId || r.topicName);

    // Build roadmap context for ML
    const roadmapContext = {
      has_roadmap: roadmapProgress?.hasRoadmap || false,
      overall_progress: roadmapProgress?.overallProgress || 0,
      completed_topics: roadmapProgress?.completedTopics || 0,
      total_topics: roadmapProgress?.totalTopics || 0,
      pci_score: roadmapProgress?.pciScore || 0,
      problem_completion_rate: roadmapProgress?.problemStats?.completionRate || 0,
      difficulties_solved: roadmapProgress?.problemStats?.byDifficulty || {},
    };

    const response = await axios.post(`${ML_SERVICE_BASE_URL}/planner/adaptive`, {
      user_id: userId.toString(),
      weak_topics: weakTopicIds,
      revision_topics: revisionTopicIds,
      roadmap_context: roadmapContext,
      target_date: tomorrow.toISOString(),
      max_tasks: 5,
    });

    return {
      status: 'completed',
      result: response.data?.data,
      duration: new Date() - startTime,
    };
  } catch (error) {
    logger.error(`Adaptive planner failed: ${error.message}`);
    return {
      status: 'failed',
      error: error.message,
      duration: new Date() - startTime,
    };
  }
}

/**
 * Create PreparationTask records from plan
 */
async function createTasksFromPlan(userId, planData) {
  const startTime = new Date();

  try {
    if (!planData?.tasks?.length) {
      return {
        status: 'completed',
        result: { tasksCreated: 0 },
        duration: new Date() - startTime,
      };
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Clear existing pending tasks for tomorrow (idempotent)
    const tomorrowStart = new Date(tomorrow);
    tomorrowStart.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    await PreparationTask.deleteMany({
      userId,
      status: 'pending',
      generatedBy: 'adaptive-planner',
      scheduledDate: { $gte: tomorrowStart, $lte: tomorrowEnd },
    });

    // Create new tasks
    const tasksToCreate = planData.tasks.map(task => ({
      userId,
      taskType: mapTaskType(task.type),
      topicId: task.topic_id,
      topicName: task.topic_name,
      difficultyLevel: task.difficulty,
      title: task.title,
      description: task.description,
      estimatedDurationMinutes: task.estimated_duration_minutes || 30,
      priority: task.priority || 3,
      scheduledDate: tomorrow,
      dueDate: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000), // +1 day
      completed: false,
      status: 'pending',
      generatedBy: 'adaptive-planner',
      reasoning: task.reasoning,
    }));

    const created = await PreparationTask.insertMany(tasksToCreate);

    return {
      status: 'completed',
      result: { tasksCreated: created.length, taskIds: created.map(t => t._id) },
      duration: new Date() - startTime,
    };
  } catch (error) {
    logger.error(`Task creation failed: ${error.message}`);
    return {
      status: 'failed',
      error: error.message,
      duration: new Date() - startTime,
    };
  }
}

/**
 * Map ML task type to PreparationTask taskType
 */
function mapTaskType(mlType) {
  const typeMap = {
    'weak-topic-practice': 'weak-topic',
    'revision': 'revision',
    'learning': 'learning',
    'mock-interview': 'mock-interview',
    'concept-review': 'concept-review',
  };

  return typeMap[mlType] || 'practice';
}

/**
 * Batch generate plans for all active users
 * Called daily via scheduler
 */
async function batchGenerateAdaptivePlans(userIds = null) {
  try {
    logger.info('📋 Starting batch adaptive plan generation');

    let query = { isActive: true };
    if (userIds?.length) {
      query._id = { $in: userIds };
    }

    const users = await User.find(query).select('_id').lean();

    logger.info(`Generating plans for ${users.length} users`);

    let successCount = 0;
    let failureCount = 0;

    // Process in batches of 10 to avoid overwhelming ML service
    const batchSize = 10;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);

      await Promise.all(
        batch.map(user =>
          generateAdaptivePlan(user._id)
            .then(() => {
              successCount++;
            })
            .catch(error => {
              logger.error(`Plan generation failed for user ${user._id}: ${error.message}`);
              failureCount++;
            })
        )
      );
    }

    logger.info(
      `✅ Batch plan generation complete: ${successCount} success, ${failureCount} failed`
    );

    return { successCount, failureCount, totalProcessed: users.length };
  } catch (error) {
    logger.error(`Batch plan generation failed: ${error.message}`);
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
  generateAdaptivePlan,
  batchGenerateAdaptivePlans,
  executeAdaptivePlanner,
  createTasksFromPlan,
};

/**
 * Automation Controller
 * REST endpoints for automation status, compliance, tasks, and manual triggers
 */

const {
  complianceService,
  plannerAutomationService,
  readinessAutomationService,
} = require('../services/automation');
const { PreparationTask, UserPreparationCompliance } = require('../models');
const { getQueueStats } = require('../workers/submissionIntelligenceWorker');
const { getSchedulerStatus } = require('../workers/automationSchedulers');

const logger = console;

/**
 * GET /api/automation/status
 * Get overall automation system status and health
 */
exports.getAutomationStatus = async (req, res) => {
  try {
    const queueStats = await getQueueStats();
    const schedulerStatus = getSchedulerStatus();

    return res.json({
      success: true,
      data: {
        queues: queueStats,
        schedulers: schedulerStatus,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error(`Automation status error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to get automation status',
      error: error.message,
    });
  }
};

/**
 * GET /api/user/compliance
 * Get user's preparation compliance data
 * Auth: Required (uses req.user.id)
 */
exports.getUserCompliance = async (req, res) => {
  try {
    const userId = req.user.id;

    const compliance = await complianceService.getUserCompliance(userId);

    return res.json({
      success: true,
      data: compliance,
    });
  } catch (error) {
    logger.error(`Get compliance error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to get compliance data',
      error: error.message,
    });
  }
};

/**
 * GET /api/user/tasks/today
 * Get today's preparation tasks for user
 * Auth: Required
 */
exports.getUserTodaysTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get tasks scheduled for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await PreparationTask.find({
      userId,
      scheduledDate: {
        $gte: today,
        $lt: tomorrow,
      },
    })
      .sort({ priority: -1, estimatedDurationMinutes: 1 })
      .lean();

    // Map to response format
    const mappedTasks = tasks.map(task => ({
      id: task._id,
      type: task.taskType,
      title: task.title,
      description: task.description,
      topicName: task.topicName,
      difficulty: task.difficultyLevel,
      priority: task.priority,
      estimatedDurationMinutes: task.estimatedDurationMinutes,
      completed: task.completed,
      completedAt: task.completedAt,
      status: task.status,
    }));

    // Calculate completion stats
    const totalTasks = mappedTasks.length;
    const completedTasks = mappedTasks.filter(t => t.completed).length;
    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const totalEstimatedMinutes = mappedTasks.reduce(
      (sum, t) => sum + (t.estimatedDurationMinutes || 0),
      0
    );

    return res.json({
      success: true,
      data: {
        tasks: mappedTasks,
        summary: {
          totalTasks,
          completedTasks,
          completionRate,
          totalEstimatedMinutes,
          priorityBreakdown: {
            high: mappedTasks.filter(t => t.priority >= 4).length,
            medium: mappedTasks.filter(t => t.priority === 3).length,
            low: mappedTasks.filter(t => t.priority <= 2).length,
          },
        },
      },
    });
  } catch (error) {
    logger.error(`Get tasks error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to get today's tasks",
      error: error.message,
    });
  }
};

/**
 * GET /api/user/tasks
 * Get all preparation tasks with optional filtering
 * Auth: Required
 * Query: ?status=pending&limit=50&page=1&from=2024-01-01&to=2024-01-31
 */
exports.getUserTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 50, page = 1, from, to } = req.query;

    const filter = { userId };

    if (status) {
      filter.status = status;
    }

    if (from || to) {
      filter.scheduledDate = {};
      if (from) {
        filter.scheduledDate.$gte = new Date(from);
      }
      if (to) {
        filter.scheduledDate.$lte = new Date(to);
      }
    }

    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      PreparationTask.find(filter)
        .sort({ scheduledDate: -1, priority: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean(),
      PreparationTask.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        tasks: tasks.map(t => ({
          id: t._id,
          type: t.taskType,
          title: t.title,
          topicName: t.topicName,
          priority: t.priority,
          status: t.status,
          completed: t.completed,
          scheduledDate: t.scheduledDate,
          dueDate: t.dueDate,
        })),
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error(`Get tasks error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to get tasks',
      error: error.message,
    });
  }
};

/**
 * POST /api/tasks/:taskId/complete
 * Mark a task as completed
 * Auth: Required
 * Body: { completionTimeMinutes, score }
 */
exports.completeTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskId } = req.params;
    const { completionTimeMinutes, score } = req.body;

    // Verify task belongs to user
    const task = await PreparationTask.findById(taskId);
    if (!task || task.userId.toString() !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Complete task via compliance service
    const result = await complianceService.completeTask(
      taskId,
      userId,
      completionTimeMinutes,
      score
    );

    return res.json({
      success: true,
      data: {
        taskId: result.task._id,
        completedAt: result.task.completedAt,
        completionTimeMinutes: result.task.completionTimeMinutes,
        score: result.task.score,
      },
      message: 'Task marked as completed',
    });
  } catch (error) {
    logger.error(`Complete task error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete task',
      error: error.message,
    });
  }
};

/**
 * POST /api/tasks/bulk/complete
 * Mark multiple tasks as completed
 * Auth: Required
 * Body: { taskIds: [...], completionTime, score }
 */
exports.bulkCompleteTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskIds, completionTime = 0, score = 100 } = req.body;

    if (!taskIds?.length) {
      return res.status(400).json({
        success: false,
        message: 'taskIds array is required',
      });
    }

    // Verify all tasks belong to user
    const tasks = await PreparationTask.find({ _id: { $in: taskIds } });
    if (tasks.some(t => t.userId.toString() !== userId)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Some tasks do not belong to user',
      });
    }

    // Complete all tasks
    const results = await Promise.all(
      taskIds.map(taskId =>
        complianceService.completeTask(taskId, userId, completionTime, score)
      )
    );

    return res.json({
      success: true,
      data: {
        completedCount: results.length,
        taskIds: results.map(r => r.task._id),
      },
      message: `${results.length} tasks marked as completed`,
    });
  } catch (error) {
    logger.error(`Bulk complete tasks error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete tasks',
      error: error.message,
    });
  }
};

/**
 * POST /api/automation/trigger/planner
 * Manually trigger adaptive plan generation for user
 * Auth: Required
 */
exports.triggerAdaptivePlan = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await plannerAutomationService.generateAdaptivePlan(userId);

    return res.json({
      success: true,
      data: {
        executionId: result.executionId,
        tasksCreated: result.tasksCreated,
      },
      message: 'Adaptive plan generated successfully',
    });
  } catch (error) {
    logger.error(`Trigger planner error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate adaptive plan',
      error: error.message,
    });
  }
};

/**
 * POST /api/automation/trigger/readiness
 * Manually trigger readiness computation for user
 * Auth: Required
 */
exports.triggerReadinessComputation = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await readinessAutomationService.computeReadinessScore(userId);

    return res.json({
      success: true,
      data: {
        executionId: result.executionId,
        score: result.score,
      },
      message: 'Readiness score computed successfully',
    });
  } catch (error) {
    logger.error(`Trigger readiness error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to compute readiness',
      error: error.message,
    });
  }
};

/**
 * GET /api/automation/logs
 * Get recent automation execution logs
 * Query: ?limit=50&status=completed
 */
exports.getAutomationLogs = async (req, res) => {
  try {
    const { limit = 50, status, pipelineType } = req.query;
    const { AutomationStatus } = require('../models');

    const filter = {};
    if (status) filter.status = status;
    if (pipelineType) filter.pipelineType = pipelineType;

    const logs = await AutomationStatus.find(filter)
      .sort({ startTime: -1 })
      .limit(parseInt(limit))
      .lean();

    return res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    logger.error(`Get automation logs error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to get logs',
      error: error.message,
    });
  }
};

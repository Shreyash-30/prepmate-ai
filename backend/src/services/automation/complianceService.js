/**
 * Compliance Service
 * Tracks user preparation compliance, task completion rates, and consistency
 * Updates compliance scores and status indicators
 */

const {
  UserPreparationCompliance,
  PreparationTask,
  User,
  AutomationStatus,
} = require('../../models');

const logger = console;

/**
 * Mark a task as completed and update compliance
 */
async function completeTask(taskId, userId, completionTimeMinutes = 0, score = 100) {
  try {
    logger.info(`✅ Completing task ${taskId} for user ${userId}`);

    // Update task
    const task = await PreparationTask.findByIdAndUpdate(
      taskId,
      {
        $set: {
          status: 'completed',
          completed: true,
          completedAt: new Date(),
          completionTimeMinutes: completionTimeMinutes || 30,
          score: score || 100,
        },
      },
      { new: true }
    );

    if (!task) {
      throw new Error('Task not found');
    }

    // Update compliance record
    await updateComplianceScore(userId);

    logger.info(`Task completion recorded`);

    return { success: true, task };
  } catch (error) {
    logger.error(`Task completion failed: ${error.message}`);
    throw error;
  }
}

/**
 * Update compliance score for a user
 * Called whenever a task is completed or on scheduled basis
 */
async function updateComplianceScore(userId) {
  try {
    // Get or create compliance record
    let compliance = await UserPreparationCompliance.findOne({ userId });
    if (!compliance) {
      compliance = new UserPreparationCompliance({ userId });
    }

    // Get tasks from current week
    const weekStart = getWeekStart(new Date());
    const weekEnd = getWeekEnd(new Date());

    const allTasks = await PreparationTask.find({ userId }).lean();

    const weekTasks = allTasks.filter(
      t => t.scheduledDate >= weekStart && t.scheduledDate <= weekEnd
    );

    const completedTasks = allTasks.filter(t => t.completed).length;
    const totalTasks = allTasks.length;

    const weekCompletedTasks = weekTasks.filter(t => t.completed).length;
    const weekAssignedTasks = weekTasks.length;

    // Update basic metrics
    compliance.tasksCompleted = completedTasks;
    compliance.tasksAssigned = totalTasks;
    compliance.tasksPending = totalTasks - completedTasks;
    compliance.completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calculate average completion time
    const completedWithTime = allTasks.filter(t => t.completed && t.completionTimeMinutes);
    if (completedWithTime.length > 0) {
      const avgTime =
        completedWithTime.reduce((sum, t) => sum + t.completionTimeMinutes, 0) /
        completedWithTime.length;
      compliance.averageCompletionTime = avgTime;
    }

    // Calculate average score
    const completedWithScore = allTasks.filter(t => t.completed && t.score !== undefined);
    if (completedWithScore.length > 0) {
      const avgScore =
        completedWithScore.reduce((sum, t) => sum + t.score, 0) / completedWithScore.length;
      compliance.averageCompletionScore = Math.round(avgScore);
    }

    // Update weekly metrics
    const weekNum = getWeekNumber(new Date());
    const weeklyMetric = {
      week: weekStart,
      weekStart,
      weekEnd,
      tasksAssignedWeek: weekAssignedTasks,
      tasksCompletedWeek: weekCompletedTasks,
      weeklyComplianceScore:
        weekAssignedTasks > 0 ? Math.round((weekCompletedTasks / weekAssignedTasks) * 100) : 0,
      activedays: getActiveDaysInWeek(weekTasks),
    };

    // Update or add weekly metric
    const existingWeekIndex = compliance.weeklyMetrics.findIndex(
      m => getWeekNumber(m.week) === weekNum
    );

    if (existingWeekIndex >= 0) {
      compliance.weeklyMetrics[existingWeekIndex] = weeklyMetric;
    } else {
      compliance.weeklyMetrics.push(weeklyMetric);
    }

    // Keep only last 12 weeks
    if (compliance.weeklyMetrics.length > 12) {
      compliance.weeklyMetrics = compliance.weeklyMetrics.slice(-12);
    }

    // Update streaks
    const streak = calculateCurrentStreak(weekTasks, weekCompletedTasks, weekAssignedTasks);
    compliance.currentStreak = streak;

    if (streak > compliance.longestStreak) {
      compliance.longestStreak = streak;
    }

    if (streak > 0) {
      compliance.lastActiveDate = new Date();
      compliance.streakStartDate = compliance.streakStartDate || new Date();
    } else {
      compliance.streakStartDate = null;
    }

    // Calculate consistency index (0-100)
    compliance.consistency_index = calculateConsistencyIndex(compliance.weeklyMetrics);

    // Determine compliance status
    compliance.complianceStatus = determineComplianceStatus(
      compliance.completionRate,
      compliance.consistency_index
    );

    // Add to trend
    compliance.complianceTrend.push({
      date: new Date(),
      score: compliance.completionRate,
      taskCount: totalTasks,
      completedCount: completedTasks,
    });

    // Keep only last 60 days of trend
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    compliance.complianceTrend = compliance.complianceTrend.filter(t => t.date >= sixtyDaysAgo);

    // Save updated compliance
    await compliance.save();

    logger.info(
      `Compliance updated for user ${userId}: ${compliance.completionRate}% complete`
    );

    return compliance;
  } catch (error) {
    logger.error(`Compliance update failed: ${error.message}`);
    throw error;
  }
}

/**
 * Recompute compliance weekly for all active users
 */
async function recomputeWeeklyCompliance(userIds = null) {
  try {
    logger.info('📊 Starting weekly compliance recompute');

    let query = { isActive: true };
    if (userIds?.length) {
      query._id = { $in: userIds };
    }

    const users = await User.find(query).select('_id').lean();

    logger.info(`Recomputing compliance for ${users.length} users`);

    let successCount = 0;
    let failureCount = 0;

    // Process in batches
    const batchSize = 20;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);

      await Promise.all(
        batch.map(user =>
          updateComplianceScore(user._id)
            .then(() => {
              successCount++;
            })
            .catch(error => {
              logger.error(`Compliance recompute failed for user ${user._id}: ${error.message}`);
              failureCount++;
            })
        )
      );
    }

    logger.info(
      `✅ Weekly compliance recompute complete: ${successCount} success, ${failureCount} failed`
    );

    return { successCount, failureCount, totalProcessed: users.length };
  } catch (error) {
    logger.error(`Weekly compliance recompute failed: ${error.message}`);
    throw error;
  }
}

/**
 * Get compliance data for user
 */
async function getUserCompliance(userId) {
  try {
    const compliance = await UserPreparationCompliance.findOne({ userId });

    if (!compliance) {
      return {
        userId,
        completionRate: 0,
        currentStreak: 0,
        consistency_index: 0,
        complianceStatus: 'inactive',
        weeklyMetrics: [],
      };
    }

    return {
      userId: compliance.userId,
      completionRate: compliance.completionRate,
      tasksCompleted: compliance.tasksCompleted,
      tasksAssigned: compliance.tasksAssigned,
      tasksPending: compliance.tasksPending,
      currentStreak: compliance.currentStreak,
      longestStreak: compliance.longestStreak,
      consistency_index: compliance.consistency_index,
      complianceStatus: compliance.complianceStatus,
      averageCompletionTime: compliance.averageCompletionTime,
      averageCompletionScore: compliance.averageCompletionScore,
      lastActiveDate: compliance.lastActiveDate,
      weeklyMetrics: compliance.weeklyMetrics.slice(-4), // Last 4 weeks
      complianceTrend: compliance.complianceTrend.slice(-14), // Last 14 days
    };
  } catch (error) {
    logger.error(`Failed to get compliance for user ${userId}: ${error.message}`);
    throw error;
  }
}

/**
 * Helper: Get week start date (Monday)
 */
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const weekStart = new Date(d.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

/**
 * Helper: Get week end date (Sunday)
 */
function getWeekEnd(date) {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
}

/**
 * Helper: Get week number from date
 */
function getWeekNumber(date) {
  const d = new Date(date);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const diff = d - yearStart;
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.floor(diff / oneDay / 7) + 1;
}

/**
 * Helper: Count active days in week (days with completed tasks)
 */
function getActiveDaysInWeek(weekTasks) {
  if (!weekTasks.length) return 0;

  const activeDates = new Set();
  weekTasks.forEach(task => {
    if (task.completed && task.completedAt) {
      const day = new Date(task.completedAt).toDateString();
      activeDates.add(day);
    }
  });

  return activeDates.size;
}

/**
 * Helper: Calculate current streak
 */
function calculateCurrentStreak(weekTasks, weekCompleted, weekAssigned) {
  // Simplified: streak = consecutive weeks with > 80% completion
  if (weekAssigned === 0) return 0;
  const weekCompletionRate = (weekCompleted / weekAssigned) * 100;
  return weekCompletionRate >= 80 ? 1 : 0;
}

/**
 * Helper: Calculate consistency index (0-100)
 * Based on weekly compliance scores
 */
function calculateConsistencyIndex(weeklyMetrics) {
  if (!weeklyMetrics.length) return 0;

  const recentWeeks = weeklyMetrics.slice(-12); // Last 12 weeks

  if (recentWeeks.length === 0) return 0;

  // Average completion rate across weeks
  const avgCompletion =
    recentWeeks.reduce((sum, w) => sum + w.weeklyComplianceScore, 0) / recentWeeks.length;

  // Standard deviation to measure consistency
  const variance =
    recentWeeks.reduce((sum, w) => sum + Math.pow(w.weeklyComplianceScore - avgCompletion, 2), 0) /
    recentWeeks.length;
  const stdDev = Math.sqrt(variance);

  // High consistency = low variance
  // Inverse relationship: 100 - variance
  const consistency = Math.max(0, 100 - stdDev);

  return Math.round(consistency);
}

/**
 * Helper: Determine compliance status
 */
function determineComplianceStatus(completionRate, consistencyIndex) {
  if (completionRate === 0) return 'inactive';
  if (completionRate >= 80 && consistencyIndex >= 75) return 'excellent';
  if (completionRate >= 60 && consistencyIndex >= 50) return 'good';
  if (completionRate >= 40 && consistencyIndex >= 30) return 'fair';
  return 'poor';
}

module.exports = {
  completeTask,
  updateComplianceScore,
  recomputeWeeklyCompliance,
  getUserCompliance,
};

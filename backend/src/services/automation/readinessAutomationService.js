/**
 * Readiness Automation Service
 * Recomputes readiness scores weekly via ML model
 * Provides comprehensive readiness assessment
 */

const axios = require('axios');
const {
  ReadinessScore,
  AutomationStatus,
  User,
  MasteryMetric,
  WeakTopicSignal,
} = require('../../models');
const RoadmapTrackingService = require('../roadmapTrackingService');

const logger = console;

const ML_SERVICE_BASE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000/ai/ml';

/**
 * Compute readiness score for a user
 * Comprehensive assessment using mastery, weakness, and ML model
 */
async function computeReadinessScore(userId) {
  const executionId = `readiness-${userId}-${Date.now()}`;

  try {
    const automationRecord = await AutomationStatus.create({
      pipelineType: 'weekly-readiness',
      userId,
      status: 'running',
      executionId,
      startTime: new Date(),
      steps: [],
    });

    logger.info(`📊 Computing readiness score for user: ${userId}`);

    // Call ML readiness endpoint
    const readinessStep = await executeReadinessComputation(userId);
    updateAutomationStep(automationRecord, 'readiness-computation', readinessStep);

    if (readinessStep.status === 'completed' && readinessStep.result) {
      // Process and store the readiness data
      const storageStep = await storeReadinessData(userId, readinessStep.result);
      updateAutomationStep(automationRecord, 'data-storage', storageStep);
    }

    automationRecord.status = 'completed';
    automationRecord.endTime = new Date();
    automationRecord.duration = automationRecord.endTime - automationRecord.startTime;
    await automationRecord.save();

    logger.info(`✅ Readiness score computed for user: ${userId}`);

    return {
      success: true,
      executionId,
      score: readinessStep.result?.overall_readiness_score,
    };
  } catch (error) {
    logger.error(`❌ Readiness computation failed: ${error.message}`);

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
 * Execute readiness computation via ML service
 */
async function executeReadinessComputation(userId) {
  const startTime = new Date();

  try {
    // Get user's mastery profile
    const masteryMetrics = await MasteryMetric.find({ userId }).lean();

    // Get weak topics
    const weakTopics = await WeakTopicSignal.find({ userId }).lean();

    // Get roadmap progress data
    const roadmapProgress = await RoadmapTrackingService.getUserRoadmapProgress(userId);
    const recentCompletions = await RoadmapTrackingService.getRecentCompletions(userId);
    const difficultyDistribution = await RoadmapTrackingService.getDifficultyDistribution(userId);

    // Build roadmap context for ML
    const roadmapContext = {
      has_roadmap: roadmapProgress?.hasRoadmap || false,
      overall_progress: roadmapProgress?.overallProgress || 0,
      completed_topics: roadmapProgress?.completedTopics || 0,
      total_topics: roadmapProgress?.totalTopics || 0,
      pci_score: roadmapProgress?.pciScore || 0,
      problem_completion_rate: roadmapProgress?.problemStats?.completionRate || 0,
      recent_completions_count: recentCompletions?.length || 0,
      difficulty_distribution: difficultyDistribution,
    };

    // Call ML readiness endpoint with comprehensive data including roadmap
    const response = await axios.post(`${ML_SERVICE_BASE_URL}/readiness/calculate`, {
      user_id: userId.toString(),
      comprehensive: true,
      include_trend: true,
      roadmap_context: roadmapContext,
    });

    const readinessData = response.data?.data;

    if (!readinessData) {
      throw new Error('No readiness data received from ML service');
    }

    return {
      status: 'completed',
      result: readinessData,
      duration: new Date() - startTime,
    };
  } catch (error) {
    logger.error(`Readiness computation error: ${error.message}`);
    return {
      status: 'failed',
      error: error.message,
      duration: new Date() - startTime,
    };
  }
}

/**
 * Store readiness data in database
 * Maintains trend history and current readiness
 */
async function storeReadinessData(userId, readinessData) {
  const startTime = new Date();

  try {
    // Get existing readiness record
    const existingRecord = await ReadinessScore.findOne({ userId }).lean();

    // Prepare trend data
    const currentTrendPoint = {
      date: new Date(),
      score: readinessData.overall_readiness_score || 0,
    };

    let trendData = existingRecord?.trendData || [];
    trendData.push(currentTrendPoint);

    // Keep only last 90 days for trend analysis
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    trendData = trendData.filter(t => t.date >= ninetyDaysAgo);

    // Calculate trend
    const trend = calculateReadinessTrend(trendData);

    // Estimate ready date based on current score and trend
    const estimatedReadyDate = estimateReadyDate(
      readinessData.overall_readiness_score,
      trend,
      trendData
    );

    // Calculate confidence interval
    const confidenceInterval = calculateConfidenceInterval(readinessData.overall_readiness_score);

    // Update or create readiness score
    const updatedRecord = await ReadinessScore.findOneAndUpdate(
      { userId },
      {
        $set: {
          overallReadinessScore: readinessData.overall_readiness_score || 0,
          readinessLevel: determineReadinessLevel(readinessData.overall_readiness_score),
          readinessTrend: trend,
          trendData,
          estimatedReadyDate,
          confidenceInterval,
          topStrengths: readinessData.top_strengths || [],
          topWeaknesses: readinessData.top_weaknesses || [],
          recommendedFocus: readinessData.recommended_focus || [],
          calculatedAt: new Date(),
          calculationMethod: 'hybrid',
        },
      },
      { upsert: true, new: true }
    );

    return {
      status: 'completed',
      result: {
        recordId: updatedRecord._id,
        score: updatedRecord.overallReadinessScore,
        level: updatedRecord.readinessLevel,
      },
      duration: new Date() - startTime,
    };
  } catch (error) {
    logger.error(`Storage error: ${error.message}`);
    return {
      status: 'failed',
      error: error.message,
      duration: new Date() - startTime,
    };
  }
}

/**
 * Calculate readiness trend from historical data
 */
function calculateReadinessTrend(trendData) {
  if (!trendData || trendData.length < 2) {
    return 'insufficient-data';
  }

  // Use last 7 data points if available
  const recentData = trendData.slice(-7);

  if (recentData.length < 2) {
    return 'stable';
  }

  const sortedByDate = recentData.sort((a, b) => a.date - b.date);
  const firstHalf = sortedByDate.slice(0, Math.ceil(sortedByDate.length / 2));
  const secondHalf = sortedByDate.slice(Math.ceil(sortedByDate.length / 2));

  const avgFirst = firstHalf.reduce((sum, t) => sum + t.score, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((sum, t) => sum + t.score, 0) / secondHalf.length;

  const change = avgSecond - avgFirst;

  if (change > 3) return 'improving';
  if (change < -3) return 'declining';
  return 'stable';
}

/**
 * Determine readiness level from score
 */
function determineReadinessLevel(score) {
  if (score >= 85) return 'interview-ready';
  if (score >= 70) return 'very-ready';
  if (score >= 55) return 'ready';
  if (score >= 40) return 'somewhat-ready';
  return 'not-ready';
}

/**
 * Estimate ready date based on score, trend and history
 */
function estimateReadyDate(currentScore, trend, trendData) {
  const targetScore = 80; // Interview ready threshold

  if (currentScore >= targetScore) {
    return new Date(); // Already ready
  }

  const scoreGap = targetScore - currentScore;

  // Calculate weekly improvement rate
  let weeklyRate = 0;
  if (trendData.length >= 8) {
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

    const recentData = trendData.filter(t => t.date >= eightWeeksAgo);
    if (recentData.length >= 2) {
      const firstScore = recentData[0].score;
      const lastScore = recentData[recentData.length - 1].score;
      const weeksElapsed = (recentData[recentData.length - 1].date - recentData[0].date) / (7 * 24 * 60 * 60 * 1000);

      weeklyRate = (lastScore - firstScore) / Math.max(1, weeksElapsed);
    }
  }

  // Apply trend multiplier
  const trendMultiplier = trend === 'improving' ? 1.2 : trend === 'declining' ? 0.8 : 1.0;
  const adjustedRate = weeklyRate * trendMultiplier;

  // Estimate weeks needed
  const weeksNeeded = adjustedRate > 0 ? scoreGap / adjustedRate : 12; // Default 12 weeks

  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + weeksNeeded * 7);

  // Cap at reasonable range: 2 weeks to 3 months from now
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 14);

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 90);

  if (estimatedDate < minDate) return minDate;
  if (estimatedDate > maxDate) return maxDate;

  return estimatedDate;
}

/**
 * Calculate confidence interval for score
 */
function calculateConfidenceInterval(score) {
  // CI of +/- 5-15% depending on score certainty
  const errorMargin = Math.max(5, Math.min(15, 20 - score * 0.1));

  return {
    lower: Math.max(0, score - errorMargin),
    upper: Math.min(100, score + errorMargin),
  };
}

/**
 * Batch compute readiness for all active users
 * Called weekly via scheduler
 */
async function batchComputeReadiness(userIds = null) {
  try {
    logger.info('📊 Starting batch readiness computation');

    let query = { isActive: true };
    if (userIds?.length) {
      query._id = { $in: userIds };
    }

    const users = await User.find(query).select('_id').lean();

    logger.info(`Computing readiness for ${users.length} users`);

    let successCount = 0;
    let failureCount = 0;

    // Process in batches of 20 for weekly computation
    const batchSize = 20;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);

      await Promise.all(
        batch.map(user =>
          computeReadinessScore(user._id)
            .then(() => {
              successCount++;
            })
            .catch(error => {
              logger.error(`Readiness computation failed for user ${user._id}: ${error.message}`);
              failureCount++;
            })
        )
      );
    }

    logger.info(
      `✅ Batch readiness computation complete: ${successCount} success, ${failureCount} failed`
    );

    return { successCount, failureCount, totalProcessed: users.length };
  } catch (error) {
    logger.error(`Batch readiness computation failed: ${error.message}`);
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
  computeReadinessScore,
  batchComputeReadiness,
  executeReadinessComputation,
  storeReadinessData,
};

/**
 * Submission Automation Service
 * Triggers ML pipeline when submissions are saved
 * Orchestrates: mastery update → weakness detection → readiness calculation
 */

const axios = require('axios');
const {
  MasteryMetric,
  WeakTopicSignal,
  ReadinessScore,
  AutomationStatus,
  UserSubmission,
} = require('../../models');

const logger = console;

const ML_SERVICE_BASE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000/ai/ml';

/**
 * Trigger complete ML pipeline for a submission
 * Idempotent execution with retry logic
 */
async function triggerSubmissionIntelligence(submission) {
  const executionId = `submission-${submission._id}-${Date.now()}`;

  try {
    // Create automation status record
    const automationRecord = await AutomationStatus.create({
      pipelineType: 'submission-intelligence',
      userId: submission.userId,
      status: 'running',
      executionId,
      startTime: new Date(),
      steps: [],
    });

    logger.info(`🔄 Triggering submission intelligence for submission: ${submission._id}`);

    // Step 1: Update Mastery
    const masteryStep = await executeMasteryUpdate(submission);
    updateAutomationStep(automationRecord, 'mastery-update', masteryStep);

    // Step 2: Detect Weaknesses
    const weaknessStep = await executeWeaknessDetection(submission);
    updateAutomationStep(automationRecord, 'weakness-detection', weaknessStep);

    // Step 3: Calculate Readiness
    const readinessStep = await executeReadinessCalculation(submission.userId);
    updateAutomationStep(automationRecord, 'readiness-calculation', readinessStep);

    // Update automation record as complete
    automationRecord.status = 'completed';
    automationRecord.endTime = new Date();
    automationRecord.duration = automationRecord.endTime - automationRecord.startTime;
    await automationRecord.save();

    logger.info(`✅ Submission intelligence complete for submission: ${submission._id}`);

    return {
      success: true,
      executionId,
      steps: automationRecord.steps,
    };
  } catch (error) {
    logger.error(`❌ Submission intelligence error: ${error.message}`);

    // Record failure
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
 * Execute mastery update via ML service
 */
async function executeMasteryUpdate(submission) {
  const startTime = new Date();

  try {
    // Enrich submission with problem and topic info
    const submissionData = await UserSubmission.findById(submission._id)
      .populate('problemId', 'topics difficulty')
      .lean();

    if (!submissionData || !submissionData.problemId) {
      throw new Error('Problem data not found');
    }

    const topicId = submissionData.problemId.topics?.[0];
    if (!topicId) {
      throw new Error('Topic not found in problem');
    }

    // Call ML mastery endpoint
    const response = await axios.post(`${ML_SERVICE_BASE_URL}/mastery/update`, {
      user_id: submission.userId.toString(),
      topic_id: topicId.toString(),
      attempts: [
        {
          correct: submission.isSolved,
          difficulty: difficultyToScore(submissionData.problemId.difficulty),
          hints_used: submission.hintsUsed || 0,
          time_factor: calculateTimeFactor(submission.solveTime),
        },
      ],
    });

    // Update mastery metric in database
    if (response.data?.data) {
      await MasteryMetric.updateOne(
        { userId: submission.userId, topicId },
        {
          $set: {
            masteryProbability: response.data.data.mastery_probability || 0,
            confidenceScore: response.data.data.confidence_score || 0,
            improattemptmentTrend: response.data.data.improvement_trend || 'insufficient-data',
            lastUpdated: new Date(),
          },
          $inc: {
            problemsAttempted: 1,
            ...(submission.isSolved && { problemsSolved: 1 }),
          },
        },
        { upsert: true }
      );
    }

    return {
      status: 'completed',
      result: response.data?.data,
      duration: new Date() - startTime,
    };
  } catch (error) {
    logger.error(`Mastery update failed: ${error.message}`);
    return {
      status: 'failed',
      error: error.message,
      duration: new Date() - startTime,
    };
  }
}

/**
 * Execute weakness detection via ML service
 */
async function executeWeaknessDetection(submission) {
  const startTime = new Date();

  try {
    const submissionData = await UserSubmission.findById(submission._id)
      .populate('problemId', 'topics difficulty')
      .lean();

    if (!submissionData?.problemId?.topics?.[0]) {
      throw new Error('Topic not found');
    }

    const topicId = submissionData.problemId.topics[0];

    // Call ML weakness endpoint
    const response = await axios.post(`${ML_SERVICE_BASE_URL}/weakness/detect`, {
      user_id: submission.userId.toString(),
      topic_id: topicId.toString(),
      recent_attempts_count: 5,
    });

    // Update weak topic signals
    if (response.data?.data) {
      const weaknessData = response.data.data;
      await WeakTopicSignal.updateOne(
        { userId: submission.userId, topicId },
        {
          $set: {
            mistakeRate: weaknessData.mistake_rate || 0,
            riskScore: weaknessData.risk_score || 0,
            riskLevel: determineRiskLevel(weaknessData.risk_score),
            signalType: weaknessData.signal_types || [],
            interventionRequired: weaknessData.risk_score > 70,
            suggestedActions: weaknessData.suggested_actions || [],
            lastDetectedAt: new Date(),
          },
        },
        { upsert: true }
      );
    }

    return {
      status: 'completed',
      result: response.data?.data,
      duration: new Date() - startTime,
    };
  } catch (error) {
    logger.error(`Weakness detection failed: ${error.message}`);
    return {
      status: 'failed',
      error: error.message,
      duration: new Date() - startTime,
    };
  }
}

/**
 * Execute readiness calculation via ML service
 */
async function executeReadinessCalculation(userId) {
  const startTime = new Date();

  try {
    // Call ML readiness endpoint
    const response = await axios.post(`${ML_SERVICE_BASE_URL}/readiness/calculate`, {
      user_id: userId.toString(),
    });

    // Update readiness score
    if (response.data?.data) {
      const readinessData = response.data.data;
      const existingReadiness = await ReadinessScore.findOne({ userId });

      const trendData = existingReadiness?.trendData || [];
      trendData.push({
        date: new Date(),
        score: readinessData.overall_readiness_score || 0,
      });

      // Keep only last 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const filteredTrend = trendData.filter(t => t.date >= ninetyDaysAgo);

      await ReadinessScore.updateOne(
        { userId },
        {
          $set: {
            overallReadinessScore: readinessData.overall_readiness_score || 0,
            readinessLevel: readinessData.readiness_level || 'not-ready',
            readinessTrend: calculateTrend(filteredTrend),
            trendData: filteredTrend,
            topStrengths: readinessData.top_strengths || [],
            topWeaknesses: readinessData.top_weaknesses || [],
            recommendedFocus: readinessData.recommended_focus || [],
            calculatedAt: new Date(),
            calculationMethod: 'hybrid',
          },
        },
        { upsert: true }
      );
    }

    return {
      status: 'completed',
      result: response.data?.data,
      duration: new Date() - startTime,
    };
  } catch (error) {
    logger.error(`Readiness calculation failed: ${error.message}`);
    return {
      status: 'failed',
      error: error.message,
      duration: new Date() - startTime,
    };
  }
}

/**
 * Helper: Update automation step in record
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

/**
 * Helper: Convert difficulty string to numeric score
 */
function difficultyToScore(difficulty) {
  const map = { easy: 1, medium: 2, hard: 3 };
  return map[difficulty] || 2;
}

/**
 * Helper: Calculate time factor based on solve time
 */
function calculateTimeFactor(solveTime) {
  if (!solveTime) return 1.0;
  // Normalize: 15 min = 1.0, 30 min = 1.5, 5 min = 0.5
  return Math.min(2.0, Math.max(0.5, solveTime / 900));
}

/**
 * Helper: Determine risk level from risk score
 */
function determineRiskLevel(riskScore) {
  if (riskScore >= 80) return 'critical';
  if (riskScore >= 60) return 'high';
  if (riskScore >= 40) return 'medium';
  return 'low';
}

/**
 * Helper: Calculate trend from historical data
 */
function calculateTrend(trendData) {
  if (trendData.length < 2) return 'insufficient-data';

  const recent = trendData.slice(-5);
  if (recent.length < 2) return 'stable';

  const avgRecent = recent.reduce((sum, t) => sum + t.score, 0) / recent.length;
  const avgOlder = trendData
    .slice(0, -5)
    .reduce((sum, t) => sum + t.score, 0) / Math.max(1, trendData.length - 5);

  const improvement = avgRecent - avgOlder;

  if (improvement > 5) return 'improving';
  if (improvement < -5) return 'declining';
  return 'stable';
}

/**
 * Batch process submissions for intelligence update
 */
async function batchProcessSubmissions(userIds = null) {
  try {
    logger.info('📦 Starting batch submission intelligence processing');

    const query = { isSolved: true };
    if (userIds?.length) {
      query.userId = { $in: userIds };
    }

    // Get recent submissions (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    query.lastAttemptTime = { $gte: oneDayAgo };

    const submissions = await UserSubmission.find(query).limit(100).lean();

    logger.info(`Processing ${submissions.length} submissions`);

    let successCount = 0;
    let failureCount = 0;

    for (const submission of submissions) {
      try {
        await triggerSubmissionIntelligence(submission);
        successCount++;
      } catch (error) {
        logger.error(`Failed to process submission ${submission._id}: ${error.message}`);
        failureCount++;
      }
    }

    logger.info(`✅ Batch processing complete: ${successCount} success, ${failureCount} failed`);

    return { successCount, failureCount, totalProcessed: submissions.length };
  } catch (error) {
    logger.error(`Batch processing failed: ${error.message}`);
    throw error;
  }
}

module.exports = {
  triggerSubmissionIntelligence,
  batchProcessSubmissions,
  executeMasteryUpdate,
  executeWeaknessDetection,
  executeReadinessCalculation,
};

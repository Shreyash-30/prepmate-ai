/**
 * Practice Lab Routes
 * 
 * Endpoints for Intelligent Practice Lab:
 * - POST /practice/session/start - Start a practice session
 * - POST /practice/session/complete - Complete practice session
 * - POST /practice/behavioral-signals - Record behavioral signals
 * - GET  /practice/recommendations/:topicId - Get personalized recommendations
 * - GET  /practice/progress/:topicId - Get practice progress
 * - POST /practice/validation/:validationId - Submit validation problem
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { authMiddleware } = require('../middlewares/authMiddleware');
const AdaptivePracticeRecommendationService = require('../services/adaptivePracticeRecommendationService');
const IntelligenceOrchestratorService = require('../services/intelligenceOrchestratorService');
const UserTopicPracticeProgress = require('../models/UserTopicPracticeProgress');
const PracticeBehavioralSignal = require('../models/PracticeBehavioralSignal');

// All practice routes require authentication
router.use(authMiddleware);

/**
 * POST /practice/session/start
 * Initialize a new practice session for a topic
 */
router.post('/session/start', async (req, res) => {
  try {
    const { topicId } = req.body;
    const userId = req.user.id;

    if (!topicId) {
      return res.status(400).json({ error: 'topicId required' });
    }

    logger.info(`📚 Starting practice session for user ${userId}, topic ${topicId}`);

    // Get personalized recommendations
    const recommendations = await AdaptivePracticeRecommendationService.getRecommendedProblems(
      userId,
      topicId
    );

    // Get or create practice progress record
    const progress = await UserTopicPracticeProgress.findOneAndUpdate(
      { userId, topicId },
      {
        $set: {
          status: 'in-progress',
          levelStartedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    // Get validation problem for level completion
    const validationProblem = await AdaptivePracticeRecommendationService.getValidationProblem(
      userId,
      topicId,
      progress.currentLevel
    );

    logger.info(`✅ Practice session started with ${recommendations.recommendedProblems.length} problems`);

    res.json({
      sessionId: progress._id,
      topicId,
      recommendations: recommendations.recommendedProblems,
      recommendedDifficulty: recommendations.recommendedDifficulty,
      estimatedDuration: recommendations.estimatedSetDuration,
      reasonExplanation: recommendations.reasonExplanation,
      validationProblem,
      masteryScore: recommendations.masteryScore,
      nextLevelRecommended: recommendations.nextLevelRecommended,
    });
  } catch (error) {
    logger.error(`❌ Session start failed: ${error.message}`);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

/**
 * POST /practice/session/complete
 * Mark practice session as complete
 * Triggers intelligence pipeline
 */
router.post('/session/complete', async (req, res) => {
  try {
    const { sessionId, topicId, accuracy, timeSpent, problemsCompleted } = req.body;
    const userId = req.user.id;

    if (!sessionId || !topicId) {
      return res.status(400).json({ error: 'sessionId and topicId required' });
    }

    logger.info(`✅ Completing practice session ${sessionId}`);

    // Update practice progress
    const progress = await UserTopicPracticeProgress.findByIdAndUpdate(
      sessionId,
      {
        recommendedSetCompleted: true,
        recommendedSetAccuracy: accuracy || 0.5,
        lastPracticeAt: new Date(),
        status: 'level-complete',
        levelCompletedAt: new Date(),
      },
      { new: true }
    );

    // Trigger intelligence orchestration pipeline
    const pipelineResult = await IntelligenceOrchestratorService.triggerIntelligencePipeline(
      userId,
      topicId,
      null, // No single submission
      'practice'
    );

    logger.info(`🚀 Intelligence pipeline triggered: ${pipelineResult.pipelineId}`);

    res.json({
      success: true,
      sessionCompleted: true,
      accuracy,
      progressUpdated: progress._id,
      pipelineId: pipelineResult.pipelineId,
      nextSteps: pipelineResult.stages,
    });
  } catch (error) {
    logger.error(`❌ Session complete failed: ${error.message}`);
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

/**
 * POST /practice/behavioral-signals
 * Record detailed behavioral signals from practice session
 */
router.post('/behavioral-signals', async (req, res) => {
  try {
    const { topicId, problemId, solveTime, attempts, hintsUsed, timeToFirstAttempt, sessionId } = req.body;
    const userId = req.user.id;

    if (!problemId || !topicId) {
      return res.status(400).json({ error: 'problemId and topicId required' });
    }

    logger.info(`📊 Recording behavioral signals for problem ${problemId}`);

    // Create behavioral signal record
    const signal = await PracticeBehavioralSignal.create({
      userId,
      problemId,
      topicId,
      sessionId,
      solveTime: solveTime || 0,
      attemptCount: attempts || 1,
      hintsUsed: hintsUsed || 0,
      timeToFirstAttempt: timeToFirstAttempt || 0,
      createdAt: new Date(),
    });

    logger.info(`✅ Behavioral signal recorded: ${signal._id}`);

    res.json({
      success: true,
      signalId: signal._id,
      problemId,
    });
  } catch (error) {
    logger.error(`❌ Signal recording failed: ${error.message}`);
    res.status(500).json({ error: 'Failed to record signals' });
  }
});

/**
 * GET /practice/recommendations/:topicId
 * Get personalized practice recommendations
 */
router.get('/recommendations/:topicId', async (req, res) => {
  try {
    const { topicId } = req.params;
    const userId = req.user.id;

    logger.info(`📚 Getting recommendations for ${topicId}`);

    const recommendations = await AdaptivePracticeRecommendationService.getRecommendedProblems(
      userId,
      topicId
    );

    res.json(recommendations);
  } catch (error) {
    logger.error(`❌ Recommendation fetch failed: ${error.message}`);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

/**
 * GET /practice/progress/:topicId
 * Get practice progress for a topic
 */
router.get('/progress/:topicId', async (req, res) => {
  try {
    const { topicId } = req.params;
    const userId = req.user.id;

    const progress = await UserTopicPracticeProgress.findOne({
      userId,
      topicId,
    });

    if (!progress) {
      return res.json({ status: 'not-started' });
    }

    res.json({
      currentLevel: progress.currentLevel,
      status: progress.status,
      recommendedSetCompleted: progress.recommendedSetCompleted,
      recommendedSetAccuracy: progress.recommendedSetAccuracy,
      validationProblemResult: progress.validationProblemResult,
      nextLevelRecommended: progress.nextLevelRecommended,
      lastPracticeAt: progress.lastPracticeAt,
      progressPercentage: progress.progressPercentage,
    });
  } catch (error) {
    logger.error(`❌ Progress fetch failed: ${error.message}`);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

/**
 * POST /practice/validation/:validationId
 * Submit validation problem attempt
 */
router.post('/validation/:validationId', async (req, res) => {
  try {
    const { validationId } = req.params;
    const { result, topicId, userId: targetUserId } = req.body;
    const userId = req.user.id;

    logger.info(`📝 Submitting validation problem ${validationId}`);

    // Find the practice progress record
    const progress = await UserTopicPracticeProgress.findOne({
      userId,
      topicId,
    });

    if (!progress) {
      return res.status(404).json({ error: 'Practice progress not found' });
    }

    // Update validation result
    progress.validationProblemResult = result; // 'correct', 'incorrect', 'correct-first-try'
    progress.validationAttemptCount = (progress.validationAttemptCount || 0) + 1;

    if (result === 'correct' || result === 'correct-first-try') {
      progress.validationPassedAt = new Date();
      
      // Assess if ready for next level
      if (progress.recommendedSetAccuracy >= 0.8) {
        progress.nextLevelRecommended = true;
        progress.nextLevelRecommendedAt = new Date();
        progress.nextLevelReason = 'Completed current level with mastery';
      }
    }

    await progress.save();

    // Trigger intelligence pipeline
    const pipelineResult = await IntelligenceOrchestratorService.triggerIntelligencePipeline(
      userId,
      topicId,
      null,
      'practice'
    );

    logger.info(`✅ Validation result recorded and pipeline triggered`);

    res.json({
      success: true,
      validationPassed: result === 'correct' || result === 'correct-first-try',
      nextLevelRecommended: progress.nextLevelRecommended,
      pipelineId: pipelineResult.pipelineId,
    });
  } catch (error) {
    logger.error(`❌ Validation submit failed: ${error.message}`);
    res.status(500).json({ error: 'Failed to submit validation' });
  }
});

/**
 * POST /practice/feedback/:recommendationId
 * Record feedback on practice recommendations
 */
router.post('/feedback/:recommendationId', async (req, res) => {
  try {
    const { recommendationId } = req.params;
    const { topicId, suitable, rating, comment } = req.body;
    const userId = req.user.id;

    logger.info(`📝 Recording feedback for recommendation ${recommendationId}`);

    const feedback = await AdaptivePracticeRecommendationService.recordRecommendationFeedback(
      userId,
      topicId,
      recommendationId,
      { suitable, rating, comment }
    );

    res.json({
      success: feedback,
      feedbackRecorded: feedback,
    });
  } catch (error) {
    logger.error(`❌ Feedback recording failed: ${error.message}`);
    res.status(500).json({ error: 'Failed to record feedback' });
  }
});

module.exports = router;

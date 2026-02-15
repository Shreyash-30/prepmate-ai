/**
 * Integrated Intelligence Endpoints
 * Single point of access for all intelligence features
 * 
 * Routes:
 * GET  /api/intelligence/profile/:userId - Complete learner profile
 * GET  /api/intelligence/recommendations/:userId - Unified recommendations
 * GET  /api/intelligence/dashboard/:userId - Dashboard intelligence
 * POST /api/intelligence/hint - Generate hint
 * POST /api/intelligence/explain-mistake - Explain error
 * POST /api/intelligence/tutor - Mentor chat
 * GET  /api/intelligence/readiness/:userId - Interview readiness
 */

const logger = require('../utils/logger');
const UnifiedLLMService = require('../services/intelligenceCore/unifiedLLMService');
const LearnerIntelligenceProfile = require('../services/intelligenceCore/learnerIntelligenceProfile');
const RecommendationDecisionService = require('../services/intelligenceCore/recommendationDecisionService');
const mongoose = require('mongoose');

const llmService = new UnifiedLLMService();
const profileService = new LearnerIntelligenceProfile();
const recommendationEngine = new RecommendationDecisionService();

/**
 * GET /api/intelligence/profile/:userId
 * Get complete learner intelligence profile
 */
exports.getLearnerProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify authorization
    if (req.user?.id !== userId && !req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const profile = await profileService.getProfile(userId);

    return res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    logger.error(`Error getting learner profile: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET /api/intelligence/recommendations/:userId
 * Get unified recommendations
 */
exports.getRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type = 'all' } = req.query; // 'practice', 'revision', 'interview', 'all'

    if (req.user?.id !== userId && !req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const recommendations = await recommendationEngine.generateRecommendations(userId);

    if (type !== 'all') {
      recommendations[type] = recommendations[type];
    }

    return res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    logger.error(`Error getting recommendations: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET /api/intelligence/dashboard/:userId
 * Get dashboard intelligence summary
 */
exports.getDashboardIntelligence = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user?.id !== userId && !req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const profile = await profileService.getProfile(userId);
    const recommendations = await recommendationEngine.getRecommendations(userId);

    const dashboard = {
      skillIntelligence: profile.components?.skillIntelligence,
      performanceIntelligence: profile.components?.performanceIntelligence,
      behavioralIntelligence: profile.components?.behavioralIntelligence,
      readiness: profile.components?.readiness,
      topRecommendations: {
        practice: recommendations.practice?.slice(0, 3),
        revision: recommendations.revision?.slice(0, 2),
        interview: recommendations.interview?.slice(0, 2)
      },
      lastUpdated: profile.timestamp
    };

    return res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    logger.error(`Error getting dashboard intelligence: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * POST /api/intelligence/hint
 * Generate contextual hint
 */
exports.generateHint = async (req, res) => {
  try {
    const userId = req.user?.id;
    const {
      problemId,
      problemDescription,
      userAttempt,
      hintsCount = 0,
      masteryLevel = 'beginner'
    } = req.body;

    const result = await llmService.generateHint({
      userId,
      problemId,
      problemDescription,
      userAttempt,
      hintsCount,
      masteryLevel
    });

    if (!result.success) {
      return res.status(500).json(result);
    }

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Error generating hint: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * POST /api/intelligence/explain-mistake
 * Explain mistake and provide feedback
 */
exports.explainMistake = async (req, res) => {
  try {
    const userId = req.user?.id;
    const {
      problemId,
      problemDescription,
      userCode,
      expectedOutput,
      actualOutput,
      errorMessage,
      language,
      topic
    } = req.body;

    const result = await llmService.explainMistake({
      userId,
      problemId,
      problemDescription,
      userCode,
      expectedOutput,
      actualOutput,
      errorMessage,
      language,
      topic
    });

    if (!result.success) {
      return res.status(500).json(result);
    }

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Error explaining mistake: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * POST /api/intelligence/tutor
 * Mentor/tutoring chat
 */
exports.tutorChat = async (req, res) => {
  try {
    const userId = req.user?.id;
    const {
      topic,
      userMessage,
      masteryLevel = 'beginner',
      conversationId,
      previousContext = []
    } = req.body;

    const result = await llmService.generateTutoringAssistance({
      userId,
      topic,
      userMessage,
      masteryLevel,
      previousContext
    });

    if (!result.success) {
      return res.status(500).json(result);
    }

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Error in tutor chat: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * POST /api/intelligence/code-review
 * Generate code review feedback
 */
exports.generateCodeReview = async (req, res) => {
  try {
    const userId = req.user?.id;
    const {
      code,
      problemDescription,
      language,
      difficulty,
      topic
    } = req.body;

    const result = await llmService.generateCodeReview({
      userId,
      code,
      problemDescription,
      language,
      difficulty,
      topic
    });

    if (!result.success) {
      return res.status(500).json(result);
    }

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Error generating code review: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET /api/intelligence/readiness/:userId
 * Get interview readiness score
 */
exports.getReadinessScore = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user?.id !== userId && !req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const profile = await profileService.getProfile(userId);
    const readiness = profile.components?.readiness;

    if (!readiness) {
      return res.status(404).json({
        success: false,
        error: 'No readiness data available'
      });
    }

    return res.json({
      success: true,
      data: readiness
    });
  } catch (error) {
    logger.error(`Error getting readiness score: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * POST /api/intelligence/practice-problems
 * Get next practice problems based on intelligence
 */
exports.getNextPracticeProblems = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { count = 3 } = req.body;

    const problems = await recommendationEngine.getNextPracticeProblems(userId, count);

    return res.json({
      success: true,
      data: problems
    });
  } catch (error) {
    logger.error(`Error getting practice problems: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * POST /api/intelligence/revision-problems
 * Get revision problems based on retention signals
 */
exports.getRevisionProblems = async (req, res) => {
  try {
    const userId = req.user?.id;

    const recommendations = await recommendationEngine.generateRecommendations(userId);
    const revisionRecommendations = recommendations.revision || [];

    return res.json({
      success: true,
      data: revisionRecommendations
    });
  } catch (error) {
    logger.error(`Error getting revision problems: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET /api/intelligence/behavior/:userId
 * Get behavioral intelligence
 */
exports.getBehavioralIntelligence = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user?.id !== userId && !req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const profile = await profileService.getProfile(userId);
    const behavioral = profile.components?.behavioralIntelligence;

    return res.json({
      success: true,
      data: behavioral
    });
  } catch (error) {
    logger.error(`Error getting behavioral intelligence: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * POST /api/intelligence/batch-recompute/:userId
 * Trigger full intelligence recomputation
 * Admin only - heavy operation
 */
exports.triggerBatchRecompute = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin only'
      });
    }

    const result = await profileService.recomputeFullProfile(userId);

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Error in batch recompute: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

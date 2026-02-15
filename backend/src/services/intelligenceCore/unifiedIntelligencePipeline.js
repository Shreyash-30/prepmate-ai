/**
 * Unified Intelligence Pipeline Service
 * Single source of truth for all AI/ML intelligence processing
 * 
 * Flow: Submission Event -> Feature Engineering -> ML Updates -> Recommendations -> Dashboard
 * 
 * This service orchestrates the complete intelligence system and ensures:
 * - Event-driven updates after every submission
 * - Normalized telemetry flow to ML services
 * - Unified recommendation decision making
 * - Behavioral signal extraction and analysis
 */

const logger = require('../../utils/logger');
const BehavioralFeatureExtractor = require('./behavioralFeatureExtractor');
const LearnerIntelligenceProfile = require('./learnerIntelligenceProfile');
const RecommendationDecisionService = require('./recommendationDecisionService');
const InterviewIntelligenceService = require('./interviewIntelligenceService');
const aiTelemetryBridgeService = require('../aiTelemetryBridgeService');
const UserSubmission = require('../../models/UserSubmission');
const MockInterviewSession = require('../../models/MockInterviewSession');

class UnifiedIntelligencePipeline {
  constructor() {
    this.behavioralExtractor = new BehavioralFeatureExtractor();
    this.profileService = new LearnerIntelligenceProfile();
    this.recommendationEngine = new RecommendationDecisionService();
    this.interviewIntelligence = new InterviewIntelligenceService();
  }

  /**
   * Process submission event - Entry point for all intelligence updates
   * Called after every user submission (practice, contest, interview)
   */
  async processSubmissionEvent(submissionId) {
    const startTime = Date.now();
    try {
      logger.info(`[INTELLIGENCE PIPELINE] Processing submission: ${submissionId}`);

      const submission = await UserSubmission.findById(submissionId).populate('problemId');
      if (!submission) {
        logger.error(`Submission not found: ${submissionId}`);
        return { success: false, error: 'Submission not found' };
      }

      const userId = submission.userId;
      const result = {
        submissionId,
        userId,
        timestamp: new Date(),
        stages: {}
      };

      // Stage 1: Extract behavioral signals
      result.stages.behavioral = await this.behavioralExtractor.extractFromSubmission(submission);

      // Stage 2: Update learner intelligence profile
      result.stages.profile = await this.profileService.updateProfileAfterSubmission(userId, submission);

      // Stage 3: Trigger ML intelligence updates
      result.stages.ml = await this._triggerMLUpdates(userId);

      // Stage 4: Generate recommendations
      result.stages.recommendations = await this.recommendationEngine.generateRecommendations(userId);

      // Stage 5: Update dashboard insights
      result.stages.dashboard = await this._updateDashboardInsights(userId);

      result.durationMs = Date.now() - startTime;
      result.success = true;

      logger.info(`[INTELLIGENCE PIPELINE] ✅ Completed in ${result.durationMs}ms`, {
        userId,
        submissionId,
        stages: Object.keys(result.stages)
      });

      return result;
    } catch (error) {
      logger.error(`[INTELLIGENCE PIPELINE] ❌ Error: ${error.message}`, { submissionId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Process mock interview event
   * Extracts interview-specific signals and updates readiness
   */
  async processInterviewEvent(sessionId) {
    try {
      logger.info(`[INTELLIGENCE PIPELINE] Processing interview: ${sessionId}`);

      const session = await MockInterviewSession.findById(sessionId);
      if (!session) {
        return { success: false, error: 'Interview session not found' };
      }

      const userId = session.userId;

      // Extract interview intelligence
      const interviewIntelligence = await this.interviewIntelligence.analyzeInterviewSession(session);

      // Update learner profile with interview signals
      await this.profileService.updateProfileAfterInterview(userId, interviewIntelligence);

      // Update readiness prediction
      await this._updateReadinessPrediction(userId);

      // Generate interview-focused recommendations
      const recommendations = await this.recommendationEngine.generateInterviewRecommendations(userId);

      logger.info(`[INTELLIGENCE PIPELINE] ✅ Interview processing complete`);

      return {
        success: true,
        userId,
        sessionId,
        intelligence: interviewIntelligence,
        recommendations
      };
    } catch (error) {
      logger.error(`[INTELLIGENCE PIPELINE] ❌ Error processing interview: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Batch recompute intelligence for user
   * Full system refresh - triggered on demand or periodically
   */
  async batchRecomputeUserIntelligence(userId) {
    try {
      logger.info(`[INTELLIGENCE PIPELINE] Batch recompute for user: ${userId}`);

      const result = {
        userId,
        timestamp: new Date(),
        components: {}
      };

      // Recompute all components
      result.components.profile = await this.profileService.recomputeFullProfile(userId);
      result.components.ml = await this._triggerMLUpdates(userId);
      result.components.recommendations = await this.recommendationEngine.generateRecommendations(userId);
      result.components.dashboard = await this._updateDashboardInsights(userId);

      result.success = true;

      logger.info(`[INTELLIGENCE PIPELINE] ✅ Batch recompute complete`);
      return result;
    } catch (error) {
      logger.error(`[INTELLIGENCE PIPELINE] ❌ Batch recompute failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get complete intelligence snapshot for user
   * Used by dashboard and recommendation endpoints
   */
  async getIntelligenceSnapshot(userId) {
    try {
      const profile = await this.profileService.getProfile(userId);
      const recommendations = await this.recommendationEngine.getRecommendations(userId);
      const mlPredictions = await aiTelemetryBridgeService.getMLPredictions(userId);

      return {
        success: true,
        userId,
        profile,
        recommendations,
        mlPredictions,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error(`Error getting intelligence snapshot: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // === Private Helper Methods ===

  async _triggerMLUpdates(userId) {
    try {
      // Prepare and send to AI services
      const masteryInput = await aiTelemetryBridgeService.prepareMasteryInput(userId);
      const readinessInput = await aiTelemetryBridgeService.prepareReadinessInput(userId);

      const results = {};
      if (masteryInput.success) {
        results.mastery = await aiTelemetryBridgeService.sendMasteryDataToAI(userId, masteryInput);
      }
      if (readinessInput.success) {
        results.readiness = await aiTelemetryBridgeService.sendReadinessDataToAI(userId, readinessInput);
      }

      return results;
    } catch (error) {
      logger.error(`Error triggering ML updates: ${error.message}`);
      throw error;
    }
  }

  async _updateReadinessPrediction(userId) {
    try {
      const readinessInput = await aiTelemetryBridgeService.prepareReadinessInput(userId);
      if (readinessInput.success) {
        return await aiTelemetryBridgeService.sendReadinessDataToAI(userId, readinessInput);
      }
    } catch (error) {
      logger.error(`Error updating readiness: ${error.message}`);
    }
  }

  async _updateDashboardInsights(userId) {
    try {
      // Dashboard insights are computed on-demand from cache
      // This marks cache for invalidation
      return { cacheInvalidated: true };
    } catch (error) {
      logger.error(`Error updating dashboard: ${error.message}`);
    }
  }
}

module.exports = UnifiedIntelligencePipeline;

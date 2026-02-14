/**
 * AI Telemetry Bridge Service
 * Connects MongoDB telemetry data to AI services for ML processing
 * Handles data transformation and pipeline management
 */

const axios = require('axios');
const logger = require('../utils/logger');
const Problem = require('../models/Problem');
const UserSubmission = require('../models/UserSubmission');
const UserRoadmapProgress = require('../models/UserRoadmapProgress');

class AIMasterybridgeService {
  constructor() {
    this.aiServiceUrl = process.env.AI_SERVICES_URL || 'http://localhost:8000';
    this.maxRetries = 3;
    this.retryDelay = 2000;
  }

  /**
   * Prepare mastery input for AI model
   * Collects user submissions and problem data
   */
  async prepareMasteryInput(userId) {
    try {
      logger.info(`Preparing mastery input for user ${userId}`);

      // Get user submissions
      const submissions = await UserSubmission.find({ userId })
        .populate('problemId')
        .sort({ submittedAt: -1 })
        .limit(500);

      if (submissions.length === 0) {
        logger.warn(`No submissions found for user ${userId}`);
        return { success: false, reason: 'no_submissions' };
      }

      // Transform submissions to mastery features
      const masteryData = submissions.map((sub) => ({
        problemId: sub.problemId._id.toString(),
        platformSubmissionId: sub.platformSubmissionId,
        platform: sub.platform,
        difficulty: sub.problemId.difficulty,
        successRate: sub.successRate || 0,
        avgTimeSeconds: sub.avgTimeMs ? sub.avgTimeMs / 1000 : 0,
        attemptsCount: sub.attemptsCount || 1,
        lastSubmittedAt: sub.submittedAt,
        topicTags: sub.problemId.topicTags || [],
        isCorrect: sub.isCorrect,
        hints_used: sub.hintsUsed || 0,
      }));

      // Get statistics
      const correctCount = masteryData.filter((m) => m.isCorrect).length;
      const totalCount = masteryData.length;
      const avgAttemptsBeforeSuccess = Math.ceil(
        masteryData.filter((m) => m.isCorrect).reduce((sum, m) => sum + m.attemptsCount, 0) /
          correctCount
      );

      return {
        success: true,
        userId,
        submissionCount: totalCount,
        correctCount,
        successRate: (correctCount / totalCount) * 100,
        masteryData,
        stats: {
          avgAttemptsBeforeSuccess,
          avgTimePerProblem: Math.round(
            masteryData.reduce((sum, m) => sum + m.avgTimeSeconds, 0) / totalCount
          ),
          topicDistribution: this.calculateTopicDistribution(masteryData),
        },
      };
    } catch (error) {
      logger.error(`Error preparing mastery input: ${error.message}`);
      throw error;
    }
  }

  /**
   * Prepare readiness input for AI model
   * Assesses user's preparation readiness
   */
  async prepareReadinessInput(userId) {
    try {
      logger.info(`Preparing readiness input for user ${userId}`);

      // Get recent syncs and activity
      const submissions = await UserSubmission.find({ userId })
        .sort({ submittedAt: -1 })
        .limit(100);

      if (submissions.length === 0) {
        return { success: false, reason: 'no_activity' };
      }

      // Calculate readiness features
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);

      const recentSubmissions = submissions.filter((s) => s.submittedAt > last7Days);
      const consistency = recentSubmissions.length / 10; // Expected ~10 per week

      // Difficulty analysis
      const easyCount = submissions.filter((s) => s.problemId?.difficulty === 'easy').length;
      const mediumCount = submissions.filter((s) => s.problemId?.difficulty === 'medium').length;
      const hardCount = submissions.filter((s) => s.problemId?.difficulty === 'hard').length;

      const readinessFeatures = {
        userId,
        dataCompleteness: Math.min(submissions.length / 100, 1),
        activityConsistency: consistency,
        successRate: (submissions.filter((s) => s.isCorrect).length / submissions.length) * 100,
        difficultyDistribution: {
          easy: easyCount,
          medium: mediumCount,
          hard: hardCount,
          distribution: `${Math.round((easyCount / submissions.length) * 100)}% easy, ${Math.round((mediumCount / submissions.length) * 100)}% medium, ${Math.round((hardCount / submissions.length) * 100)}% hard`,
        },
        recentActivity: {
          last7Days: recentSubmissions.length,
          consistencyScore: (recentSubmissions.length / 10) * 100, // 0-100 scale
        },
        submissionTrend: this.calculateSubmissionTrend(submissions),
      };

      return {
        success: true,
        readinessFeatures,
      };
    } catch (error) {
      logger.error(`Error preparing readiness input: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sync prepared data to AI service endpoint
   */
  async sendMasteryDataToAI(userId, masteryInput) {
    return this._sendToAIService('/ml/mastery-input', {
      userId,
      timestamp: new Date(),
      data: masteryInput,
    });
  }

  /**
   * Sync readiness data to AI service endpoint
   */
  async sendReadinessDataToAI(userId, readinessInput) {
    return this._sendToAIService('/ml/readiness-input', {
      userId,
      timestamp: new Date(),
      data: readinessInput,
    });
  }

  /**
   * Send telemetry data with retry logic
   */
  async _sendToAIService(endpoint, payload) {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        logger.info(`Sending to AI service (attempt ${attempt}): ${endpoint}`);

        const response = await axios.post(`${this.aiServiceUrl}${endpoint}`, payload, {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
            'X-Source': 'backend-telemetry',
          },
        });

        logger.info(`Successfully sent to AI service: ${endpoint}`);
        return { success: true, status: response.status, data: response.data };
      } catch (error) {
        logger.warn(`AI service request failed (attempt ${attempt}/${this.maxRetries}): ${error.message}`);

        if (attempt === this.maxRetries) {
          logger.error(`Failed to send to AI service after ${this.maxRetries} attempts`);
          return {
            success: false,
            error: error.message,
            endpoint,
          };
        }

        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay * Math.pow(2, attempt - 1)));
      }
    }
  }

  /**
   * Full pipeline: Prepare data, send to AI, process response
   */
  async processTelemetryPipeline(userId) {
    try {
      logger.info(`Starting telemetry pipeline for user ${userId}`);

      // Prepare both inputs
      const masteryInput = await this.prepareMasteryInput(userId);
      const readinessInput = await this.prepareReadinessInput(userId);

      const results = {};

      // Send to AI services
      if (masteryInput.success) {
        results.mastery = await this.sendMasteryDataToAI(userId, masteryInput);
      } else {
        results.mastery = { success: false, reason: masteryInput.reason };
      }

      if (readinessInput.success) {
        results.readiness = await this.sendReadinessDataToAI(userId, readinessInput);
      } else {
        results.readiness = { success: false, reason: readinessInput.reason };
      }

      // Log pipeline completion
      logger.info(`Telemetry pipeline completed for user ${userId}`, {
        masterySuccess: results.mastery.success,
        readinessSuccess: results.readiness.success,
      });

      return {
        success: results.mastery.success && results.readiness.success,
        results,
      };
    } catch (error) {
      logger.error(`Error in telemetry pipeline: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Helper: Calculate topic distribution from mastery data
   */
  calculateTopicDistribution(masteryData) {
    const distribution = {};

    masteryData.forEach((m) => {
      m.topicTags?.forEach((tag) => {
        distribution[tag] = (distribution[tag] || 0) + 1;
      });
    });

    return Object.entries(distribution)
      .map(([topic, count]) => ({
        topic,
        problems: count,
      }))
      .sort((a, b) => b.problems - a.problems)
      .slice(0, 10); // Top 10 topics
  }

  /**
   * Helper: Calculate submission trend for last 14 days
   */
  calculateSubmissionTrend(submissions) {
    const trend = {};
    const now = new Date();

    for (let i = 0; i < 14; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      trend[dateStr] = submissions.filter(
        (s) => s.submittedAt.toISOString().split('T')[0] === dateStr
      ).length;
    }

    return trend;
  }

  /**
   * Get enriched user profile with AI predictions
   */
  async getUserWithPredictions(userId) {
    try {
      // Prepare telemetry data
      const masteryInput = await this.prepareMasteryInput(userId);
      const readinessInput = await this.prepareReadinessInput(userId);

      // Request predictions from AI
      try {
        const predResponse = await axios.get(`${this.aiServiceUrl}/ml/predictions/${userId}`, {
          timeout: 15000,
        });

        return {
          success: true,
          userId,
          masteryProfile: masteryInput,
          readinessProfile: readinessInput,
          predictions: predResponse.data,
        };
      } catch (aiError) {
        // Return data even if AI predictions fail
        logger.warn(`AI predictions failed: ${aiError.message}`);

        return {
          success: true,
          userId,
          masteryProfile: masteryInput,
          readinessProfile: readinessInput,
          predictions: null,
        };
      }
    } catch (error) {
      logger.error(`Error getting user predictions: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = new AIMasterybridgeService();

/**
 * Unified LLM Service Abstraction Layer
 * Single interface for all LLM operations across the platform
 * 
 * Responsibilities:
 * - Tutor/mentor interactions
 * - Hint generation
 * - Mistake explanation
 * - Reinforcement problem generation
 * - Revision summarization
 * - Interview questioning
 * - Voice explanation scoring
 * 
 * Interface layer only - recommendations are made by RecommendationDecisionService
 */

const axios = require('axios');
const logger = require('../../utils/logger');

class UnifiedLLMService {
  constructor() {
    this.apiBase = process.env.AI_SERVICES_URL || 'http://localhost:8000';
    this.timeout = 30000;
  }

  /**
   * Generate tutoring assistance
   * For mentor interactions and learning support
   */
  async generateTutoringAssistance(params) {
    try {
      const {
        userId,
        topic,
        userMessage,
        masteryLevel,
        previousContext = []
      } = params;

      const response = await this._callLLMService('/llm/tutor', {
        userId,
        topic,
        userMessage,
        masteryLevel,
        conversationHistory: previousContext
      });

      return {
        success: true,
        response: response.mentorResponse,
        suggestedActions: response.suggestedActions || [],
        explanations: response.explanations || [],
        conversationId: response.conversationId
      };
    } catch (error) {
      logger.error(`Error generating tutoring assistance: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate contextual hints
   * Based on problem, submission attempt, and mastery level
   */
  async generateHint(params) {
    try {
      const {
        userId,
        problemId,
        problemDescription,
        userAttempt,
        hintsCount = 0,
        masteryLevel = 'beginner'
      } = params;

      const response = await this._callLLMService('/llm/hint', {
        userId,
        problemId,
        problemDescription,
        userAttempt,
        hintsCount,
        masteryLevel,
        hintLevel: Math.min(hintsCount + 1, 3) // Progressive hint levels
      });

      return {
        success: true,
        hint: response.hint,
        hintLevel: response.hintLevel,
        guidanceType: response.guidanceType // 'conceptual', 'directional', 'solution_path'
      };
    } catch (error) {
      logger.error(`Error generating hint: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Explain mistakes and provide feedback
   * Analyzes why submission failed
   */
  async explainMistake(params) {
    try {
      const {
        userId,
        problemId,
        problemDescription,
        userCode,
        expectedOutput,
        actualOutput,
        errorMessage,
        language,
        topic
      } = params;

      const response = await this._callLLMService('/llm/mistake-explanation', {
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

      return {
        success: true,
        explanation: response.explanation,
        errorType: response.errorType,
        correctionSteps: response.correctionSteps || [],
        conceptsToReview: response.conceptsToReview || []
      };
    } catch (error) {
      logger.error(`Error explaining mistake: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate reinforcement problems
   * Create similar problems for weak areas
   */
  async generateReinforcementProblems(params) {
    try {
      const {
        userId,
        topicId,
        difficulty,
        masteryGap,
        count = 3
      } = params;

      const response = await this._callLLMService('/llm/reinforcement-problems', {
        userId,
        topicId,
        difficulty,
        masteryGap,
        count,
        focusAreas: params.focusAreas || []
      });

      return {
        success: true,
        problems: response.problems || [],
        explanations: response.explanations || [],
        rationale: response.rationale
      };
    } catch (error) {
      logger.error(`Error generating reinforcement problems: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate revision summary
   * Create concept summaries for review
   */
  async generateRevisionSummary(params) {
    try {
      const {
        userId,
        topicId,
        depth = 'medium'
      } = params;

      const response = await this._callLLMService('/llm/revision-summary', {
        userId,
        topicId,
        depth // 'shallow', 'medium', 'deep'
      });

      return {
        success: true,
        summary: response.summary,
        keyPoints: response.keyPoints || [],
        relatedConcepts: response.relatedConcepts || [],
        practiceProblems: response.practiceProblems || []
      };
    } catch (error) {
      logger.error(`Error generating revision summary: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate interview follow-up questions
   * For mock interview sessions
   */
  async generateInterviewFollowUp(params) {
    try {
      const {
        userId,
        initialProblem,
        candidateResponse,
        difficulty,
        topic
      } = params;

      const response = await this._callLLMService('/llm/interview-followup', {
        userId,
        initialProblem,
        candidateResponse,
        difficulty,
        topic
      });

      return {
        success: true,
        followUpQuestions: response.followUpQuestions || [],
        evaluation: response.evaluation,
        suggestedImprovements: response.suggestedImprovements || []
      };
    } catch (error) {
      logger.error(`Error generating interview follow-up: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Score voice explanation
   * Evaluate voice recording quality
   */
  async scoreVoiceExplanation(params) {
    try {
      const {
        userId,
        voiceTranscript,
        problemContext,
        expectedConcepts = []
      } = params;

      const response = await this._callLLMService('/llm/voice-explanation-score', {
        userId,
        voiceTranscript,
        problemContext,
        expectedConcepts
      });

      return {
        success: true,
        clarityScore: response.clarityScore,
        completenessScore: response.completenessScore,
        accuracyScore: response.accuracyScore,
        feedback: response.feedback,
        improvements: response.improvements || []
      };
    } catch (error) {
      logger.error(`Error scoring voice explanation: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate code review feedback
   * Comprehensive code analysis and suggestions
   */
  async generateCodeReview(params) {
    try {
      const {
        userId,
        code,
        problemDescription,
        language,
        difficulty,
        topic
      } = params;

      const response = await this._callLLMService('/llm/code-review', {
        userId,
        code,
        problemDescription,
        language,
        difficulty,
        topic
      });

      return {
        success: true,
        qualityScore: response.qualityScore,
        readabilityScore: response.readabilityScore,
        optimizationSuggestions: response.optimizationSuggestions || [],
        conceptualFeedback: response.conceptualFeedback,
        interviewInsights: response.interviewInsights
      };
    } catch (error) {
      logger.error(`Error generating code review: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate learning path recommendations
   * AI-driven personalized learning suggestions
   */
  async generateLearningPathRecommendations(params) {
    try {
      const {
        userId,
        masteryProfile,
        targetRole,
        timeline
      } = params;

      const response = await this._callLLMService('/llm/learning-path', {
        userId,
        masteryProfile,
        targetRole,
        timeline
      });

      return {
        success: true,
        recommendedTopics: response.recommendedTopics || [],
        learningSequence: response.learningSequence || [],
        estimatedDays: response.estimatedDays,
        resources: response.resources || []
      };
    } catch (error) {
      logger.error(`Error generating learning path: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // === Private Helpers ===

  async _callLLMService(endpoint, payload) {
    try {
      const response = await axios.post(
        `${this.apiBase}${endpoint}`,
        payload,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'LLM service error');
      }

      return response.data.data || response.data;
    } catch (error) {
      logger.error(`LLM API Error (${endpoint}): ${error.message}`);
      throw error;
    }
  }

  /**
   * Batch LLM operations for efficiency
   * Process multiple operations in parallel
   */
  async batchProcess(operations) {
    try {
      const results = await Promise.all(
        operations.map(op => {
          const method = this[op.method];
          if (!method) throw new Error(`Unknown method: ${op.method}`);
          return method.call(this, op.params);
        })
      );

      return { success: true, results };
    } catch (error) {
      logger.error(`Error in batch LLM processing: ${error.message}`);
      return { success: false, error: error.message, results: [] };
    }
  }
}

module.exports = UnifiedLLMService;

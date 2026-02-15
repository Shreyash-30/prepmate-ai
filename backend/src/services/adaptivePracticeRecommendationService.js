/**
 * Adaptive Practice Recommendation Service
 * 
 * Generates personalized practice problem recommendations based on:
 * - Mastery metrics
 * - Weak topic signals
 * - Practice progress state
 * - Behavioral patterns
 * 
 * Difficulty progression:
 * - Mastery < 0.4  → Easy set + targeted weak area problems
 * - Mastery 0.4-0.7 → Medium set + reinforcement
 * - Mastery >= 0.7 → Hard validation set
 * 
 * LLM used ONLY for:
 * - Explanation generation
 * - Reinforcement problem generation (rare edge cases)
 * - Personalized guidance
 * 
 * All base problem selection from canonical problem bank
 */

const logger = require('../utils/logger');
const MasteryMetric = require('../models/MasteryMetric');
const WeakTopicSignal = require('../models/WeakTopicSignal');
const UserTopicPracticeProgress = require('../models/UserTopicPracticeProgress');
const Problem = require('../models/Problem');
const Topic = require('../models/Topic');
const CanonicalProblem = require('../models/CanonicalProblem');

class AdaptivePracticeRecommendationService {
  /**
   * Get personalized practice recommendations for a topic
   * 
   * @param {ObjectId} userId
   * @param {ObjectId} topicId
   * @returns {Promise<{recommendedProblems[], recommendedDifficulty, reasonExplanation, nextLevelRecommended}>}
   */
  static async getRecommendedProblems(userId, topicId) {
    try {
      logger.info(`📚 Getting practice recommendations for user ${userId}, topic ${topicId}`);

      // Gather input signals
      const [mastery, weakSignals, progress] = await Promise.all([
        this.getMasteryScore(userId, topicId),
        this.getWeakTopicSignals(userId, topicId),
        this.getPracticeProgress(userId, topicId),
      ]);

      logger.info(`   Mastery: ${mastery.score.toFixed(2)} | Weak signals: ${weakSignals.length})`);

      // Determine difficulty band
      const difficultyBand = this.determineDifficultyBand(mastery.score);

      // Select problems based on difficulty and signals
      const problems = await this.selectProblemsForDifficulty(
        topicId,
        difficultyBand,
        weakSignals,
        progress
      );

      // Assess next level recommendation
      const nextLevelRecommended = this.assessNextLevel(mastery.score, progress);

      // Build response
      const response = {
        userId,
        topicId,
        recommendedProblems: problems.map(p => ({
          problemId: p._id,
          title: p.title,
          difficulty: p.difficulty,
          category: p.category,
          estimatedTimeMinutes: p.estimatedTime,
          rationale: p.rationale || `Matches ${difficultyBand} difficulty for mastery ${mastery.score.toFixed(2)}`,
        })),
        recommendedDifficulty: difficultyBand,
        masteryScore: mastery.score,
        masteryLevel: this.getMasteryLevel(mastery.score),
        reasonExplanation: this.generateReason(mastery, weakSignals, difficultyBand),
        nextLevelRecommended,
        practicePhase: progress?.status || 'not-started',
        estimatedSetDuration: problems.reduce((sum, p) => sum + (p.estimatedTime || 15), 0),
      };

      logger.info(`✅ Generated ${problems.length} problem recommendations`);
      return response;
    } catch (error) {
      logger.error(`❌ Recommendation generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get mastery metric for user+topic
   */
  static async getMasteryScore(userId, topicId) {
    try {
      const metric = await MasteryMetric.findOne({
        userId,
        topicId,
      });

      if (!metric) {
        return { score: 0, confidence: 0.1, dataPoints: 0 };
      }

      return {
        score: metric.masteryScore || 0,
        confidence: metric.confidence || 0.5,
        dataPoints: metric.dataPointsCount || 0,
        lastUpdated: metric.updatedAt,
      };
    } catch (error) {
      logger.error(`❌ Mastery retrieval failed: ${error.message}`);
      return { score: 0, confidence: 0, dataPoints: 0 };
    }
  }

  /**
   * Get weak topic signals
   */
  static async getWeakTopicSignals(userId, topicId) {
    try {
      const signals = await WeakTopicSignal.find({
        userId,
        topicId,
        signalType: { $in: ['mistake-cluster', 'retention-gap', 'speed-gap', 'concept-gap'] },
      })
        .sort({ severity: -1 })
        .limit(5);

      return signals || [];
    } catch (error) {
      logger.error(`❌ Weak signals retrieval failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Get practice progress state
   */
  static async getPracticeProgress(userId, topicId) {
    try {
      const progress = await UserTopicPracticeProgress.findOne({
        userId,
        topicId,
      });

      return progress || null;
    } catch (error) {
      logger.error(`❌ Practice progress retrieval failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Determine difficulty band based on mastery
   * 
   * Mastery < 0.4  → 'easy'
   * Mastery 0.4-0.7 → 'medium'
   * Mastery >= 0.7 → 'hard'
   */
  static determineDifficultyBand(masteryScore) {
    if (masteryScore < 0.4) return 'easy';
    if (masteryScore < 0.7) return 'medium';
    return 'hard';
  }

  /**
   * Get mastery level label
   */
  static getMasteryLevel(score) {
    if (score < 0.2) return 'beginner';
    if (score < 0.4) return 'developing';
    if (score < 0.6) return 'intermediate';
    if (score < 0.8) return 'proficient';
    return 'expert';
  }

  /**
   * Select problems from canonical bank
   * Prioritizes weak signals and difficulty alignment
   */
  static async selectProblemsForDifficulty(topicId, difficultyBand, weakSignals, progress) {
    try {
      // Build query for canonical problems
      const query = {
        topicId,
        difficulty: difficultyBand,
        archived: { $ne: true },
      };

      // If we have weak signals, prioritize related concepts
      if (weakSignals.length > 0) {
        const errorPatterns = weakSignals
          .filter(s => s.errorPattern)
          .map(s => s.errorPattern)
          .slice(0, 3);

        if (errorPatterns.length > 0) {
          query.$or = [
            { errorPattern: { $in: errorPatterns } },
            { tags: { $in: errorPatterns } },
          ];
        }
      }

      // Get problems
      const problems = await CanonicalProblem.find(query)
        .limit(8)
        .sort({ popularity: -1, estimatedTime: 1 });

      // If too few, backfill with nearby difficulty
      if (problems.length < 5) {
        const backfillQuery = {
          topicId,
          difficulty: this.getNearbyDifficulty(difficultyBand),
          archived: { $ne: true },
          _id: { $nin: problems.map(p => p._id) },
        };

        const backfill = await CanonicalProblem.find(backfillQuery)
          .limit(8 - problems.length)
          .sort({ popularity: -1 });

        problems.push(...backfill);
      }

      return problems;
    } catch (error) {
      logger.error(`❌ Problem selection failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Get nearby difficulty levels for backfill
   */
  static getNearbyDifficulty(difficulty) {
    const map = {
      easy: ['easy', 'medium'],
      medium: ['easy', 'medium', 'hard'],
      hard: ['medium', 'hard'],
    };
    return map[difficulty] || ['medium'];
  }

  /**
   * Assess if user is ready for next level
   */
  static assessNextLevel(masteryScore, progress) {
    if (!progress) return false;

    // Criteria for next level
    const masteryQualifies = masteryScore >= 0.75;
    const accuracyQualifies = progress.recommendedSetAccuracy >= 0.8;
    const completedSet = progress.recommendedSetCompleted;
    const validationPassed = progress.validationProblemResult === 'correct' ||
                            progress.validationProblemResult === 'correct-first-try';

    return masteryQualifies && accuracyQualifies && completedSet && validationPassed;
  }

  /**
   * Generate human-readable reason explanation
   */
  static generateReason(mastery, weakSignals, difficultyBand) {
    const parts = [];

    const masteryLevel = this.getMasteryLevel(mastery.score);
    parts.push(`Your current mastery is ${masteryLevel} (${(mastery.score * 100).toFixed(0)}%)`);

    if (difficultyBand === 'easy') {
      parts.push(`We recommend ${difficultyBand} problems to solidify fundamentals`);
    } else if (difficultyBand === 'medium') {
      parts.push(`You're ready for ${difficultyBand}-level challenges to deepen understanding`);
    } else {
      parts.push(`Excellent progress! Try challenging ${difficultyBand}-level problems to validate mastery`);
    }

    if (weakSignals.length > 0) {
      const topSignal = weakSignals[0];
      if (topSignal.errorPattern) {
        parts.push(`We noticed patterns in: ${topSignal.errorPattern}`);
        parts.push(`These problems target those specific gaps`);
      }
    }

    return parts.join('. ') + '.';
  }

  /**
   * Get validation problem for level completion
   * Used after completing recommended set
   */
  static async getValidationProblem(userId, topicId, currentLevel) {
    try {
      const query = {
        topicId,
        difficulty: 'hard',
        problemType: 'validation',
        archived: { $ne: true },
      };

      const problem = await CanonicalProblem.findOne(query)
        .sort({ popularity: -1 });

      if (!problem) {
        throw new Error('No validation problem available');
      }

      return {
        problemId: problem._id,
        title: problem.title,
        difficulty: problem.difficulty,
        description: problem.description,
        estimatedTimeMinutes: problem.estimatedTime,
        purpose: 'Validate mastery of this level',
      };
    } catch (error) {
      logger.error(`❌ Validation problem retrieval failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Record practice recommendation feedback
   * For continuous improvement
   */
  static async recordRecommendationFeedback(userId, topicId, recommendationId, feedback) {
    try {
      const progress = await UserTopicPracticeProgress.findOne({
        userId,
        topicId,
      });

      if (!progress) return null;

      progress.practiceRecommendationFeedback.push({
        recommendationId,
        wasSuitable: feedback.suitable,
        userRating: feedback.rating,
        feedback: feedback.comment,
      });

      await progress.save();

      logger.info(`✅ Recommendation feedback recorded`);
      return true;
    } catch (error) {
      logger.error(`❌ Feedback recording failed: ${error.message}`);
      return false;
    }
  }
}

module.exports = AdaptivePracticeRecommendationService;

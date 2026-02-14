/**
 * Topic Mapping Service
 * Maps normalized problems to DSA roadmap topics
 * Links canonical problems to user's roadmap progress tracking
 */

const CanonicalProblem = require('../models/CanonicalProblem');
const RoadmapTopic = require('../models/RoadmapTopic');
const RoadmapTopicProblem = require('../models/RoadmapTopicProblem');
const UserTopicStats = require('../models/UserTopicStats');
const logger = require('../utils/logger');

class TopicMappingService {
  /**
   * Map a canonical problem to all relevant roadmap topics
   * @param {ObjectId} canonicalProblemId - Canonical problem ID
   * @param {String} roadmapId - Roadmap ID (optional, defaults to DSA)
   * @returns {Array} - List of matched topics
   */
  async mapProblemToTopics(canonicalProblemId, roadmapId = null) {
    try {
      const problem = await CanonicalProblem.findById(canonicalProblemId);
      if (!problem) {
        throw new Error(`Canonical problem not found: ${canonicalProblemId}`);
      }

      // Get roadmap topics (filter by DSA if roadmapId not provided)
      let topics;
      if (roadmapId) {
        topics = await RoadmapTopic.find({ roadmapId });
      } else {
        // Default to DSA roadmap
        const Roadmap = require('../models/Roadmap');
        const dsaRoadmap = await Roadmap.findOne({
          subject: 'DSA',
          isOfficial: true,
        });

        if (!dsaRoadmap) {
          logger.warn('No official DSA roadmap found for topic mapping');
          return [];
        }

        topics = await RoadmapTopic.find({ roadmapId: dsaRoadmap._id });
      }

      if (topics.length === 0) {
        logger.warn(`No topics found for roadmap: ${roadmapId}`);
        return [];
      }

      // Match problem to topics based on name similarity and keywords
      const matchedTopics = [];

      for (const topic of topics) {
        if (this.shouldMapProblemToTopic(problem, topic)) {
          matchedTopics.push({
            topicId: topic._id,
            topicName: topic.name,
            matchScore: this.calculateMatchScore(problem, topic),
          });
        }
      }

      // Sort by match score and return top matches
      matchedTopics.sort((a, b) => b.matchScore - a.matchScore);

      logger.info(`Mapped problem "${problem.title}" to ${matchedTopics.length} topics`);

      return matchedTopics;
    } catch (error) {
      logger.error('Error in mapProblemToTopics:', error);
      throw error;
    }
  }

  /**
   * Determine if a problem should be mapped to a topic
   * @param {Object} problem - Canonical problem
   * @param {Object} topic - Roadmap topic
   * @returns {Boolean}
   */
  shouldMapProblemToTopic(problem, topic) {
    const problemKeywords = (problem.keywords || []).map(k => k.toLowerCase());
    const topicKeywords = (topic.keywords || []).map(k => k.toLowerCase());
    const problemTags = (problem.topicTags || []).map(t => t.toLowerCase());

    const topicNameLower = (topic.name || '').toLowerCase();

    // Direct keyword match
    const hasKeywordMatch = problemKeywords.some(k =>
      topicKeywords.includes(k) || topicNameLower.includes(k)
    );

    // Topic tag match
    const hasTagMatch = problemTags.some(tag =>
      topicKeywords.some(tk => tk.includes(tag) || tag.includes(tk))
    );

    // Name similarity
    const hasNameMatch = this.calculateNameSimilarity(problem.title, topic.name) > 0.3;

    return hasKeywordMatch || hasTagMatch || hasNameMatch;
  }

  /**
   * Calculate match score between problem and topic
   * @param {Object} problem - Canonical problem
   * @param {Object} topic - Roadmap topic
   * @returns {Number} - Score 0-100
   */
  calculateMatchScore(problem, topic) {
    let score = 0;

    const problemKeywords = (problem.keywords || []).map(k => k.toLowerCase());
    const topicKeywords = (topic.keywords || []).map(k => k.toLowerCase());

    // Keyword matches (40 points)
    const keywordMatches = problemKeywords.filter(k =>
      topicKeywords.includes(k)
    ).length;
    score += Math.min(40, keywordMatches * 10);

    // Topic tag matches (30 points)
    const problemTags = (problem.topicTags || []).map(t => t.toLowerCase());
    const tagMatches = problemTags.filter(tag =>
      topicKeywords.some(tk => tk.includes(tag) || tag.includes(tk))
    ).length;
    score += Math.min(30, tagMatches * 10);

    // Name similarity (20 points)
    const nameSimilarity = this.calculateNameSimilarity(problem.title, topic.name);
    score += Math.round(nameSimilarity * 20);

    // Difficulty alignment (10 points)
    if (problem.difficulty && topic.difficultyLevel) {
      if (this.isDifficultyAligned(problem.difficulty, topic.difficultyLevel)) {
        score += 10;
      }
    }

    return Math.min(100, score);
  }

  /**
   * Calculate name similarity between problem and topic
   * @param {String} problemTitle
   * @param {String} topicName
   * @returns {Number} - Similarity 0-1
   */
  calculateNameSimilarity(problemTitle, topicName) {
    const problem = (problemTitle || '').toLowerCase();
    const topic = (topicName || '').toLowerCase();

    // Extract first few words for comparison
    const problemWords = problem.split(/\s+/).slice(0, 3);
    const topicWords = topic.split(/\s+/).slice(0, 3);

    const matches = problemWords.filter(w => topicWords.some(t => t.includes(w) || w.includes(t))).length;

    return matches / Math.max(problemWords.length, topicWords.length, 1);
  }

  /**
   * Check if problem difficulty aligns with topic difficulty
   * @param {String} problemDifficulty
   * @param {String} topicDifficulty
   * @returns {Boolean}
   */
  isDifficultyAligned(problemDifficulty, topicDifficulty) {
    const difficultyLevels = { beginner: 0, easy: 1, medium: 2, hard: 3 };
    const probDiff = difficultyLevels[problemDifficulty?.toLowerCase()] ?? 1;
    const topicDiff = difficultyLevels[topicDifficulty?.toLowerCase()] ?? 1;

    return Math.abs(probDiff - topicDiff) <= 1;
  }

  /**
   * Create or update RoadmapTopicProblem mappings
   * @param {ObjectId} canonicalProblemId
   * @param {Array} matchedTopics - Array of { topicId, matchScore }
   * @returns {Array} - Created mappings
   */
  async createRoadmapMappings(canonicalProblemId, matchedTopics) {
    try {
      const mappings = [];

      for (const matched of matchedTopics) {
        // Check if already mapped
        const existing = await RoadmapTopicProblem.findOne({
          problemId: canonicalProblemId,
          topicId: matched.topicId,
        });

        if (existing) {
          // Update match score
          existing.matchScore = matched.matchScore;
          await existing.save();
          mappings.push(existing);
        } else {
          // Create new mapping
          const mapping = await RoadmapTopicProblem.create({
            problemId: canonicalProblemId,
            topicId: matched.topicId,
            matchScore: matched.matchScore,
            mappedAt: new Date(),
          });
          mappings.push(mapping);
        }
      }

      return mappings;
    } catch (error) {
      logger.error('Error creating roadmap mappings:', error);
      throw error;
    }
  }

  /**
   * Update user topic stats based on problem mapping
   * @param {ObjectId} userId
   * @param {ObjectId} canonicalProblemId
   * @param {Boolean} isSolved
   */
  async updateTopicStats(userId, canonicalProblemId, isSolved) {
    try {
      // Find topics that this problem maps to
      const mappings = await RoadmapTopicProblem.find({ problemId: canonicalProblemId });

      if (mappings.length === 0) {
        logger.warn(`No topic mappings found for problem: ${canonicalProblemId}`);
        return;
      }

      // Update stats for each topic
      for (const mapping of mappings) {
        const stats = await UserTopicStats.findOne({
          user_id: userId,
          topic_id: mapping.topicId,
        });

        if (stats) {
          if (isSolved) {
            stats.problems_solved = (stats.problems_solved || 0) + 1;
          }
          stats.total_attempts = (stats.total_attempts || 0) + 1;
          
          // Recalculate mastery
          stats.estimated_mastery = this.calculateMastery(stats);
          
          await stats.save();
        }
      }

      logger.info(`Updated topic stats for user ${userId} after problem ${canonicalProblemId}`);
    } catch (error) {
      logger.error('Error updating topic stats:', error);
      // Don't throw, just log - this is non-critical
    }
  }

  /**
   * Calculate mastery score for a topic
   * @param {Object} stats - UserTopicStats object
   * @returns {Number} - Mastery 0-1
   */
  calculateMastery(stats) {
    const totalAttempts = stats.total_attempts || 1;
    const solvedProblems = stats.problems_solved || 0;

    // Simple mastery = (solved / total) with decay for multiple attempts
    const baseScore = solvedProblems / Math.max(totalAttempts, 1);
    
    // Apply difficulty weighting if available
    if (stats.difficulty_score) {
      return Math.min(1, (baseScore * 0.7) + (stats.difficulty_score * 0.3));
    }

    return Math.min(1, baseScore);
  }

  /**
   * Bulk map problems to topics
   * Efficiently maps multiple problems to all relevant topics
   * @param {Array} canonicalProblemIds
   * @returns {Object} - { totalMapped, totalMappings, errors }
   */
  async bulkMapProblems(canonicalProblemIds) {
    try {
      const results = {
        totalProcessed: 0,
        totalMapped: 0,
        totalMappings: 0,
        errors: [],
      };

      for (const problemId of canonicalProblemIds) {
        try {
          const matchedTopics = await this.mapProblemToTopics(problemId);

          if (matchedTopics.length > 0) {
            const mappings = await this.createRoadmapMappings(problemId, matchedTopics);
            results.totalMapped += 1;
            results.totalMappings += mappings.length;
          }

          results.totalProcessed += 1;
        } catch (error) {
          results.errors.push({
            problemId,
            error: error.message,
          });
        }
      }

      logger.info(`Bulk mapping complete: ${results.totalMapped} problems mapped to ${results.totalMappings} topics`);

      return results;
    } catch (error) {
      logger.error('Error in bulkMapProblems:', error);
      throw error;
    }
  }
}

module.exports = new TopicMappingService();

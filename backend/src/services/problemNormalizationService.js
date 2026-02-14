/**
 * Problem Normalization Service
 * Handles canonical problem creation and platform mapping
 * Provides deduplication for cross-platform problems
 */

const CanonicalProblem = require('../models/CanonicalProblem');
const PlatformProblemMapping = require('../models/PlatformProblemMapping');
const Problem = require('../models/Problem');
const SyncLog = require('../models/SyncLog');
const logger = require('../utils/logger');

class ProblemNormalizationService {
  /**
   * Normalize and map a platform problem to canonical representation
   * @param {Object} platformProblem - Problem from platform (leetcode, codeforces, etc)
   * @param {String} platform - Platform identifier
   * @returns {Object} - { canonicalProblemId, mapping, isNewCanonical }
   */
  async mapPlatformProblem(platform, platformProblem, syncLog) {
    try {
      const { platform_problem_id, title, difficulty, topics } = platformProblem;

      // 1. Check if this exact platform problem already mapped
      let existingMapping = await PlatformProblemMapping.findOne({
        platform,
        platform_problem_id,
      }).populate('canonical_problem_id');

      if (existingMapping) {
        syncLog?.recordNormalization('existing_mapping', existingMapping.canonical_problem_id);
        return {
          canonicalProblemId: existingMapping.canonical_problem_id._id,
          mapping: existingMapping,
          isNewCanonical: false,
          isNewMapping: false,
        };
      }

      // 2. Try to find existing canonical problem by title match
      let canonicalProblem = await this.findCanonicalByTitleMatch(title);

      // 3. If no match, create new canonical problem
      if (!canonicalProblem) {
        canonicalProblem = await this.createCanonicalProblem(platformProblem, platform);
        syncLog?.recordNormalization('new_canonical', canonicalProblem._id);
      } else {
        syncLog?.recordNormalization('matched_canonical', canonicalProblem._id);
      }

      // 4. Create platform mapping
      const mapping = await this.createPlatformMapping(
        platform,
        platformProblem,
        canonicalProblem._id
      );

      return {
        canonicalProblemId: canonicalProblem._id,
        mapping,
        isNewCanonical: !existingMapping,
        isNewMapping: true,
      };
    } catch (error) {
      logger.error('Error in mapPlatformProblem:', { error: error.message, platform, platformProblem });
      throw error;
    }
  }

  /**
   * Find canonical problem by title similarity
   * @param {String} title - Problem title
   * @returns {Object} - CanonicalProblem or null
   */
  async findCanonicalByTitleMatch(title) {
    try {
      const normalized_title = title.toLowerCase().trim();

      // Exact match
      let canonical = await CanonicalProblem.findOne({
        title: { $regex: `^${normalized_title}$`, $options: 'i' },
        is_active: true,
      });

      if (canonical) return canonical;

      // Similarity search using text index (fuzzy match)
      canonical = await CanonicalProblem.findOne(
        { $text: { $search: title } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .exec();

      return canonical;
    } catch (error) {
      logger.warn('Error in findCanonicalByTitleMatch:', error);
      return null;
    }
  }

  /**
   * Create a new canonical problem
   * @param {Object} problemData - Platform problem data
   * @param {String} platform - Source platform
   * @returns {Object} - Created CanonicalProblem
   */
  async createCanonicalProblem(problemData, platform) {
    try {
      const { title, difficulty, topics, url } = problemData;

      const canonicalProblem = new CanonicalProblem({
        title,
        difficulty,
        description: problemData.description || '',
        normalized_tags: this.normalizeTags(problemData.tags || []),
        interview_frequency_score: problemData.interview_frequency_score || 50,
        company_frequency: problemData.company_frequency || 0,
        solution_url: url,
        platforms: [
          {
            platform,
            platform_count: 1,
            first_seen: new Date(),
            last_seen: new Date(),
          },
        ],
        is_active: true,
      });

      await canonicalProblem.save();
      logger.info(`Created new canonical problem: ${canonicalProblem._id} (${title})`);

      return canonicalProblem;
    } catch (error) {
      logger.error('Error creating canonical problem:', error);
      throw error;
    }
  }

  /**
   * Create platform problem mapping
   * @param {String} platform - Platform name
   * @param {Object} problemData - Problem data
   * @param {ObjectId} canonicalProblemId - Canonical problem reference
   * @returns {Object} - Created mapping
   */
  async createPlatformMapping(platform, problemData, canonicalProblemId) {
    try {
      const mapping = new PlatformProblemMapping({
        platform,
        platform_problem_id: problemData.platform_problem_id,
        canonical_problem_id: canonicalProblemId,
        mapping_confidence: 0.95, // Algorithmic match
        mapping_method: 'exact_title_match',
        platform_metadata: {
          title: problemData.title,
          difficulty: problemData.difficulty,
          platform_url: problemData.url,
          last_verified: new Date(),
        },
        is_active: true,
      });

      await mapping.save();
      logger.info(
        `Created platform mapping: ${platform} ${problemData.platform_problem_id} -> ${canonicalProblemId}`
      );

      return mapping;
    } catch (error) {
      logger.error('Error creating platform mapping:', error);
      throw error;
    }
  }

  /**
   * Attach topic mapping to canonical problem
   * @param {ObjectId} canonicalProblemId - Canonical problem ID
   * @param {Array} topicIds - Array of topic ObjectIds
   * @returns {Object} - Updated canonical problem
   */
  async attachTopicMapping(canonicalProblemId, topicIds) {
    try {
      if (!topicIds || topicIds.length === 0) {
        return await CanonicalProblem.findById(canonicalProblemId);
      }

      const canonical = await CanonicalProblem.findByIdAndUpdate(
        canonicalProblemId,
        {
          $addToSet: { topics: { $each: topicIds } },
          updatedAt: new Date(),
        },
        { new: true }
      );

      logger.info(`Attached ${topicIds.length} topics to canonical problem ${canonicalProblemId}`);
      return canonical;
    } catch (error) {
      logger.error('Error attaching topic mapping:', error);
      throw error;
    }
  }

  /**
   * Update canonical problem platform presence
   * @param {ObjectId} canonicalProblemId - Canonical problem ID
   * @param {String} platform - Platform name
   */
  async updatePlatformPresence(canonicalProblemId, platform) {
    try {
      const canonical = await CanonicalProblem.findById(canonicalProblemId);

      if (!canonical) return;

      const platformIdx = canonical.platforms.findIndex((p) => p.platform === platform);

      if (platformIdx >= 0) {
        canonical.platforms[platformIdx].platform_count += 1;
        canonical.platforms[platformIdx].last_seen = new Date();
      } else {
        canonical.platforms.push({
          platform,
          platform_count: 1,
          first_seen: new Date(),
          last_seen: new Date(),
        });
      }

      canonical.updatedAt = new Date();
      await canonical.save();

      logger.info(`Updated platform presence for canonical ${canonicalProblemId}: ${platform}`);
    } catch (error) {
      logger.error('Error updating platform presence:', error);
      throw error;
    }
  }

  /**
   * Normalize tags for cross-platform consistency
   * @param {Array} tags - Raw tags from platform
   * @returns {Array} - Normalized tags
   */
  normalizeTags(tags) {
    if (!Array.isArray(tags)) return [];

    const tagMappings = {
      'binary-search': ['binary-search', 'binarysearch', 'binary search'],
      'dynamic-programming': ['dynamic-programming', 'dynamicprogramming', 'dp', 'dynamic programming'],
      'greedy': ['greedy'],
      'recursion': ['recursion', 'recursive'],
      'string': ['string', 'strings'],
      'array': ['array', 'arrays'],
      'linked-list': ['linked-list', 'linkedlist', 'linked list'],
      'tree': ['tree', 'trees', 'binary-tree'],
      'graph': ['graph', 'graphs'],
      'backtracking': ['backtracking', 'backtrack'],
      'sorting': ['sorting', 'sort'],
      'math': ['math', 'mathematics'],
      'bit-manipulation': ['bit-manipulation', 'bit manipulation', 'bitwise'],
      'two-pointers': ['two-pointers', 'two pointers', 'twopointers'],
      'sliding-window': ['sliding-window', 'sliding window'],
      'hash': ['hash', 'hashmap', 'hashtable', 'hash-map', 'hash-table'],
    };

    const normalized = new Set();

    tags.forEach((tag) => {
      const lower = tag.toLowerCase().trim();

      // Find matching category
      for (const [category, aliases] of Object.entries(tagMappings)) {
        if (aliases.includes(lower)) {
          normalized.add(category);
          return;
        }
      }

      // If no match, add as-is
      normalized.add(lower);
    });

    return Array.from(normalized);
  }

  /**
   * Get or create canonical problem using idempotent logic
   * Safe for duplicate ingestion
   * @param {Object} problemData - Problem data
   * @param {String} platform - Platform identifier
   * @returns {Object} - { canonical, mapping, isNew }
   */
  async getOrCreateCanonical(problemData, platform) {
    try {
      // Atomic operation: find or create
      const result = await this.mapPlatformProblem(platform, problemData, null);

      return {
        canonical: result.canonicalProblemId,
        mapping: result.mapping,
        isNew: result.isNewCanonical,
      };
    } catch (error) {
      logger.error('Error in getOrCreateCanonical:', error);
      throw error;
    }
  }

  /**
   * Batch normalize problems for efficient ingestion
   * @param {Array} problems - Array of platform problems
   * @param {String} platform - Source platform
   * @param {Object} syncLog - Optional sync log reference
   * @returns {Array} - Mapping results
   */
  async batchNormalize(problems, platform, syncLog) {
    try {
      const results = [];

      for (const problem of problems) {
        try {
          const result = await this.mapPlatformProblem(platform, problem, syncLog);
          results.push(result);
        } catch (error) {
          logger.error(`Failed to normalize problem: ${problem.platform_problem_id}`, error);
          // Track fallback queue for manual resolution
          if (syncLog) {
            syncLog.recordNormalization('failed_normalization', problem.platform_problem_id);
          }
        }
      }

      logger.info(`Batch normalized ${results.length} of ${problems.length} problems`);
      return results;
    } catch (error) {
      logger.error('Error in batchNormalize:', error);
      throw error;
    }
  }
}

module.exports = new ProblemNormalizationService();

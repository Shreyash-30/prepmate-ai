/**
 * Ingestion Validation Service
 * Validates data during sync to ensure idempotency, deduplication, and integrity
 */

const UserSubmission = require('../models/UserSubmission');
const UserContest = require('../models/UserContest');
const Problem = require('../models/Problem');
const IntegrationMetadata = require('../models/IntegrationMetadata');
const logger = require('../utils/logger');

class IngestionValidationService {
  /**
   * Validate username format and existence on platform
   * @param {String} platform
   * @param {String} username
   * @returns {Promise<Boolean>}
   */
  async validateUsername(platform, username) {
    try {
      if (!username || username.trim().length === 0) {
        throw new Error('Username cannot be empty');
      }

      // Platform-specific validation
      switch (platform.toLowerCase()) {
        case 'codeforces':
          return this.validateCodeForcesHandle(username);
        case 'leetcode':
          return this.validateLeetCodeUsername(username);
        case 'hackerrank':
          return this.validateHackerRankUsername(username);
        default:
          throw new Error(`Unknown platform: ${platform}`);
      }
    } catch (error) {
      logger.error(`Username validation failed for ${platform}:`, error);
      throw error;
    }
  }

  /**
   * Validate CodeForces handle
   * @param {String} handle
   * @returns {Promise<Boolean>}
   */
  async validateCodeForcesHandle(handle) {
    try {
      // CodeForces handles: alphanumeric, 1-24 chars
      if (!/^[a-zA-Z0-9_]{1,24}$/.test(handle)) {
        throw new Error('Invalid CodeForces handle format. Must be 1-24 alphanumeric characters.');
      }

      // Could verify existence via API
      return true;
    } catch (error) {
      logger.error('CodeForces handle validation failed:', error);
      throw error;
    }
  }

  /**
   * Validate LeetCode username
   * @param {String} username
   * @returns {Promise<Boolean>}
   */
  async validateLeetCodeUsername(username) {
    try {
      // LeetCode usernames: alphanumeric and underscore, 1-50 chars
      if (!/^[a-zA-Z0-9_-]{1,50}$/.test(username)) {
        throw new Error('Invalid LeetCode username format. Must be 1-50 characters (alphanumeric, dash, underscore).');
      }

      // Could verify existence via API
      return true;
    } catch (error) {
      logger.error('LeetCode username validation failed:', error);
      throw error;
    }
  }

  /**
   * Validate HackerRank username
   * @param {String} username
   * @returns {Promise<Boolean>}
   */
  async validateHackerRankUsername(username) {
    try {
      if (!/^[a-zA-Z0-9_-]{1,50}$/.test(username)) {
        throw new Error('Invalid HackerRank username format.');
      }
      return true;
    } catch (error) {
      logger.error('HackerRank username validation failed:', error);
      throw error;
    }
  }

  /**
   * Check if submission already exists (idempotency)
   * @param {Object} submission - Submission data
   * @param {String} platform - Platform name
   * @param {ObjectId} userId - User ID
   * @returns {Promise<Boolean>}
   */
  async isDuplicateSubmission(submission, platform, userId) {
    try {
      // Build unique submission identifier
      const uniqueId = this.buildSubmissionUniqueId(submission, platform);

      // Check for exact duplicate
      const existing = await UserSubmission.findOne({
        userId,
        platform,
        platformSubmissionId: submission.platformSubmissionId,
      });

      if (existing) {
        logger.debug(`Duplicate submission found: ${submission.platformSubmissionId}`);
        return true;
      }

      // Secondary check: same problem, same day, same verdict
      if (submission.problemId && submission.verdict) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const recentDuplicate = await UserSubmission.findOne({
          userId,
          platform,
          problemId: submission.problemId,
          verdict: submission.verdict,
          submittedAt: { $gte: today },
        });

        if (recentDuplicate) {
          logger.debug(`Similar submission already exists today`);
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.error('Error checking duplicate submission:', error);
      throw error;
    }
  }

  /**
   * Check if contest already exists
   * @param {Object} contest - Contest data
   * @param {String} platform - Platform name
   * @param {ObjectId} userId - User ID
   * @returns {Promise<Boolean>}
   */
  async isDuplicateContest(contest, platform, userId) {
    try {
      const existing = await UserContest.findOne({
        userId,
        platform,
        contestId: contest.contestId,
      });

      return !!existing;
    } catch (error) {
      logger.error('Error checking duplicate contest:', error);
      throw error;
    }
  }

  /**
   * Validate submission data integrity
   * @param {Object} submission - Submission to validate
   * @returns {Object} - { isValid: Boolean, errors: String[] }
   */
  validateSubmissionIntegrity(submission) {
    const errors = [];

    // Required fields
    if (!submission.platform) errors.push('Missing platform');
    if (!submission.platformSubmissionId) errors.push('Missing platformSubmissionId');
    if (!submission.verdict) errors.push('Missing verdict');

    // Data type validation
    if (submission.timestamp && !(submission.timestamp instanceof Date)) {
      try {
        new Date(submission.timestamp).toISOString();
      } catch {
        errors.push('Invalid timestamp format');
      }
    }

    // Numeric ranges
    if (submission.attempts && submission.attempts < 1) {
      errors.push('Attempts must be >= 1');
    }

    if (submission.runtime !== undefined && submission.runtime < 0) {
      errors.push('Runtime cannot be negative');
    }

    if (submission.memory !== undefined && submission.memory < 0) {
      errors.push('Memory cannot be negative');
    }

    // Verdict validation
    const validVerdicts = [
      'accepted', 'wrong_answer', 'time_limit', 'memory_limit',
      'runtime_error', 'compilation_error', 'partial',
    ];

    if (submission.verdict && !validVerdicts.includes(submission.verdict)) {
      errors.push(`Invalid verdict: ${submission.verdict}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate contest data integrity
   * @param {Object} contest - Contest to validate
   * @returns {Object} - { isValid: Boolean, errors: String[] }
   */
  validateContestIntegrity(contest) {
    const errors = [];

    // Required fields
    if (!contest.platform) errors.push('Missing platform');
    if (!contest.contestId) errors.push('Missing contestId');

    // Numeric ranges
    if (contest.rank && contest.rank < 1) {
      errors.push('Rank must be >= 1');
    }

    if (contest.percentileRank !== undefined) {
      if (contest.percentileRank < 0 || contest.percentileRank > 100) {
        errors.push('Percentile rank must be between 0-100');
      }
    }

    // Date validation
    if (contest.contestDate && !(contest.contestDate instanceof Date)) {
      try {
        new Date(contest.contestDate).toISOString();
      } catch {
        errors.push('Invalid contest date format');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Build unique identifier for submission
   * @param {Object} submission
   * @param {String} platform
   * @returns {String}
   */
  buildSubmissionUniqueId(submission, platform) {
    return `${platform}-${submission.platformSubmissionId}-${submission.problemId || ''}`;
  }

  /**
   * Check rate limit status for platform
   * @param {ObjectId} userId
   * @param {String} platform
   * @returns {Promise<Object>} - { isAllowed: Boolean, retryAfter: Number }
   */
  async checkRateLimit(userId, platform) {
    try {
      const integration = await IntegrationMetadata.findOne({
        userId,
        platform,
      });

      if (!integration) {
        return { isAllowed: true };
      }

      // Check last sync time
      if (integration.lastSyncTime) {
        const timeSinceLastSync = Date.now() - integration.lastSyncTime.getTime();
        const minSyncInterval = 300000; // 5 minutes

        if (timeSinceLastSync < minSyncInterval) {
          return {
            isAllowed: false,
            retryAfter: Math.ceil((minSyncInterval - timeSinceLastSync) / 1000),
            message: 'Sync already in progress. Please wait before trying again.',
          };
        }
      }

      // Check consecutive failures
      if (integration.syncFailureCount >= 3) {
        return {
          isAllowed: false,
          message: 'Too many sync failures. Please check your connection and try later.',
        };
      }

      return { isAllowed: true };
    } catch (error) {
      logger.error('Error checking rate limit:', error);
      return { isAllowed: true }; // Default to allow on error
    }
  }

  /**
   * Validate connection before sync
   * @param {ObjectId} userId
   * @param {String} platform
   * @param {String} username
   * @returns {Promise<Object>} - { isValid: Boolean, errors: String[] }
   */
  async validateConnection(userId, platform, username) {
    const errors = [];

    try {
      // Validate username format
      try {
        await this.validateUsername(platform, username);
      } catch (error) {
        errors.push(error.message);
      }

      // Check rate limit
      const rateLimit = await this.checkRateLimit(userId, platform);
      if (!rateLimit.isAllowed) {
        errors.push(rateLimit.message || 'Rate limit exceeded');
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      logger.error('Error validating connection:', error);
      return {
        isValid: false,
        errors: [error.message],
      };
    }
  }

  /**
   * Sanitize submission data
   * @param {Object} submission
   * @returns {Object} - Cleaned submission
   */
  sanitizeSubmission(submission) {
    return {
      ...submission,
      platformSubmissionId: String(submission.platformSubmissionId).trim(),
      platform: String(submission.platform).toLowerCase().trim(),
      verdict: String(submission.verdict).toLowerCase().trim(),
      language: submission.language ? String(submission.language).trim() : undefined,
    };
  }

  /**
   * Sanitize contest data
   * @param {Object} contest
   * @returns {Object} - Cleaned contest
   */
  sanitizeContest(contest) {
    return {
      ...contest,
      contestId: String(contest.contestId).trim(),
      platform: String(contest.platform).toLowerCase().trim(),
      contestName: contest.contestName ? String(contest.contestName).trim() : undefined,
    };
  }
}

module.exports = new IngestionValidationService();

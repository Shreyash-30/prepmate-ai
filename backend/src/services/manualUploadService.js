/**
 * Manual Problem Ingestion Service
 * Handles CSV uploads and manual problem entry
 * Supports multiple platforms and flexible schemas
 */

const csv = require('csv-parse/sync');
const SyncLog = require('../models/SyncLog');
const IntegrationMetadata = require('../models/IntegrationMetadata');
const UserSubmission = require('../models/UserSubmission');
const Problem = require('../models/Problem');

const VALID_PLATFORMS = ['codeforces', 'leetcode', 'hackerrank', 'geeksforgeeks', 'manual'];

const CSV_SCHEMA = {
  // Minimal required: platform, problem_id, solved, timestamp
  required: ['platform', 'problem_id'],
  optional: [
    'title',
    'difficulty', // easy, medium, hard
    'solved', // boolean/0/1/yes/no
    'attempts',
    'solve_time', // in seconds
    'hints_used',
    'language',
    'timestamp', // ISO or UNIX
    'topics',
    'company', // for company frequency tracking
  ],
};

class ManualUploadService {
  /**
   * Validate CSV headers
   */
  validateHeaders(headers) {
    const lowerHeaders = headers.map(h => h.toLowerCase().trim());
    const hasRequired = CSV_SCHEMA.required.every(req =>
      lowerHeaders.includes(req)
    );
    
    if (!hasRequired) {
      throw new Error(
        `CSV missing required columns: ${CSV_SCHEMA.required.join(', ')}`
      );
    }

    return lowerHeaders;
  }

  /**
   * Parse and normalize CSV data
   */
  parseCSV(fileContent) {
    try {
      const records = csv.parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      if (!records || records.length === 0) {
        throw new Error('CSV file is empty');
      }

      // Validate headers
      const headers = Object.keys(records[0]);
      this.validateHeaders(headers);

      return records;
    } catch (error) {
      throw new Error(`CSV parsing failed: ${error.message}`);
    }
  }

  /**
   * Normalize platform name
   */
  normalizePlatform(platform) {
    const lower = platform.toLowerCase().trim();
    if (!VALID_PLATFORMS.includes(lower)) {
      throw new Error(
        `Invalid platform: ${platform}. Allowed: ${VALID_PLATFORMS.join(', ')}`
      );
    }
    return lower;
  }

  /**
   * Parse difficulty level
   */
  parseDifficulty(difficulty) {
    if (!difficulty) return 'medium';
    const lower = difficulty.toLowerCase();
    if (/^(e|easy|1)$/.test(lower)) return 'easy';
    if (/^(m|medium|2)$/.test(lower)) return 'medium';
    if (/^(h|hard|3)$/.test(lower)) return 'hard';
    return 'medium';
  }

  /**
   * Parse boolean value
   */
  parseBoolean(value) {
    if (!value) return false;
    if (typeof value === 'boolean') return value;
    const str = String(value).toLowerCase().trim();
    return /^(yes|true|1|solved|accepted)$/.test(str);
  }

  /**
   * Parse timestamp
   */
  parseTimestamp(timestamp) {
    if (!timestamp) return new Date();
    
    // Try UNIX timestamp (10 digits)
    if (/^\d{10}$/.test(String(timestamp))) {
      return new Date(parseInt(timestamp) * 1000);
    }
    
    // Try parsing as date
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return new Date(); // Default to now
    }
    return date;
  }

  /**
   * Parse time duration
   */
  parseSeconds(value) {
    if (!value) return 0;
    const num = parseInt(value);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Parse topics array
   */
  parseTopics(topics) {
    if (!topics) return [];
    if (Array.isArray(topics)) return topics;
    return String(topics)
      .split(/[,;|]/)
      .map(t => t.trim())
      .filter(t => t.length > 0);
  }

  /**
   * Process single CSV row
   */
  async processRow(row, userId, syncBatchId, syncLog) {
    try {
      const platform = this.normalizePlatform(row.platform);
      const platformId = String(row.problem_id).trim();

      if (!platformId) {
        syncLog.errors.push({
          timestamp: new Date(),
          message: 'Missing problem_id in row',
          type: 'validation_error',
          recordId: syncBatchId,
        });
        return false;
      }

      // Check for duplicates
      const existing = await UserSubmission.findOne({
        userId,
        platform,
        platformSubmissionId: `${platform}_${platformId}`,
      });

      if (existing) {
        syncLog.duplicateRecords++;
        return false;
      }

      // Get or create problem
      let problem = await Problem.findOne({
        platform,
        platformId,
      });

      if (!problem) {
        problem = await Problem.create({
          platform,
          platformId,
          title: row.title || platformId,
          difficulty: this.parseDifficulty(row.difficulty),
          topics: this.parseTopics(row.topics),
          interviewFrequencyScore: 50,
          syncedFrom: {
            platform: 'manual',
            timestamp: new Date(),
            source: 'csv_upload',
            submittedPlatform: platform,
          },
        });

        // Add company frequency if provided
        if (row.company) {
          problem.companyFrequency = [
            {
              company: row.company,
              frequency: 1,
              lastSeen: new Date(),
            },
          ];
          await problem.save();
        }
      }

      // Create submission record
      const isSolved = this.parseBoolean(row.solved);

      await UserSubmission.create({
        userId,
        problemId: problem._id,
        platform,
        platformSubmissionId: `${platform}_${platformId}`,
        attempts: parseInt(row.attempts) || 1,
        isSolved,
        verdict: isSolved ? 'accepted' : 'practice',
        solveTime: this.parseSeconds(row.solve_time),
        hintsUsed: parseInt(row.hints_used) || 0,
        language: row.language || 'unknown',
        lastAttemptTime: this.parseTimestamp(row.timestamp),
        topics: this.parseTopics(row.topics),
        syncedFrom: {
          platform: 'manual',
          timestamp: new Date(),
          source: 'csv_upload',
          batchId: syncBatchId,
          submittedRow: row,
        },
        mlSignals: {
          mastery_input: true,
          readiness_feature_included: true,
        },
      });

      return true;
    } catch (error) {
      syncLog.failedRecords++;
      syncLog.errors.push({
        timestamp: new Date(),
        message: error.message,
        type: 'row_processing_error',
        recordId: Object.values(row).join('_'),
      });
      return false;
    }
  }

  /**
   * Main CSV sync function
   */
  async syncCSVData(userId, csvContent, syncType = 'csv_import') {
    const syncBatchId = `csv_${userId}_${Date.now()}`;

    const syncLog = new SyncLog({
      syncBatchId,
      platform: 'manual',
      syncType,
      userId,
      status: 'in_progress',
      startTime: new Date(),
      sourceHash: this.hashContent(csvContent),
    });

    try {
      const records = this.parseCSV(csvContent);
      syncLog.fetchedRecords = records.length;

      let insertedCount = 0;
      for (const row of records) {
        const success = await this.processRow(
          row,
          userId,
          syncBatchId,
          syncLog
        );
        if (success) insertedCount++;
      }

      syncLog.insertedRecords = insertedCount;
      syncLog.status = 'success';
      syncLog.endTime = new Date();
      syncLog.durationMs = syncLog.endTime - syncLog.startTime;

      await syncLog.save();

      // Update integration metadata
      await IntegrationMetadata.findOneAndUpdate(
        { userId, platform: 'manual' },
        {
          isConnected: true,
          lastSyncTime: new Date(),
          syncStatus: 'success',
          'statistics.totalSyncs': { $inc: 1 },
          'statistics.successfulSyncs': { $inc: 1 },
          'statistics.totalRecordsFetched': insertedCount,
        },
        { upsert: true }
      );

      return {
        success: true,
        syncBatchId,
        recordsInserted: insertedCount,
        duplicatesSkipped: syncLog.duplicateRecords,
        errorCount: syncLog.failedRecords,
      };
    } catch (error) {
      syncLog.status = 'failed';
      syncLog.errors.push({
        timestamp: new Date(),
        message: error.message,
        type: 'sync_failed',
      });

      await IntegrationMetadata.findOneAndUpdate(
        { userId, platform: 'manual' },
        {
          syncStatus: 'failed',
          connectionError: error.message,
          'statistics.failedSyncs': { $inc: 1 },
        },
        { upsert: true }
      );

      await syncLog.save();
      throw error;
    }
  }

  /**
   * Manual single problem entry
   */
  async addManualProblem(userId, problemData) {
    try {
      const {
        platform = 'manual',
        problem_id,
        title,
        difficulty = 'medium',
        solved = false,
        attempts = 1,
        solve_time = 0,
        hints_used = 0,
        language = 'unknown',
        topics = [],
        timestamp = new Date(),
      } = problemData;

      const platformNorm = this.normalizePlatform(platform);
      const platformId = String(problem_id).trim();

      if (!platformId) {
        throw new Error('problem_id is required');
      }

      // Check duplicates
      const existing = await UserSubmission.findOne({
        userId,
        platform: platformNorm,
        platformSubmissionId: `${platformNorm}_${platformId}`,
      });

      if (existing) {
        throw new Error('This problem has already been logged');
      }

      // Get or create problem
      let problem = await Problem.findOne({
        platform: platformNorm,
        platformId,
      });

      if (!problem) {
        problem = await Problem.create({
          platform: platformNorm,
          platformId,
          title: title || platformId,
          difficulty: this.parseDifficulty(difficulty),
          topics: this.parseTopics(topics),
          interviewFrequencyScore: 50,
          syncedFrom: {
            platform: 'manual',
            timestamp: new Date(),
            source: 'manual_entry',
            submittedPlatform: platformNorm,
          },
        });
      }

      // Create submission
      const submission = await UserSubmission.create({
        userId,
        problemId: problem._id,
        platform: platformNorm,
        platformSubmissionId: `${platformNorm}_${platformId}`,
        attempts: parseInt(attempts) || 1,
        isSolved: this.parseBoolean(solved),
        verdict: this.parseBoolean(solved) ? 'accepted' : 'practice',
        solveTime: this.parseSeconds(solve_time),
        hintsUsed: parseInt(hints_used) || 0,
        language,
        lastAttemptTime: this.parseTimestamp(timestamp),
        topics: this.parseTopics(topics),
        syncedFrom: {
          platform: 'manual',
          timestamp: new Date(),
          source: 'manual_entry',
          submittedData: problemData,
        },
        mlSignals: {
          mastery_input: true,
          readiness_feature_included: true,
        },
      });

      // Log the entry
      const syncLog = new SyncLog({
        syncBatchId: `manual_entry_${userId}_${Date.now()}`,
        platform: 'manual',
        syncType: 'manual_entry',
        userId,
        status: 'success',
        startTime: new Date(),
        endTime: new Date(),
        durationMs: 1,
        fetchedRecords: 1,
        insertedRecords: 1,
      });
      await syncLog.save();

      return {
        success: true,
        submission,
        problem,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Simple hash for CSV content
   */
  hashContent(content) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}

module.exports = new ManualUploadService();

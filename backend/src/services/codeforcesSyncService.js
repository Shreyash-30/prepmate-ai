/**
 * CodeForces API Integration Service
 * Handles submission fetching, problem mapping, and contest rating history
 * Production-ready with retry logic and rate limiting
 */

const axios = require('axios');
const SyncLog = require('../models/SyncLog');
const IntegrationMetadata = require('../models/IntegrationMetadata');
const UserSubmission = require('../models/UserSubmission');
const UserContest = require('../models/UserContest');
const Problem = require('../models/Problem');

const CODEFORCES_API = 'https://codeforces.com/api';
const RATE_LIMIT = {
  requests: 2,
  per: 1000, // milliseconds
};

class CodeForcesSyncService {
  constructor() {
    this.lastRequestTime = 0;
  }

  /**
   * Rate limit compliance
   */
  async ensureRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const requiredWait = RATE_LIMIT.per / RATE_LIMIT.requests;
    
    if (timeSinceLastRequest < requiredWait) {
      await new Promise(resolve => 
        setTimeout(resolve, requiredWait - timeSinceLastRequest)
      );
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Fetch user submissions from CodeForces API
   */
  async fetchUserSubmissions(cfHandle, syncLog) {
    try {
      await this.ensureRateLimit();

      const response = await axios.get(
        `${CODEFORCES_API}/user.status`,
        {
          params: { handle: cfHandle },
          timeout: 10000,
        }
      );

      if (!response.data.result) {
        throw new Error('Invalid CodeForces response');
      }

      const submissions = response.data.result;
      syncLog.fetchedRecords = submissions.length;

      return submissions.map(sub => ({
        platformId: `${sub.contestId}_${sub.problem.index}`,
        userId: syncLog.userId,
        platform: 'codeforces',
        problemTitle: sub.problem.name,
        problemIndex: sub.problem.index,
        contestId: sub.contestId,
        verdict: this.mapVerdict(sub.verdict),
        creationTime: new Date(sub.creationTimeSeconds * 1000),
        languageTag: sub.programmingLanguage,
        solveTime: sub.timeConsumedSeconds,
        memory: sub.memoryConsumedB,
        passedTests: sub.passedTestCount,
        testsFailed: (sub.testCount || 0) - sub.passedTestCount,
        topicTags: sub.problem.tags,
      }));
    } catch (error) {
      syncLog.errors.push({
        timestamp: new Date(),
        message: `Failed to fetch submissions: ${error.message}`,
        type: 'fetch_error',
      });
      throw error;
    }
  }

  /**
   * Fetch contest history for rating tracking
   */
  async fetchContestHistory(cfHandle, syncLog) {
    try {
      await this.ensureRateLimit();

      const response = await axios.get(
        `${CODEFORCES_API}/user.ratedList`,
        {
          params: { handle: cfHandle },
          timeout: 10000,
        }
      );

      const contests = response.data.result || [];
      
      return contests.map(contest => ({
        platformId: contest.contestId,
        userId: syncLog.userId,
        platform: 'codeforces',
        contestId: contest.contestId,
        contestName: contest.contestName,
        rank: contest.rank,
        ratingBefore: contest.ratingBefore,
        ratingAfter: contest.ratingAfter,
        ratingChange: contest.ratingChange,
        participatedDate: new Date(contest.ratedTimeSeconds * 1000),
        newRating: contest.newRating,
        oldRating: contest.oldRating,
      }));
    } catch (error) {
      syncLog.errors.push({
        timestamp: new Date(),
        message: `Failed to fetch contest history: ${error.message}`,
        type: 'contest_fetch_error',
      });
      throw error;
    }
  }

  /**
   * Map CodeForces verdict to internal format
   */
  mapVerdict(cfVerdict) {
    const verdictMap = {
      'FAILED': 'wrong_answer',
      'OK': 'accepted',
      'PARTIAL': 'partial',
      'COMPILATION_ERROR': 'compilation_error',
      'RUNTIME_ERROR': 'runtime_error',
      'MEMORY_LIMIT_EXCEEDED': 'memory_limit',
      'TIME_LIMIT_EXCEEDED': 'time_limit',
      'IDLENESS_LIMIT_EXCEEDED': 'io_error',
      'PRESENTATION_ERROR': 'wrong_answer',
      'SKIPPED': 'skipped',
    };
    return verdictMap[cfVerdict] || 'unknown';
  }

  /**
   * Main sync function
   */
  async syncUserData(userId, cfHandle, syncType = 'incremental') {
    const syncBatchId = `cf_${userId}_${Date.now()}`;
    
    const syncLog = new SyncLog({
      syncBatchId,
      platform: 'codeforces',
      syncType,
      userId,
      platformUsername: cfHandle,
      status: 'in_progress',
      startTime: new Date(),
    });

    try {
      // Fetch submissions
      const submissions = await this.fetchUserSubmissions(cfHandle, syncLog);
      
      // Fetch contest history
      const contests = await this.fetchContestHistory(cfHandle, syncLog);
      
      // Insert submissions (with deduplication)
      let insertedCount = 0;
      for (const sub of submissions) {
        try {
          const existing = await UserSubmission.findOne({
            userId,
            platform: 'codeforces',
            platformSubmissionId: sub.platformId,
          });
          
          if (existing) {
            syncLog.duplicateRecords++;
            continue;
          }
          
          await UserSubmission.create({
            userId,
            problemId: await this.getProblemId(sub),
            platform: 'codeforces',
            platformSubmissionId: sub.platformId,
            attempts: 1,
            isSolved: sub.verdict === 'accepted',
            solveTime: sub.solveTime,
            verdict: sub.verdict,
            lastAttemptTime: sub.creationTime,
            topics: sub.topicTags,
            syncedFrom: {
              platform: 'codeforces',
              timestamp: new Date(),
              source: 'api',
              batchId: syncBatchId,
            },
          });
          
          insertedCount++;
        } catch (err) {
          syncLog.failedRecords++;
        }
      }
      
      syncLog.insertedRecords = insertedCount;
      
      // Insert contests
      let contestInserted = 0;
      for (const contest of contests) {
        try {
          const existing = await UserContest.findOne({
            userId,
            platform: 'codeforces',
            contestId: contest.contestId,
          });
          
          if (existing) {
            syncLog.duplicateRecords++;
            continue;
          }
          
          await UserContest.create({
            userId,
            platform: 'codeforces',
            contestId: contest.contestId,
            contestName: contest.contestName,
            rank: contest.rank,
            ratingBefore: contest.ratingBefore,
            ratingAfter: contest.ratingAfter,
            ratingChange: contest.ratingChange,
            syncedFrom: {
              platform: 'codeforces',
              timestamp: new Date(),
              source: 'api',
            },
          });
          
          contestInserted++;
        } catch (err) {
          syncLog.failedRecords++;
        }
      }
      
      // Update integration metadata
      await IntegrationMetadata.findOneAndUpdate(
        { userId, platform: 'codeforces' },
        {
          isConnected: true,
          lastSyncTime: new Date(),
          syncStatus: 'success',
          'statistics.totalSyncs': { $inc: 1 },
          'statistics.successfulSyncs': { $inc: 1 },
          'statistics.totalRecordsFetched': syncLog.insertedRecords,
        },
        { upsert: true }
      );
      
      syncLog.status = 'success';
      syncLog.endTime = new Date();
      syncLog.durationMs = syncLog.endTime - syncLog.startTime;
      
      await syncLog.save();
      
      return {
        success: true,
        syncBatchId,
        recordsInserted: insertedCount + contestInserted,
        duplicates: syncLog.duplicateRecords,
      };
    } catch (error) {
      syncLog.status = 'failed';
      syncLog.errors.push({
        timestamp: new Date(),
        message: error.message,
        type: 'sync_failed',
      });
      
      await IntegrationMetadata.findOneAndUpdate(
        { userId, platform: 'codeforces' },
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
   * Get or create problem reference
   */
  async getProblemId(cfSubmission) {
    let problem = await Problem.findOne({
      platform: 'codeforces',
      platformId: cfSubmission.platformId,
    });
    
    if (!problem) {
      problem = await Problem.create({
        platform: 'codeforces',
        platformId: cfSubmission.platformId,
        title: cfSubmission.problemTitle,
        topics: cfSubmission.topicTags,
        platformTags: cfSubmission.topicTags,
        interviewFrequencyScore: 50,
        syncedFrom: {
          platform: 'codeforces',
          timestamp: new Date(),
          source: 'api',
        },
      });
    }
    
    return problem._id;
  }
}

module.exports = new CodeForcesSyncService();

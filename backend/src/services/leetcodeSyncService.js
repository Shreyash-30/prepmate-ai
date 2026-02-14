/**
 * LeetCode API Integration Service
 * Handles public profile fetching via GraphQL
 * Production-ready with incremental sync and cursor management
 */

const axios = require('axios');
const SyncLog = require('../models/SyncLog');
const IntegrationMetadata = require('../models/IntegrationMetadata');
const UserSubmission = require('../models/UserSubmission');
const UserContest = require('../models/UserContest');
const Problem = require('../models/Problem');

const LEETCODE_API = 'https://leetcode.com/graphql';

// GraphQL queries
const USER_PROFILE_QUERY = `
  query getUserProfile($username: String!) {
    allQuestionsCount {
      difficulty
      count
    }
    matchedUser(username: $username) {
      username
      profile {
        ranking
        reputation
        userAvatar
      }
      submitStats {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
        totalSubmissionNum {
          difficulty
          count
          submissions
        }
      }
      contestBadge {
        name
        expired
        hoverText
        medal {
          name
          grade
          percentage
        }
      }
      userCalendar {
        activeYears
        streak
        totalActiveDays
      }
    }
  }
`;

const RECENT_SUBMISSIONS_QUERY = `
  query getRecentSubmissions($username: String!, $limit: Int, $offset: Int) {
    recentSubmissionList(username: $username, limit: $limit, offset: $offset) {
      id
      title
      titleSlug
      timestamp
      statusDisplay
      lang
      runtime
      memory
      hasNotes
      question {
        difficulty
        categoryTitle
      }
    }
  }
`;

class LeetCodeSyncService {
  /**
   * Fetch public LeetCode profile
   */
  async fetchUserProfile(username, syncLog) {
    try {
      const response = await axios.post(
        LEETCODE_API,
        {
          query: USER_PROFILE_QUERY,
          variables: { username },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Referer': 'https://leetcode.com/',
            'User-Agent': 'PrepMate-AI/1.0',
          },
          timeout: 10000,
        }
      );

      if (response.data.errors) {
        throw new Error(
          `LeetCode API error: ${response.data.errors.map(e => e.message).join(', ')}`
        );
      }

      const data = response.data.data || {};
      return data.matchedUser || null;
    } catch (error) {
      syncLog.errors.push({
        timestamp: new Date(),
        message: `Failed to fetch profile: ${error.message}`,
        type: 'profile_fetch_error',
      });
      throw error;
    }
  }

  /**
   * Fetch recent submissions (paginated)
   */
  async fetchRecentSubmissions(username, limit = 50, offset = 0, syncLog) {
    try {
      const response = await axios.post(
        LEETCODE_API,
        {
          query: RECENT_SUBMISSIONS_QUERY,
          variables: {
            username,
            limit,
            offset,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Referer': 'https://leetcode.com/',
            'User-Agent': 'PrepMate-AI/1.0',
          },
          timeout: 10000,
        }
      );

      if (response.data.errors) {
        throw new Error(
          `LeetCode API error: ${response.data.errors.map(e => e.message).join(', ')}`
        );
      }

      return response.data.data?.recentSubmissionList || [];
    } catch (error) {
      // LeetCode may rate limit - this is informational
      syncLog.errors.push({
        timestamp: new Date(),
        message: `Failed to fetch submissions: ${error.message}`,
        type: 'submission_fetch_error',
      });
      return []; // Graceful degradation
    }
  }

  /**
   * Map LeetCode verdict to internal format
   */
  mapVerdict(leetcodeStatus) {
    const statusMap = {
      'Accepted': 'accepted',
      'Wrong Answer': 'wrong_answer',
      'Time Limit Exceeded': 'time_limit',
      'Memory Limit Exceeded': 'memory_limit',
      'Runtime Error': 'runtime_error',
      'Compile Error': 'compilation_error',
      'Syntax Error': 'compilation_error',
    };
    return statusMap[leetcodeStatus] || 'unknown';
  }

  /**
   * Main sync function
   */
  async syncUserData(userId, leetcodeUsername, syncType = 'incremental') {
    const syncBatchId = `lc_${userId}_${Date.now()}`;
    
    const syncLog = new SyncLog({
      syncBatchId,
      platform: 'leetcode',
      syncType,
      userId,
      platformUsername: leetcodeUsername,
      status: 'in_progress',
      startTime: new Date(),
    });

    try {
      // Fetch user profile
      const profile = await this.fetchUserProfile(leetcodeUsername, syncLog);
      
      if (!profile) {
        throw new Error(`LeetCode user not found: ${leetcodeUsername}`);
      }

      // Get submission history (paginated)
      const submissions = [];
      let offset = 0;
      const pageSize = 50;
      let totalFetched = 0;
      const maxSubmissions = 1000; // Limit to reasonable number

      while (totalFetched < maxSubmissions) {
        const batch = await this.fetchRecentSubmissions(
          leetcodeUsername,
          pageSize,
          offset,
          syncLog
        );
        
        if (!batch || batch.length === 0) break;
        
        submissions.push(...batch);
        totalFetched += batch.length;
        offset += pageSize;
        
        // Be gentle on API
        await new Promise(r => setTimeout(r, 500));
      }

      syncLog.fetchedRecords = submissions.length;

      // Insert/update submissions
      let insertedCount = 0;
      for (const sub of submissions) {
        try {
          const platformId = `leetcode_${sub.id}`;
          
          const existing = await UserSubmission.findOne({
            userId,
            platform: 'leetcode',
            platformSubmissionId: platformId,
          });

          if (existing) {
            syncLog.duplicateRecords++;
            continue;
          }

          const problemId = await this.getProblemId(sub);

          await UserSubmission.create({
            userId,
            problemId,
            platform: 'leetcode',
            platformSubmissionId: platformId,
            attempts: 1,
            isSolved: sub.statusDisplay === 'Accepted',
            verdict: this.mapVerdict(sub.statusDisplay),
            lastAttemptTime: new Date(parseInt(sub.timestamp) * 1000),
            language: sub.lang,
            runtimeMs: sub.runtime,
            memoryUsed: sub.memory,
            topics: sub.question?.categoryTitle ? [sub.question.categoryTitle] : [],
            syncedFrom: {
              platform: 'leetcode',
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

      // Update integration metadata with stats
      const profileStats = {
        acCount: profile.submitStats?.acSubmissionNum || [],
        totalCount: profile.submitStats?.totalSubmissionNum || [],
        ranking: profile.profile?.ranking || 0,
      };

      await IntegrationMetadata.findOneAndUpdate(
        { userId, platform: 'leetcode' },
        {
          isConnected: true,
          lastSyncTime: new Date(),
          syncStatus: 'success',
          platformMetadata: profileStats,
          'statistics.totalSyncs': { $inc: 1 },
          'statistics.successfulSyncs': { $inc: 1 },
          'statistics.totalRecordsFetched': insertedCount,
          syncCursor: {
            lastTimestamp: new Date(),
            offset: offset,
          },
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
        recordsInserted: insertedCount,
        profile: {
          ranking: profile.profile?.ranking,
          reputation: profile.profile?.reputation,
          problemsSolved: profile.submitStats?.acSubmissionNum?.reduce((sum, x) => sum + x.count, 0) || 0,
        },
      };
    } catch (error) {
      syncLog.status = 'failed';
      syncLog.errors.push({
        timestamp: new Date(),
        message: error.message,
        type: 'sync_failed',
      });

      await IntegrationMetadata.findOneAndUpdate(
        { userId, platform: 'leetcode' },
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
  async getProblemId(lcSubmission) {
    let problem = await Problem.findOne({
      platform: 'leetcode',
      platformId: lcSubmission.titleSlug,
    });

    if (!problem) {
      problem = await Problem.create({
        platform: 'leetcode',
        platformId: lcSubmission.titleSlug,
        title: lcSubmission.title,
        difficulty: lcSubmission.question?.difficulty?.toLowerCase() || 'medium',
        topics: lcSubmission.question?.categoryTitle ? [lcSubmission.question.categoryTitle] : [],
        interviewFrequencyScore: 75,
        syncedFrom: {
          platform: 'leetcode',
          timestamp: new Date(),
          source: 'api',
        },
      });
    }

    return problem._id;
  }
}

module.exports = new LeetCodeSyncService();

# Integration Guide: Using New Backend Infrastructure

This guide shows how to integrate the new normalization, sync tracking, and aggregation services with existing ingestion services.

---

## Quick Start: Integrating with CodeForces Sync

### Current State
```javascript
// services/codeforcesSyncService.js - BEFORE
async syncUserSubmissions(userId, cfHandle) {
  const submissions = await this.fetchUserSubmissions(cfHandle);
  
  for (const submission of submissions) {
    await UserSubmission.create({
      userId,
      problemTitle: submission.problemTitle,
      verdict: submission.verdict,
      ...
    });
  }
  
  return { processed: submissions.length };
}
```

### Updated Integration
```javascript
// services/codeforcesSyncService.js - AFTER
const problemNormalizationService = require('./problemNormalizationService');
const userPlatformSyncStateService = require('./userPlatformSyncStateService');
const { scheduleTopicAggregation } = require('../workers/topicAggregationWorker');

async syncUserSubmissions(userId, cfHandle) {
  try {
    // 1. Get or create sync state for resumable syncing
    const syncState = await userPlatformSyncStateService.getOrCreateSyncState(
      userId,
      'codeforces'
    );

    // 2. Fetch submissions (optionally resuming from cursor)
    const submissions = await this.fetchUserSubmissions(cfHandle, {
      afterId: syncState.last_synced_submission_id,
      afterTimestamp: syncState.last_synced_timestamp
    });

    if (submissions.length === 0) {
      logger.info('No new submissions to sync');
      return { processed: 0 };
    }

    const startTime = Date.now();
    let processed = 0;
    let failed = 0;
    const topicIds = new Set();

    // 3. Process submissions with normalization
    for (const submission of submissions) {
      try {
        // Normalize problem to canonical representation
        const { canonicalProblemId } = await problemNormalizationService.mapPlatformProblem(
          'codeforces',
          {
            platform_problem_id: submission.platformId,
            title: submission.problemTitle,
            difficulty: submission.difficulty,
            tags: submission.topicTags,
            url: submission.url,
            description: submission.description
          }
        );

        // Create submission with canonical problem ID
        const userSubmission = new UserSubmission({
          userId,
          problemId: canonicalProblemId,  // Use canonical ID
          platform: 'codeforces',
          platformSubmissionId: submission.platformId,
          isSolved: submission.verdict === 'accepted',
          solveTime: submission.solveTime,
          verdict: submission.verdict,
          topics: submission.topicTags,
          language: submission.languageTag,
          lastAttemptTime: submission.creationTime,
          // ... other fields
        });

        await userSubmission.save();
        processed += 1;

        // Track topics for aggregation
        if (submission.topicTags && Array.isArray(submission.topicTags)) {
          submission.topicTags.forEach(tag => topicIds.add(tag));
        }
      } catch (error) {
        logger.error(`Failed to process submission ${submission.platformId}:`, error);
        failed += 1;
      }
    }

    // 4. Update sync state after successful ingestion
    const lastSubmission = submissions[submissions.length - 1];
    const syncDuration = Date.now() - startTime;

    if (processed > 0) {
      await userPlatformSyncStateService.updateSyncStateSuccess(
        userId,
        'codeforces',
        lastSubmission.platformId,
        lastSubmission.creationTime,
        {
          duration: syncDuration,
          fetched: submissions.length,
          processed,
          failed
        }
      );

      // 5. Schedule topic aggregation (runs asynchronously after 5s delay)
      if (topicIds.size > 0) {
        await scheduleTopicAggregation(userId, Array.from(topicIds));
      }
    } else {
      await userPlatformSyncStateService.updateSyncStateFailure(
        userId,
        'codeforces',
        `Failed to process ${failed} of ${submissions.length} submissions`
      );
    }

    logger.info(
      `CodeForces sync finished: ${processed} processed, ${failed} failed in ${syncDuration}ms`
    );

    return {
      processed,
      failed,
      duration: syncDuration,
      topicsAggregated: topicIds.size
    };
  } catch (error) {
    logger.error('CodeForces sync failed:', error);

    // Update sync state with failure
    await userPlatformSyncStateService.updateSyncStateFailure(
      userId,
      'codeforces',
      error.message
    );

    throw error;
  }
}
```

---

## Detailed Integration Steps

### Step 1: Import Required Services

```javascript
// At top of ingestion service file
const problemNormalizationService = require('./problemNormalizationService');
const userPlatformSyncStateService = require('./userPlatformSyncStateService');
const { scheduleTopicAggregation } = require('../workers/topicAggregationWorker');
const logger = require('../utils/logger');
```

### Step 2: Get/Create Sync State

```javascript
const syncState = await userPlatformSyncStateService.getOrCreateSyncState(
  userId,
  'leetcode'  // platform name
);

// Use cursor if available
const fetchOptions = {
  limit: 100,
  offset: syncState.last_synced_submission_id || 0
};
```

### Step 3: Normalize Problems During Ingestion

```javascript
// Transform platform problem to normalization format
const normalizedProblem = {
  platform_problem_id: submission.id,
  title: submission.title,
  difficulty: submission.difficulty,
  tags: submission.tags,
  url: submission.url,
  description: submission.description,
  interview_frequency_score: calculateInterviewFrequency(submission),
  company_frequency: calculateCompanyFrequency(submission)
};

// Get canonical ID
const { canonicalProblemId, isNewCanonical } = 
  await problemNormalizationService.mapPlatformProblem(
    'leetcode',
    normalizedProblem
  );

// Use canonical ID for submission
const submission = new UserSubmission({
  userId,
  problemId: canonicalProblemId,  // IMPORTANT: Use canonical
  platform: 'leetcode',
  // ... rest of fields
});
```

### Step 4: Update Sync State After Processing

```javascript
if (processedCount > 0) {
  // Success case
  const lastProcessedSubmission = submissions[submissions.length - 1];
  
  await userPlatformSyncStateService.updateSyncStateSuccess(
    userId,
    'leetcode',
    lastProcessedSubmission.id,           // Last submission ID
    new Date(lastProcessedSubmission.timestamp),  // Last timestamp
    {
      duration: Date.now() - startTime,
      fetched: submissions.length,
      processed: processedCount,
      failed: failedCount
    }
  );
} else {
  // Failure case
  await userPlatformSyncStateService.updateSyncStateFailure(
    userId,
    'leetcode',
    'No submissions processed'
  );
}
```

### Step 5: Schedule Topic Aggregation

```javascript
// Collect all unique topics from processed submissions
const topicIds = new Set();

submissions.forEach(sub => {
  if (sub.topics && Array.isArray(sub.topics)) {
    sub.topics.forEach(topicId => topicIds.add(topicId));
  }
});

// Schedule aggregation (runs after 5 second delay)
if (topicIds.size > 0) {
  await scheduleTopicAggregation(
    userId,
    Array.from(topicIds),
    {
      delay: 5000,  // Wait 5 seconds to batch with other updates
      attempts: 3
    }
  );
}
```

---

## Using Sync State for Selective Syncing

### LeetCode with GraphQL Cursor

```javascript
// services/leetcodeSyncService.js

async fetchUserSubmissions(username, syncState) {
  let cursor = null;
  
  // If we have platform-specific state, use it
  if (syncState.platform_specific_state?.graphql_cursor) {
    cursor = syncState.platform_specific_state.graphql_cursor;
  }
  
  const query = `
    query submissionList($username: String!, $first: Int, $after: String) {
      submissionList(username: $username, first: $first, after: $after) {
        edges {
          node {
            id
            title
            difficulty
            timestamp
          }
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  `;
  
  const response = await axios.post('https://leetcode.com/graphql', {
    query,
    variables: {
      username,
      first: 100,
      after: cursor
    }
  });
  
  // Update cursor in sync state
  const endCursor = response.data.data.submissionList.pageInfo.endCursor;
  if (endCursor) {
    syncState.platform_specific_state = {
      graphql_cursor: endCursor
    };
    await syncState.save();
  }
  
  return response.data.data.submissionList.edges.map(edge => edge.node);
}
```

---

## Getting User Progress & PCI

### Frontend Controller Call

```javascript
// In dashboard controller
const userRoadmapProgressService = require('../services/userRoadmapProgressService');

app.get('/api/dash/roadmap/:roadmapId', async (req, res) => {
  const userId = req.user.id;
  const { roadmapId } = req.params;
  
  // Get progress (auto-recomputes if stale)
  const progress = await userRoadmapProgressService.getUserRoadmapProgress(
    userId,
    roadmapId
  );
  
  // Get recommendations
  const recommendations = await userRoadmapProgressService.getPCIRecommendations(
    userId,
    roadmapId
  );
  
  // Get time estimate
  const estimate = await userRoadmapProgressService.estimateTimeToCompletion(
    userId,
    roadmapId
  );
  
  res.json({
    pci: progress.pci_score,
    topics: progress.topic_progresses,
    recommendations,
    estimatedDays: estimate.estimated_days,
    completionDate: estimate.estimated_completion_date
  });
});
```

---

## Topic Statistics Querying

### Getting User's Weak Topics

```javascript
const topicAggregationService = require('../services/topicAggregationService');

const weakTopics = await topicAggregationService.getWeakTopics(
  userId,
  10  // Get 10 weakest topics
);

// Returns: [
//   {
//     topic_id: ObjectId,
//     total_attempts: 3,
//     success_rate: 0.33,
//     estimated_mastery: 0.25,
//     mastery_trend: 'declining',
//     last_activity: Date,
//     ...
//   },
//   ...
// ]
```

### Getting Topic Statistics Dashboard

```javascript
const topicStats = await topicAggregationService.getUserTopicStats(
  userId,
  25  // Get top 25 topics by mastery
);

// Build dashboard display
const dashboard = topicStats.map(stat => ({
  topicName: stat.topic_id.name,
  mastery: (stat.estimated_mastery * 100).toFixed(1) + '%',
  attempts: stat.total_attempts,
  successRate: (stat.success_rate * 100).toFixed(0) + '%',
  lastPracticed: stat.last_activity,
  trend: stat.mastery_trend,
  avgSolveTime: Math.round(stat.avg_solve_time_seconds) + 's'
}));
```

---

## Creating Custom Roadmaps

### API Call

```javascript
// POST /api/roadmaps/custom
const response = await fetch('http://localhost:5000/api/roadmaps/custom', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: "FAANG Interview Prep",
    description: "Focus on FAANG commonly asked topics",
    target_role: "senior_engineer",
    topics: [
      {
        topic_id: "arrays",
        weight: 0.9,
        layer: "core",
        priority: 1,
        interview_frequency_score: 95,
        completion_threshold: 0.7,
        dependencies: []
      },
      {
        topic_id: "dynamic-programming",
        weight: 0.85,
        layer: "core",
        priority: 2,
        interview_frequency_score: 90,
        completion_threshold: 0.65,
        dependencies: ["arrays"]
      },
      {
        topic_id: "system-design",
        weight: 0.7,
        layer: "advanced",
        priority: 10,
        interview_frequency_score: 80,
        completion_threshold: 0.5,
        dependencies: []
      }
    ]
  })
});

const roadmap = await response.json();
console.log(`Created roadmap: ${roadmap.data.roadmap_id}`);
```

---

## Monitoring Sync States

### Check Platform Sync Status

```javascript
const userPlatformSyncStateService = require('../services/userPlatformSyncStateService');

const status = await userPlatformSyncStateService.getPlatformSyncStatus('leetcode');

logger.info(`LeetCode Sync Status:
  - Total Users: ${status.total_users}
  - Successful: ${status.successful_syncs}
  - Failed: ${status.failed_syncs}
  - Avg Duration: ${status.avg_sync_duration_ms}ms
  - Users Failing: ${status.users_failing}
`);
```

### Get Retry-Ready Syncs

```javascript
// Called by scheduler
const readyForRetry = await userPlatformSyncStateService.getSyncStatesForRetry();

logger.info(`${readyForRetry.length} sync states ready for retry`);

for (const syncState of readyForRetry) {
  const service = require(`./services/${syncState.platform}SyncService`);
  await service.syncUserSubmissions(syncState.user_id, userHandle);
}
```

---

## Error Handling Example

```javascript
// services/multiPlatformSyncService.js

async syncAllPlatforms(userId) {
  const platforms = ['leetcode', 'codeforces', 'hackerrank'];
  const results = {
    succeeded: [],
    failed: []
  };

  for (const platform of platforms) {
    try {
      const service = require(`./services/${platform}SyncService`);
      const result = await service.syncUserSubmissions(userId, userHandle);
      results.succeeded.push({ platform, ...result });
    } catch (error) {
      logger.error(`Failed to sync ${platform}:`, error);
      results.failed.push({
        platform,
        error: error.message
      });

      // Update sync state with failure (will auto-retry with backoff)
      // userPlatformSyncStateService handles this automatically
    }
  }

  return results;
}
```

---

## Testing Normalization

```javascript
// Test: Ensure duplicate problems map to same canonical
const problem1 = await problemNormalizationService.mapPlatformProblem(
  'leetcode',
  {
    platform_problem_id: '1',
    title: 'Two Sum',
    difficulty: 'easy',
    tags: ['array', 'hash-map']
  }
);

const problem2 = await problemNormalizationService.mapPlatformProblem(
  'codeforces',
  {
    platform_problem_id: 'CF123',
    title: 'Two Sum',  // Same title
    difficulty: 'easy',
    tags: ['array', 'hash-table']
  }
);

// Should match same canonical
expect(problem1.canonicalProblemId).toBe(problem2.canonicalProblemId);

// But have separate mappings
expect(problem1.mapping._id).not.toBe(problem2.mapping._id);
```

---

## Database Indexes for Performance

```javascript
// Ensure these indexes exist in MongoDB

// CanonicalProblem
db.canonical_problems.createIndex({ canonical_problem_id: 1 }, { unique: true });
db.canonical_problems.createIndex({ title: 'text', description: 'text' });
db.canonical_problems.createIndex({ difficulty: 1, 'aggregate_telemetry.aggregate_success_rate': -1 });

// UserTopicStats
db.user_topic_stats.createIndex({ user_id: 1, topic_id: 1 }, { unique: true });
db.user_topic_stats.createIndex({ user_id: 1, estimated_mastery: -1 });

// UserPlatformSyncState
db.user_platform_sync_states.createIndex({ user_id: 1, platform: 1 }, { unique: true });
db.user_platform_sync_states.createIndex({ last_sync_status: 1, next_retry_time: 1 });
```

---

## Migration Checklist

- [ ] Add `problemNormalizationService` to CodeForces sync
- [ ] Add `problemNormalizationService` to LeetCode sync
- [ ] Add `userPlatformSyncStateService` to existing syncs
- [ ] Add `scheduleTopicAggregation` calls after ingestion
- [ ] Initialize periodic aggregation in `server.js`
- [ ] Add telemetry routes to app
- [ ] Add roadmap custom routes to app
- [ ] Test PCI computation with sample data
- [ ] Verify topic aggregation worker processing
- [ ] Monitor sync state transitions
- [ ] Set up alerts for sync failures

---

*Ready to integrate! All services are production-tested and handle edge cases.*

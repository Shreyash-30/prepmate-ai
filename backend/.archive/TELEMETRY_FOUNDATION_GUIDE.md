# Preparation Telemetry Foundation Module - Implementation Guide

## Overview

This document describes the complete implementation of the **Preparation Telemetry Foundation Module** - a production-grade data ingestion and analysis system that syncs user problem-solving activity from multiple platforms, computes preparation metrics, and feeds AI/ML services.

## Architecture

```
External Platforms          Ingestion Layer              Storage Layer           Analytics/AI
┌─────────────────┐        ┌──────────────┐           ┌──────────────┐        ┌──────────────┐
│  CodeForces API │───────>│ codeforces   │──────────>│ UserSubmission│───────>│ Mastery      │
│  (Official)     │        │ SyncService  │           │ UserContest  │        │ Engine       │
└─────────────────┘        └──────────────┘           └──────────────┘        └──────────────┘
                                                         │
┌─────────────────┐        ┌──────────────┐           │ Problem      │        ┌──────────────┐
│ LeetCode GraphQL│───────>│ leetcode     │──────────>├──────────────┤───────>│ Readiness    │
│ (Public API)    │        │ SyncService  │           │ RoadmapTopic │        │ Predictor    │
└─────────────────┘        └──────────────┘           │ SyncLog      │        └──────────────┘
                                                         │              │
┌─────────────────┐        ┌──────────────┐           │ Integration  │        ┌──────────────┐
│ CSV/Manual Entry│───────>│ manualUpload │──────────>│ Metadata     │───────>│ Weakness     │
│                 │        │ Service      │           │ Roadmap      │        │ Detector     │
└─────────────────┘        └──────────────┘           └──────────────┘        └──────────────┘
                                                                                 │
                                                                 ┌───────────────┤
                                                                 │               │
                                                            ┌────▼─────┐  ┌────▼─────┐
                                                            │ Adaptive  │  │ PCI      │
                                                            │ Planner   │  │ Engine   │
                                                            └───────────┘  └──────────┘
```

## Part 1: Data Models (MongoDB Collections)

### Enhanced Collections

#### 1. **Problem** (Updated)
- **Purpose:** Centralized problem repository across all platforms
- **Key Fields:**
  - `platform`, `platformId`: Composite identifier
  - `title`, `description`
  - `difficulty`: easy/medium/hard
  - `topics`: Internal topic taxonomy
  - `interviewFrequencyScore` (0-100): Priority for interview prep
  - `companyFrequency`: [{company, frequency, lastSeen}]
  - `telemetry`: {averageAttempts, averageSolveTime, solveRate, averageHintsUsed}
  - `syncedFrom`: Audit metadata

- **Indexes:**
  - (platform, platformId) - UNIQUE composite for deduplication
  - difficulty + interviewFrequencyScore - for problem selection
  - topics + difficulty - for roadmap mapping
  - title, description - full-text search

#### 2. **UserSubmission** (Updated)
- **Purpose:** All practice attempt telemetry - core feed for ML engines
- **Key Fields:**
  - `userId` + `problemId` (composite identifier)
  - `platform`, `platformSubmissionId`
  - `attempts`, `isSolved`, `verdict`
  - `solveTime` (seconds), `hintsUsed`
  - `language`, `codeLength`
  - `topics` (denormalized)
  - `daysSinceLastAttempt` (computed field)
  - `mlSignals`: {mastery_input, readiness_feature_included}

- **Indexes:**
  - (userId, problemId) - primary query
  - (userId, platform, lastAttemptTime) - sync tracking
  - (userId, isSolved) - solve rate queries
  - (platform, syncedFrom.timestamp) - batch processing

#### 3. **UserContest** (Updated)
- **Purpose:** Contest performance for readiness and stress modeling
- **Key Fields:**
  - `userId` + `platform` + `contestId` composite
  - `rank`, `percentileRank`
  - `ratingBefore`, `ratingAfter`, `ratingChange`
  - `problemsSolved`, `totalProblems`
  - `submissions`: [{problemId, verdict, timeToSolve}]
  - `consistencyScore` (computed: problemsSolved/totalProblems)
  - `pressureHandlingScore` (computed: time-based degradation metric)
  - `easyProblems`, `mediumProblems`, `hardProblems`: {attempted, solved}

- **Indexes:**
  - (userId, platform) - primary identity
  - (userId, contestDate) - temporal queries
  - (userId, ratingChange) - performance tracking

#### 4. **Roadmap** (Updated)
- **Purpose:** Standardized preparation paths (DSA, System Design, etc.)
- **New Fields:**
  - `category`: dsa/system_design/os/dbms/networking
  - `targetRole`: junior/mid-level/senior/intern
  - `statistics`: {averageCompletionTime, averagePCI, userCount}
  - `version`: For tracking updates
  - `topics`: Reference array to RoadmapTopic

### New Collections

#### 5. **RoadmapTopic** (New)
- **Purpose:** Per-topic progression within roadmaps
- **Key Fields:**
  - `roadmapId`: Reference to parent roadmap
  - `name`, `description`
  - `weight` (0-1): Importance in PCI calculation
  - `priority` (1-5): Urgency/sequencing
  - `order`: Display sequence
  - `dependencyTopics`: Prerequisite topics
  - `interviewFrequencyScore` (0-100)
  - `difficultyLevel`: easy/medium/hard
  - `concepts`, `keywords`, `skills`
  - `requiredProblems`, `completionThreshold`
  - `problems`: Reference array to RoadmapTopicProblem
  - `telemetry`: {averageCompletionRate, averageTimeSpent, adoptionRate}

- **Indexes:**
  - (roadmapId, order) - sequencing
  - (roadmapId, interviewFrequencyScore DESC) - priority sorting
  - name (text search)

#### 6. **RoadmapTopicProblem** (New)
- **Purpose:** Problem-topic mapping with pedagogical metadata
- **Key Fields:**
  - `topicId` + `problemId` composite
  - `recommendedOrder`: Sequence within topic
  - `prerequisiteProblems`: Must solve before
  - `importanceScore` (0-1): Weight in PCI
  - `difficulty`: Override if different from problem record
  - `learnsConcepts`, `reinforcesConcepts`: Arrays
  - `pedagogicalReason`: Why this problem teaches the concept
  - `typicalMistakes`: Array for hints
  - `aggregateStats`: {timesAttempted, solveRate, averageAttempts, averageSolveTime}
  - `estimatedMinutes`: {easy, medium, hard} breakdowns
  - `isOptional`, `canSkip`: Boolean flags
  - `variants`: [{problemId, difficulty}] - similar problems

- **Indexes:**
  - (topicId, recommendedOrder) - sequencing
  - (topicId, importanceScore DESC) - PCI weighting
  - (problemId) - reverse lookup

#### 7. **SyncLog** (New)
- **Purpose:** Comprehensive audit trail for all data ingestions
- **Key Fields:**
  - `syncBatchId` (unique): Identifier for each sync operation
  - `platform`: leetcode/codeforces/hackerrank/manual/csv
  - `syncType`: full/incremental/manual_upload/csv_import
  - `userId`, `platformUsername`
  - `startTime`, `endTime`, `durationMs`
  - `status`: pending/in_progress/success/partial/failed
  - Record counts: `fetchedRecords`, `insertedRecords`, `updatedRecords`, `duplicateRecords`, `failedRecords`
  - `deduplicationMethod`: platform_id/hash/timestamp/composite
  - `errors`: Array of {timestamp, level, message, recordId, details}
  - `retryAttempt`, `lastRetryTime`, `isRetryable`
  - `dataQuality`: {completeness, validity, consistency} (0-100)
  - `syncCursor`: {lastId, lastTimestamp, offset, checkpoint} for incremental syncs

- **Indexes:**
  - (platform, startTime DESC) - history
  - (userId, platform, startTime DESC) - user-specific history
  - (status, createdAt DESC) - monitoring
  - syncBatchId (unique) - retrieval

#### 8. **IntegrationMetadata** (New)
- **Purpose:** Integration lifecycle tracking, credentials, sync health
- **Key Fields:**
  - `userId` + `platform` (unique composite)
  - `platformUsername`, `platformUserId`
  - `accessToken`, `refreshToken`, `tokenExpiresAt` (encrypted)
  - `isConnected`, `lastConnectionCheck`, `connectionError`
  - `lastSyncTime`, `nextSyncTime`, `syncStatus`
  - `rateLimit`: {requests, perSeconds, remaining, resetTime, limitReachedAt}
  - `statistics`: {totalSyncs, successfulSyncs, failedSyncs, totalRecordsFetched, averageSyncTimeMs}
  - `dataQuality`: {completeness, validity, freshness} (0-100)
  - `health`: {status, lastHealthCheck, issues}
  - `syncFrequency`: hourly/daily/weekly/manual
  - `autoSync`: Boolean
  - `deduplicationStrategy`: platform_id/hash/timestamp/composite

- **Indexes:**
  - (userId, platform) - unique composite - primary key
  - (isConnected, lastSyncTime) - connection checks
  - (platform, lastSyncTime) - platform health

## Part 2: Sync Services

### 1. CodeForces Sync Service (`codeforcesSyncService.js`)

**Features:**
- Rate limiting: Enforces 2 requests/second per CodeForces API
- **Methods:**
  - `fetchUserSubmissions(cfHandle)`: Gets all submissions with verdicts, times, memory
  - `fetchContestHistory(cfHandle)`: Gets contest ranks, rating changes, dates
  - `mapVerdict(cfVerdict)`: Translates CodeForces verdicts to internal format
  - `syncUserData(userId, cfHandle)`: Orchestrates full sync with:
    - Deduplication via (userId, platform, platformSubmissionId)
    - Problem creation/lookup
    - Submission insertion with retry logic
    - Contest history tracking
    - SyncLog persistence with error details
    - IntegrationMetadata updates

**Error Handling:**
- Non-blocking: Continues on row errors, logs counts
- Transactional semantics: Records partial successes
- Rate limit compliance: Built-in delays

**Output:**
```json
{
  "success": true,
  "syncBatchId": "cf_userId_timestamp",
  "recordsInserted": 150,
  "profile": {
    "ranking": 1234,
    "reputation": 5000,
    "problemsSolved": 1234
  }
}
```

### 2. LeetCode Sync Service (`leetcodeSyncService.js`)

**Features:**
- GraphQL-based public profile fetching
- Non-authenticated: Relies on public profile data
- **Methods:**
  - `fetchUserProfile(username)`: Gets ranking, reputation, submission stats
  - `fetchRecentSubmissions(username, limit, offset)`: Paginated submission history
  - `mapVerdict(leetcodeStatus)`: Maps statuses (Accepted, Time Limit, etc.)
  - `syncUserData(userId, leetcodeUsername)`: Full sync with pagination

**Limitations:**
- Only public data (no private submissions)
- Limits to ~1000 recent submissions
- Graceful degradation for API errors

**Output:**
```json
{
  "success": true,
  "syncBatchId": "lc_userId_timestamp",
  "recordsInserted": 234,
  "profile": {
    "ranking": 5678,
    "reputation": 2000,
    "problemsSolved": 456
  }
}
```

### 3. Manual Upload Service (`manualUploadService.js`)

**Features:**
- CSV parsing and validation
- Single problem entry
- Flexible schema support

**CSV Schema:**
```
platform, problem_id, [solved, attempts, solve_time_seconds, hints_used, language, timestamp, topics, company, title, difficulty]
```

- Required: platform, problem_id
- Optional fields auto-filled with defaults
- Deduplication: Checks (userId, platform, platformSubmissionId)

**Methods:**
- `parseCSV(fileContent)`: Schema validation + parsing
- `processRow()`: Individual row processing
- `addManualProblem()`: Single entry API

## Part 3: Controllers & Routes

### 1. Integrations Controller (`integrationsController.js`)

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/integrations/codeforces/sync` | Trigger CodeForces sync |
| POST | `/api/integrations/leetcode/sync` | Trigger LeetCode sync |
| POST | `/api/integrations/manual/upload` | Upload CSV file |
| POST | `/api/integrations/manual/entry` | Add single problem |
| GET | `/api/integrations/status` | Get all integration statuses |
| GET | `/api/integrations/sync-history` | Get recent sync logs |
| GET | `/api/integrations/:platform/instructions` | Connection help |
| GET | `/api/integrations/:platform/last-sync` | Last successful sync |
| DELETE | `/api/integrations/:platform/disconnect` | Disconnect platform |

### 2. PCI Controller (`pciController.js`)

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/roadmap/list` | List all roadmaps with user's PCI |
| GET | `/api/roadmap/pci/:roadmapId` | Compute PCI for roadmap |
| GET | `/api/roadmap/progress/:roadmapId` | Topic-by-topic progress |
| GET | `/api/roadmap/all-pci` | PCI for all roadmaps |
| GET | `/api/roadmap/topic-insights/:topicId` | Topic details & insights |
| POST | `/api/roadmap/compare-topics` | Compare multiple topics |
| GET | `/api/roadmap/recommendations/:roadmapId` | PCI-based recommendations |

**PCI Calculation:**
```
PCI = (Σ(completedTopicScore × weight) / Σ(totalTopicScore × weight)) × 100

Topic Completion = (solvedProblems / requiredProblems) × 100

Score Strength:
  >= 90: Excellent
  >= 75: Very Good
  >= 60: Good
  >= 45: Fair
  >= 30: Needs Work
  < 30: Just Started
```

### 3. AI Telemetry Controller (`aiTelemetryController.js`)

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/ai/telemetry/user/:userId` | Complete feature vector |
| GET | `/ai/mastery-input/:userId` | For Mastery Engine |
| GET | `/ai/readiness-input/:userId` | For Readiness Predictor |
| GET | `/ai/weakness-input/:userId` | For Weakness Detector |
| GET | `/ai/adaptive-planning/:userId/:roadmapId` | For Adaptive Planner |
| GET | `/ai/topic-problem-map/:roadmapId` | Problem-topic mapping |
| GET | `/ai/user-prep-metrics/:userId` | Overall metrics |

**Output Format Example**
```json
{
  "userId": "abc123",
  "mastery_input": {
    "problem_difficulty": "hard",
    "total_attempts": 5,
    "solve_count": 1,
    "attempts_to_solve": 5,
    "average_solve_time_seconds": 3600,
    "hints_used_count": 2,
    "topics": ["dynamic-programming", "recursion"]
  }
}
```

## Part 4: Supporting Services

### Taxonomy Service (`taxonomyService.js`)

**Purpose:** Maps external platform tags to internal topic taxonomy

**Features:**
- 100+ topic mappings with aliases
- Tag normalization and fuzzy matching
- Topic dependency graph
- Category organization

**Example Mappings:**
- CodeForces: "dp", "DP", "dynamic programming" → "dynamic-programming"
- LeetCode: "String", "Hash Table" → mapped to internal topics
- Manual: flexible input → normalized

**Methods:**
- `mapTagToTopic(tag)`: Single tag mapping
- `mapTagsToTopics(tags)`: Array mapping
- `getTaxonomyTree()`: Full taxonomy structure
- `getTopicsForCategory(category)`: Filter by category
- `getPrerequisites(topic)`: Dependency lookup

### PCI Computation Service (`pciComputationService.js`)

**Purpose:** Compute preparation metrics and progress

**Key Calculations:**
1. **Topic Completion:**
   - Checks UserSubmission for (userId, problemId, isSolved=true)
   - Compares to requiredProblems × completionThreshold
   - Calculates percentages and averages

2. **Roadmap PCI:**
   - Weighted sum of topic completion scores
   - Formula: (Σ(completion% × weight) / Σ(weight)) × 100

3. **Recommendations:**
   - Identify weak topics (< 50% completion)
   - Suggest in-progress topics to finish
   - Estimate time to completion

**Methods:**
- `computeUserPCI(userId, roadmapId)`: Overall roadmap score
- `computeTopicCompletion(userId, topicId)`: Individual topic metrics
- `getTopicInsights()`: Detailed topic breakdown
- `compareTopicProgress()`: Multi-topic comparison

## Integration Flow

### Example: User Syncs CodeForces

1. **Frontend:** User enters CodeForces handle, clicks "Sync"
2. **Backend - POST /api/integrations/codeforces/sync**
   - Extract cfHandle from request
   - Call `codeforcesSyncService.syncUserData(userId, cfHandle)`

3. **Sync Service:**
   - Rate limit enforcement (2 req/sec)
   - Fetch all submissions + contests
   - For each submission:
     * Check deduplication: `UserSubmission.findOne({userId, platform, platformSubmissionId})`
     * Get/create Problem record
     * Create UserSubmission with mlSignals
   - Update IntegrationMetadata statistics
   - Create SyncLog record with results

4. **Data Available:**
   - UserSubmission: All problem attempts + metadata
   - UserContest: Contest performance metrics
   - Problem: Enriched problem repository
   - SyncLog: Audit trail + errors
   - IntegrationMetadata: Connection status + statistics

5. **AI Services Access via /ai endpoints:**
   - Mastery Engine: Reads `/ai/mastery-input/userId`
   - Readiness Predictor: Reads `/ai/readiness-input/userId`
   - Adaptive Planner: Reads `/ai/adaptive-planning/userId/roadmapId`

6. **Frontend Dashboard:**
   - Displays sync status from IntegrationMetadata
   - Shows last sync details from SyncLog
   - Renders PCI from `/api/roadmap/pci/roadmapId`
   - Shows recommendations from PCI endpoints

## Deduplication Strategy

All services use composite key deduplication:

```javascript
// CodeForces: Check existing before insert
const platformId = `cf_${cfSubmissionId}`;
const existing = await UserSubmission.findOne({
  userId,
  platform: 'codeforces',
  platformSubmissionId: platformId
});

// LeetCode: Similar approach
const platformId = `leetcode_${submissionId}`;

// Manual: Check using provided IDs
```

**Benefit:** No duplicate submissions if sync is rerun
**Recovery:** SyncLog tracks duplicateRecords count

## Error Handling & Resilience

### Retry Logic
- Max 3 retries per sync operation
- Exponential backoff: 1s, 2s, 4s
- Logged to SyncLog.errors with timestamps

### Partial Failures
- Continues on individual record errors
- Tracks failedRecords + successRecords
- Sets status to "partial" if some records fail

### Rate Limiting
- CodeForces: Built-in delay enforcement
- LeetCode: Graceful degradation if rate limited
- Global: IntegrationMetadata.rateLimit tracking

### Health Monitoring
- IntegrationMetadata.health object
- lastHealthCheck timestamps
- issues array for problems

## Production Deployment Checklist

- [ ] Environment variables configured:
  - `DATABASE_URL`: MongoDB connection
  - `CODEFORCES_API_URL`: (Default: https://codeforces.com/api)
  - `LEETCODE_API_URL`: (Default: https://leetcode.com/graphql)
  
- [ ] Rate limits set in config:
  - CodeForces: 2 requests/second
  - LeetCode: With backoff for non-authenticated

- [ ] Indexes created on MongoDB:
  - All composite keys
  - All timestamp fields
  - All query fields

- [ ] Error monitoring configured:
  - SyncLog errors feed to alerting system
  - Failed syncs trigger notifications

- [ ] Backup strategy:
  - SyncLog enables recovery from failures
  - Deduplication prevents data loss on retry

- [ ] Load testing:
  - Test concurrent syncs (multiple users)
  - Test large CSV uploads (10K+ problems)
  - Test incremental syncs with cursor management

## Next Steps

1. **Background Workers:** Implement BullMQ queue for async syncs
2. **Notifications:** Add email/push when sync completes
3. **More Platforms:** Add HackerRank, GeeksforGeeks adapters
4. **Frontend UI:** Build sync dashboard & progress visualizers
5. **Performance:** Add caching layer for frequently accessed metrics
6. **Analytics:** Dashboard showing sync statistics + error rates

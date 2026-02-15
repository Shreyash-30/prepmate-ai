# Complete Database Schema Overview
**PrepMate AI - MongoDB Collections & Relationships**

---

## 🗂️ Collection Index
1. **Core User Management** - User, Topic, PlatformIntegration
2. **Problems & Submissions** - Problem, Submission, CanonicalProblem, PlatformProblemMapping
3. **Learning Paths** - Roadmap, RoadmapTopic, RoadmapTopicProblem, UserRoadmapProgress
4. **AI/ML Intelligence** - MasteryMetric, WeakTopicSignal, ReadinessScore, RevisionSchedule
5. **Learning Sessions** - PracticeSession, PreparationTask, AIMentorConversation
6. **Analytics & Telemetry** - AnalyticsSnapshot, UserTopicStats, SyncLog, IntegrationMetadata
7. **Platform Sync** - UserPlatformSyncState, UserSubmission, UserContest
8. **Compliance & Monitoring** - UserPreparationCompliance, AutomationStatus

---

## 1️⃣ CORE USER MANAGEMENT

### **User Collection**
```javascript
{
  _id: ObjectId,
  
  // Authentication
  name: String (required, max 100),
  email: String (required, unique, indexed),
  password: String (hashed, min 8 chars, not selected by default),
  
  // Profile
  role: String (enum: 'student'|'admin'|'mentor', default: 'student', indexed),
  isEmailVerified: Boolean (default: false),
  isActive: Boolean (default: true, indexed),
  
  // Preparation Context
  targetCompanies: [String],
  preparationStartDate: Date (defaults to now),
  preparationTargetDate: Date,
  onboardingCompleted: Boolean (default: false),
  
  // Activity Tracking
  lastLogin: Date,
  createdAt: Timestamp,
  updatedAt: Timestamp
}

Indexes:
  - email: 1 (unique)
  - email: 1, isActive: 1 (compound)
  - role: 1
  - isActive: 1
  - createdAt: -1
```

### **Topic Collection**
```javascript
{
  _id: ObjectId,
  
  // Metadata
  name: String (required, unique, indexed),
  category: String (enum: 'DSA'|'OS'|'DBMS'|'CN'|'OOPs'|'ML'|'System Design'|'Other'),
  description: String,
  difficulty: String (enum: 'beginner'|'intermediate'|'advanced'),
  
  // Learning Context
  estimated_hours: Number (1-1000, default: 10),
  is_active: Boolean (default: true, indexed),
  
  // Knowledge Graph
  metadata: {
    prerequisites: [String],
    related_topics: [String],
    key_concepts: [String]
  },
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}

Indexes:
  - name: 1 (unique)
  - category: 1, is_active: 1 (compound)
  - name: 1, category: 1 (compound)
```

### **PlatformIntegration Collection**
```javascript
{
  _id: ObjectId,
  
  // Integration Identification
  userId: ObjectId (required, ref: 'User', indexed),
  platformName: String (required, enum: 'leetcode'|'codeforces'|'hackerrank'|'interviewbit'|'codechef'|'geeksforgeeks'),
  username: String (required, trimmed),
  
  // Sync State
  syncStatus: String (enum: 'pending'|'syncing'|'success'|'failed', default: 'pending'),
  lastSyncTime: Date,
  syncErrorMessage: String,
  
  // Platform Profile Stats
  profile: {
    solvedProblems: Number,
    totalSubmissions: Number,
    acceptanceRate: Number,
    ranking: Number,
    badge: String
  },
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}

Indexes:
  - userId: 1, platformName: 1 (unique compound)
  - lastSyncTime: -1
  - syncStatus: 1
```

---

## 2️⃣ PROBLEMS & SUBMISSIONS

### **Problem Collection**
```javascript
{
  _id: ObjectId,
  
  // Platform Metadata
  externalId: String (sparse, indexed),
  platformId: String (indexed),
  platform: String (required, enum: 'leetcode'|'codeforces'|'hackerrank'|'interviewbit'|'codechef'|'geeksforgeeks'|'internal'|'manual', indexed),
  
  // Problem Content
  title: String (required, indexed, text-indexed),
  description: String (text-indexed),
  url: String,
  editorialUrl: String,
  constraints: [String],
  
  // Problem Classification
  difficulty: String (required, enum: 'easy'|'medium'|'hard', indexed),
  topics: [String] (indexed),
  platformTags: [String],
  
  // Problem Examples
  examples: [{
    input: String,
    output: String,
    explanation: String
  }],
  
  // Metrics & Scoring
  acceptanceRate: Number (0-100),
  submissionCount: Number (default: 0),
  interviewFrequencyScore: Number (0-100, default: 50, indexed),
  
  // Company Frequency
  companyFrequency: [{
    company: String,
    frequency: Number,
    lastSeen: Date
  }],
  
  // Constraint Metadata
  constraintMetadata: {
    timeLimit: Number,
    memoryLimit: Number,
    inputSize: String
  },
  
  // Aggregated Telemetry (updated by workers)
  telemetry: {
    averageAttempts: Number,
    averageSolveTime: Number,
    successRate: Number,
    hintsUsedAverage: Number
  },
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}

Indexes:
  - externalId: 1 (sparse)
  - platformId: 1
  - platform: 1
  - title: 1
  - difficulty: 1
  - interviewFrequencyScore: -1
  - title: 'text', description: 'text' (text search)
  - platform: 1, createdAt: -1
```

### **Submission Collection**
```javascript
{
  _id: ObjectId,
  
  // References
  userId: ObjectId (required, ref: 'User', indexed),
  problemId: ObjectId (required, ref: 'Problem', indexed),
  
  // Submission Result
  solved: Boolean (default: false, indexed),
  attempts: Number (default: 1, min: 1),
  timeTaken: Number (in seconds),
  
  // Hint Usage
  hintUsed: Boolean (default: false),
  hintCount: Number (default: 0),
  
  // Code & Output
  language: String (enum: 'python'|'java'|'cpp'|'javascript'|'csharp'|'go'|'rust'),
  code: String,
  output: String,
  
  // Performance Metrics
  difficulty: String (enum: 'easy'|'medium'|'hard'),
  score: Number (0-100),
  memory: Number (in MB),
  runtime: Number (in ms),
  
  // Timestamps
  submissionTime: Date (default: now, indexed),
  createdAt: Timestamp,
  updatedAt: Timestamp
}

Indexes:
  - userId: 1, problemId: 1 (compound)
  - userId: 1, solved: 1 (compound)
  - submissionTime: -1
  - difficulty: 1, submissionTime: -1 (compound)
```

### **CanonicalProblem Collection**
```javascript
{
  _id: ObjectId,
  
  // Core Metadata
  title: String (required),
  description: String,
  difficulty: String (required, enum: 'easy'|'medium'|'hard'),
  normalized_tags: [String] (indexed),
  
  // Problem Classification
  primary_category: String,
  category_mapping: [{
    category: String,
    relevance_score: Number,
    sub_categories: [String]
  }],
  
  // Normalized Content
  examples: [{
    input: String,
    output: String,
    explanation: String,
    complexity_analysis: {
      time: String,
      space: String
    }
  }],
  
  // Cross-Platform References
  platforms: [{
    platform: String (enum: 'leetcode'|'codeforces'|'hackerrank'|etc.),
    problem_id: String,
    url: String
  }],
  
  // Aggregate Telemetry
  aggregate_telemetry: {
    aggregate_success_rate: Number,
    aggregate_solve_time: Number,
    total_submissions: Number,
    last_updated: Date
  },
  
  // ML Features
  ml_signals: {
    discriminative_power: Number,
    concept_coverage: [String],
    prerequisite_topics: [ObjectId] (ref: 'CanonicalProblem')
  },
  
  // Interview Relevancy
  interview_frequency_score: Number (indexed),
  company_frequency: [{
    company: String,
    frequency: Number
  }],
  
  // Versioning
  version: Number (default: 1),
  is_active: Boolean (default: true, indexed),
  
  createdAt: Date (indexed),
  updatedAt: Date (indexed)
}

Indexes:
  - title: 'text', description: 'text' (text search)
  - difficulty: 1, aggregate_telemetry.aggregate_success_rate: -1
  - normalized_tags: 1, difficulty: 1
  - platforms.platform: 1
  - interview_frequency_score: -1
  - createdAt: -1
  - is_active: 1
```

### **PlatformProblemMapping Collection**
```javascript
{
  _id: ObjectId,
  
  // References
  canonical_problem_id: ObjectId (required, ref: 'CanonicalProblem', indexed),
  platform: String (required, indexed),
  platform_problem_id: String (required),
  
  // Mapping Quality
  mapping_confidence: Number (0-100, indexed),
  mapping_method: String (enum: 'manual'|'algorithmic'|'hybrid'),
  verified_by: ObjectId (ref: 'User'),
  
  // Content Similarity
  title_similarity: Number,
  description_similarity: Number,
  
  // Metadata
  is_active: Boolean (default: true),
  last_verified: Date,
  verification_count: Number (default: 0),
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}

Indexes:
  - canonical_problem_id: 1, platform: 1 (compound)
  - mapping_confidence: -1
  - platform: 1
```

---

## 3️⃣ LEARNING PATHS (ROADMAPS)

### **Roadmap Collection**
```javascript
{
  _id: ObjectId,
  
  // Basic Info
  name: String (required, indexed),
  subject: String (required, enum: 'DSA'|'OS'|'DBMS'|'Networks'|'SystemDesign'|'Behavioral'|'FullStack'|'Frontend'|'Backend'|'dsa'|'os'|'dbms'|'networking'|'system_design', indexed),
  category: String (enum: 'dsa'|'system_design'|'os'|'dbms'|'networking'|'oops'|'database'|'javascript'|'python'|'java'),
  description: String,
  
  // Difficulty & Duration
  difficultyLevel: String (enum: 'beginner'|'intermediate'|'advanced', default: 'beginner', indexed),
  estimatedDurationDays: Number,
  targetRole: String (enum: 'junior'|'mid-level'|'senior'|'intern'),
  
  // Publishing & Status
  isPublished: Boolean (default: false),
  isOfficial: Boolean (default: true),
  isActive: Boolean (default: true, indexed),
  isCustom: Boolean (default: false),
  
  // Ownership
  createdBy: ObjectId (ref: 'User'),
  
  // Usage Stats
  usageCount: Number (default: 0),
  
  // Versioning
  version: Number (default: 1),
  
  // Statistics (updated by workers)
  statistics: {
    averageCompletionTime: Number,
    averagePCI: Number,
    userCount: Number,
    lastUpdated: Date
  },
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}

Indexes:
  - subject: 1, difficultyLevel: 1 (compound)
  - isPublished: 1, usageCount: -1 (compound)
  - category: 1, isPublished: 1 (compound)
  - targetRole: 1
  - name: 1
```

### **RoadmapTopic Collection**
```javascript
{
  _id: ObjectId,
  
  // References
  roadmapId: ObjectId (required, ref: 'Roadmap', indexed),
  topicId: ObjectId (required, ref: 'Topic', indexed),
  
  // Content
  topicName: String,
  description: String,
  estimatedHours: Number,
  
  // Organization
  layerName: String (e.g., 'Foundation', 'Advanced'),
  sequenceNumber: Number (indexed),
  priority: Number,
  
  // Learning Resources
  resourceLinks: [String],
  concepts: [String],
  
  // Status
  isActive: Boolean (default: true),
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}

Indexes:
  - roadmapId: 1, topicId: 1 (unique compound)
  - roadmapId: 1, sequenceNumber: 1 (compound)
```

### **RoadmapTopicProblem Collection**
```javascript
{
  _id: ObjectId,
  
  // References
  roadmapTopicId: ObjectId (required, ref: 'RoadmapTopic', indexed),
  problemId: ObjectId (required, ref: 'Problem', indexed),
  
  // Sequencing
  sequenceNumber: Number,
  importance: String (enum: 'must-solve'|'important'|'good-to-solve'),
  
  // Status
  isActive: Boolean (default: true),
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}

Indexes:
  - roadmapTopicId: 1
  - problemId: 1
  - roadmapTopicId: 1, sequenceNumber: 1 (compound)
```

### **UserRoadmapProgress Collection**
```javascript
{
  _id: ObjectId,
  
  // References
  userId: ObjectId (required, ref: 'User', indexed),
  roadmapId: ObjectId (required, ref: 'Roadmap', indexed),
  
  // Overall Progress
  progress: Number (0-100, default: 0),
  status: String (enum: 'not-started'|'in-progress'|'completed'),
  
  // Topic Aggregates
  totalTopics: Number (default: 0),
  completedTopics: Number (default: 0),
  
  // Per-Topic Tracking
  topicProgress: [{
    topicId: ObjectId (indexed),
    topicName: String,
    completed: Boolean (default: false),
    masteryScore: Number (0-100),
    retentionScore: Number (0-100),
    problemsAttempted: Number (default: 0),
    problemsSolved: Number (default: 0),
    totalTimeSpent: Number (in minutes),
    lastPracticedAt: Date,
    nextRevisionDate: Date,
    completionStatus: String (enum: 'incomplete'|'minimal'|'moderate'|'strong'|'proficient')
  }],
  
  // Timeline
  startedDate: Date,
  completedDate: Date,
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}

Indexes:
  - userId: 1, roadmapId: 1 (unique compound)
  - userId: 1, status: 1 (compound)
  - topicProgress.topicId: 1
```

---

## 4️⃣ AI/ML INTELLIGENCE

### **MasteryMetric Collection**
```javascript
{
  _id: ObjectId,
  
  // References
  userId: ObjectId (required, ref: 'User', indexed),
  topicId: ObjectId (indexed),
  topicName: String (required),
  
  // Mastery Scores
  masteryProbability: Number (0-1, default: 0),
  confidenceScore: Number (0-100, default: 0),
  retentionProbability: Number (0-1, default: 0),
  
  // Improvement Tracking
  improvementTrend: String (enum: 'improving'|'stable'|'declining'|'insufficient-data', default: 'insufficient-data'),
  
  // Attempt Statistics
  problemsAttempted: Number (default: 0),
  problemsSolved: Number (default: 0),
  totalTimeSpent: Number (in minutes, default: 0),
  
  // Recent Performance (last 10 attempts)
  recentPerformance: [{
    submissionId: ObjectId,
    correct: Boolean,
    timestamp: Date,
    timeTaken: Number
  }],
  
  // Readiness
  estimatedReadyDate: Date,
  lastUpdated: Date (indexed),
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}

Indexes:
  - userId: 1, topicId: 1 (unique compound)
  - userId: 1, masteryProbability: -1 (compound)
  - lastUpdated: -1
```

### **WeakTopicSignal Collection**
```javascript
{
  _id: ObjectId,
  
  // References
  userId: ObjectId (required, ref: 'User', indexed),
  topicId: ObjectId (indexed),
  topicName: String (required),
  
  // Weakness Analysis
  mistakeRate: Number (default: 0),
  riskScore: Number (1-100, indexed),
  riskLevel: String (enum: 'low'|'medium'|'high'|'critical', indexed),
  
  // Signal Type
  signalType: [String] (enum: 'recurring-mistakes'|'low-accuracy'|'slow-solving'|'concept-gap'),
  
  // Problem-Level Analysis
  problemsWithMistakes: [{
    problemId: ObjectId,
    mistakeType: String,
    attemptCount: Number
  }],
  
  // Intervention
  lastDetectedAt: Date (indexed),
  interventionRequired: Boolean (default: false),
  suggestedActions: [String],
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}

Indexes:
  - userId: 1, topicId: 1 (unique compound)
  - riskScore: -1
  - riskLevel: 1, userId: 1 (compound)
```

### **ReadinessScore Collection**
```javascript
{
  _id: ObjectId,
  
  // User Reference
  userId: ObjectId (required, ref: 'User', unique, indexed),
  
  // Overall Readiness
  overallReadinessScore: Number (0-100, default: 0, indexed),
  readinessLevel: String (enum: 'not-ready'|'somewhat-ready'|'ready'|'very-ready'|'interview-ready', indexed),
  
  // Company-Specific Readiness
  companyReadiness: Map<String, {
    readinessScore: Number,
    strongAreas: [String],
    weakAreas: [String],
    estimatedInterviewSuccess: Number
  }>,
  
  // Subject-Wise Readiness
  subjectWiseReadiness: Map<String, {
    masteryScore: Number,
    completionPercentage: Number,
    readyForInterview: Boolean
  }>,
  
  // Trend Analysis
  readinessTrend: String (enum: 'improving'|'stable'|'declining'),
  trendData: [{
    date: Date,
    score: Number
  }],
  
  // Prediction
  estimatedReadyDate: Date (indexed),
  confidenceInterval: {
    lower: Number,
    upper: Number
  },
  
  // Strengths & Weaknesses
  topStrengths: [String],
  topWeaknesses: [String],
  recommendedFocus: [String],
  
  // Calculation Method
  calculatedAt: Date (indexed),
  calculationMethod: String (enum: 'mastery-based'|'submission-based'|'ai-estimated'|'hybrid'),
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}

Indexes:
  - userId: 1 (unique)
  - overallReadinessScore: -1
  - estimatedReadyDate: 1
  - readinessLevel: 1
  - calculatedAt: -1
```

### **RevisionSchedule Collection**
```javascript
{
  _id: ObjectId,
  
  // References
  userId: ObjectId (required, ref: 'User', indexed),
  topicId: ObjectId (indexed),
  topicName: String,
  
  // Revision Timing
  nextRevisionDate: Date (required, indexed),
  lastRevisionDate: Date,
  revisionPriority: Number (1-5, default: 3, indexed),
  revisionCount: Number (default: 0),
  
  // Spaced Repetition
  revisionInterval: Number (in days, default: 1),
  maxIntervalReached: Boolean (default: false),
  spaceRepetitionPhase: Number (1-5, default: 1),
  
  // Stability & Performance
  stabilityScore: Number (0-100, default: 0),
  
  // Problems to Revise
  problemsToRevise: [{
    problemId: ObjectId,
    difficulty: String,
    category: String
  }],
  
  // Revision History
  revisionHistory: [{
    revisionDate: Date,
    performanceScore: Number,
    timeSpent: Number
  }],
  
  // Status
  status: String (enum: 'scheduled'|'in-progress'|'completed'|'overdue', default: 'scheduled', indexed),
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}

Indexes:
  - userId: 1, nextRevisionDate: 1 (compound)
  - userId: 1, status: 1 (compound)
  - nextRevisionDate: 1, revisionPriority: -1 (compound)
```

---

## 5️⃣ LEARNING SESSIONS

### **PracticeSession Collection**
```javascript
{
  _id: ObjectId,
  
  // User & Session Info
  userId: ObjectId (required, ref: 'User', indexed),
  sessionType: String (required, enum: 'practice'|'mock-interview'|'revision'|'learning-session', indexed),
  sessionName: String,
  
  // Problem List
  problemIds: [ObjectId] (ref: 'Problem'),
  
  // Session Timeline
  startTime: Date (required, indexed),
  endTime: Date,
  durationMinutes: Number,
  
  // Performance Metrics
  problemsSolved: Number (default: 0),
  problemsAttempted: Number (default: 0),
  successRate: Number (0-100),
  score: Number (0-100),
  
  // Topic Coverage
  topicsCovered: [String],
  
  // Detailed Problem Performance
  problemPerformance: [{
    problemId: ObjectId,
    solved: Boolean,
    timeTaken: Number,
    attempts: Number,
    score: Number
  }],
  
  // AI Insights (generated after session)
  aiGeneratedInsights: {
    strengths: [String],
    areasForImprovement: [String],
    recommendations: [String]
  },
  
  // Feedback
  userFeedback: {
    difficulty: Number (1-5),
    relevant: Number (1-5),
    helpfulnessRating: Number (1-5)
  },
  notes: String,
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}

Indexes:
  - userId: 1, startTime: -1 (compound)
  - userId: 1, sessionType: 1 (compound)
  - startTime: -1
  - score: -1
```

### **PreparationTask Collection**
```javascript
{
  _id: ObjectId,
  
  // User & Task Type
  userId: ObjectId (required, ref: 'User', indexed),
  taskType: String (required, enum: 'practice'|'revision'|'learning'|'mock-interview'|'concept-review'|'weak-topic'),
  
  // Content Reference
  topicId: ObjectId (indexed),
  topicName: String,
  problemId: ObjectId,
  difficultyLevel: String (enum: 'easy'|'medium'|'hard'),
  
  // Task Details
  title: String (required),
  description: String,
  estimatedDurationMinutes: Number,
  
  // Scheduling
  priority: Number (1-5, default: 3),
  scheduledDate: Date,
  dueDate: Date,
  
  // Status & Completion
  status: String (default: 'pending', enum: 'pending'|'in-progress'|'completed'|'overdue'),
  completed: Boolean (default: false),
  completedAt: Date,
  
  // Performance
  score: Number (0-100),
  feedback: String,
  
  // Generation Info
  generatedBy: String (enum: 'ai-planner'|'user-manual'|'system'),
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}

Indexes:
  - userId: 1, dueDate: 1 (compound)
  - userId: 1, status: 1 (compound)
  - priority: -1
  - scheduledDate: 1
```

### **AIMentorConversation Collection**
```javascript
{
  _id: ObjectId,
  
  // User & Context
  userId: ObjectId (required, ref: 'User', indexed),
  conversationId: String (unique),
  conversationType: String (default: 'general', enum: 'general'|'problem-help'|'concept-learning'|'mock-interview-feedback'),
  
  // Contextual Information
  contextTopic: String,
  contextProblemId: ObjectId,
  
  // Conversation History
  messageHistory: [{
    role: String (enum: 'user'|'assistant'),
    content: String,
    timestamp: Date,
    tokens: Number,
    model: String
  }],
  
  // Conversation Analysis
  conversationSummary: String,
  keyConceptsCovered: [String],
  userLearningLevel: Number (1-10),
  
  // Feedback
  helpfulnessRating: Number (1-5),
  suggestedTopicsForFollowUp: [String],
  
  // Statistics
  totalMessages: Number (default: 0),
  totalTokens: Number (default: 0),
  
  // Status
  isActive: Boolean (default: true, indexed),
  lastMessageTime: Date (indexed),
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}

Indexes:
  - userId: 1, isActive: 1 (compound)
  - lastMessageTime: -1
  - conversationType: 1
```

---

## 6️⃣ ANALYTICS & TELEMETRY

### **AnalyticsSnapshot Collection**
```javascript
{
  _id: ObjectId,
  
  // User & Date
  userId: ObjectId (required, ref: 'User', indexed),
  snapshotDate: Date (default: now, indexed),
  
  // Mastery Distribution
  masteryDistribution: {
    easy: {
      percentage: Number,
      count: Number
    },
    medium: {
      percentage: Number,
      count: Number
    },
    hard: {
      percentage: Number,
      count: Number
    }
  },
  
  // Topic-Wise Mastery
  topicWiseMastery: Map<String, Number>,
  
  // Consistency Analysis
  consistencyScore: Number (0-100),
  consistencyTrend: String (enum: 'improving'|'stable'|'declining'),
  
  // Preparation Velocity
  preparationVelocity: {
    problemsSolvedThisWeek: Number (default: 0),
    problemsSolvedThisMonth: Number (default: 0),
    problemsSolvedTotal: Number (default: 0),
    averageProblemsPerDay: Number (default: 0.0)
  },
  
  // Weak Topics
  weakTopicCount: Number (default: 0),
  weakTopics: [{
    topicId: ObjectId,
    topicName: String,
    riskScore: Number
  }],
  
  // Readiness
  readinessSnapshot: {
    currentScore: Number,
    level: String,
    trend: String
  },
  
  // Comparison
  comparisonMetrics: {
    percentileRank: Number,
    comparisonCohort: String,
    trendVsLastMonth: String
  },
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}

Indexes:
  - userId: 1, snapshotDate: -1 (compound)
  - snapshotDate: -1
  - readinessSnapshot.currentScore: -1
```

### **UserTopicStats Collection**
```javascript
{
  _id: ObjectId,
  
  // References
  user_id: ObjectId (required, ref: 'User', indexed),
  topic_id: ObjectId (required, ref: 'Topic', indexed),
  
  // Attempt Statistics
  total_attempts: Number (default: 0, min: 0),
  successful_attempts: Number (default: 0, min: 0),
  failed_attempts: Number (default: 0, min: 0),
  
  // Success Rate & Consistency
  success_rate: Number (0-1, default: 0),
  consistency_score: Number (0-100, default: 0),
  
  // Time Analysis
  total_time_spent: Number (in seconds),
  average_time_per_problem: Number,
  first_attempt_success_rate: Number (0-1),
  
  // Hint Usage
  hints_used_count: Number (default: 0),
  hints_used_percentage: Number,
  
  // Performance Trend
  recent_performance: [Number] (last 5 scores),
  performance_trend: String (enum: 'improving'|'stable'|'declining'),
  
  // Problem Complexity Distribution
  easy_problems_attempted: Number (default: 0),
  medium_problems_attempted: Number (default: 0),
  hard_problems_attempted: Number (default: 0),
  
  // Last Activity
  last_attempted_date: Date (indexed),
  last_updated_date: Date,
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}

Indexes:
  - user_id: 1, topic_id: 1 (unique compound)
  - user_id: 1, success_rate: -1 (compound)
  - last_attempted_date: -1
```

### **SyncLog Collection**
```javascript
{
  _id: ObjectId,
  
  // Sync Identification
  syncBatchId: String (unique),
  userId: ObjectId (required, ref: 'User', indexed),
  platform: String (required, indexed),
  
  // Sync Timing
  startTime: Date (indexed),
  endTime: Date,
  durationMs: Number,
  
  // Sync Status
  status: String (required, enum: 'pending'|'in-progress'|'success'|'partial-success'|'failed', indexed),
  errorMessage: String,
  
  // Data Statistics
  recordsFetched: Number (default: 0),
  recordsProcessed: Number (default: 0),
  recordsInserted: Number (default: 0),
  recordsUpdated: Number (default: 0),
  recordsFailed: Number (default: 0),
  
  // Data Quality Metrics
  dataQuality: {
    completeness: Number (0-100),
    validity: Number (0-100),
    consistency: Number (0-100)
  },
  
  // Sync Cursor (for incremental syncs)
  syncCursor: {
    lastId: String,
    lastTimestamp: Date,
    offset: Number,
    checkpoint: String
  },
  
  // Performance
  throughputRecordsPerSecond: Number,
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}

Indexes:
  - platform: 1, startTime: -1 (compound)
  - userId: 1, platform: 1, startTime: -1 (compound)
  - status: 1, createdAt: -1 (compound)
  - syncBatchId: 1 (unique)
```

### **IntegrationMetadata Collection**
```javascript
{
  _id: ObjectId,
  
  // Integration Identification
  userId: ObjectId (required, ref: 'User', indexed),
  platform: String (required, enum: 'leetcode'|'codeforces'|'hackerrank'|'atcoder'|'manual', indexed),
  // composite unique: userId + platform
  
  // Platform Credentials
  platformUsername: String (required),
  platformUserId: String,
  accessToken: String (encrypted),
  refreshToken: String (encrypted),
  tokenExpiresAt: Date,
  
  // Connection Status
  isConnected: Boolean (default: false, indexed),
  lastConnectionCheck: Date,
  connectionError: String,
  
  // Sync Scheduling
  lastSyncTime: Date,
  nextSyncTime: Date,
  syncStatus: String (enum: 'pending'|'syncing'|'success'|'failed'),
  
  // Rate Limiting
  rateLimit: {
    requests: Number,
    perSeconds: Number,
    remaining: Number,
    resetTime: Date,
    limitReachedAt: Date
  },
  
  // Sync Statistics
  statistics: {
    totalSyncs: Number (default: 0),
    successfulSyncs: Number (default: 0),
    failedSyncs: Number (default: 0),
    totalRecordsFetched: Number (default: 0),
    averageSyncTimeMs: Number
  },
  
  // Data Quality
  dataQuality: {
    completeness: Number (0-100),
    validity: Number (0-100),
    freshness: Number (0-100)
  },
  
  // Health Check
  health: {
    status: String (enum: 'healthy'|'degraded'|'unhealthy'),
    lastHealthCheck: Date,
    issues: [String]
  },
  
  // Sync Configuration
  syncFrequency: String (enum: 'hourly'|'daily'|'weekly'|'manual'),
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}

Indexes:
  - userId: 1, platform: 1 (unique compound)
  - isConnected: 1
  - lastSyncTime: -1
  - nextSyncTime: 1
```

---

## 7️⃣ PLATFORM SYNC

### **UserPlatformSyncState Collection**
```javascript
{
  _id: ObjectId,
  
  // References
  userId: ObjectId (required, ref: 'User', indexed),
  platform: String (required, indexed),
  
  // Sync State
  lastSyncTime: Date (indexed),
  nextSyncTime: Date,
  syncStatus: String (enum: 'pending'|'syncing'|'success'|'failed'),
  
  // Pagination/Cursor State
  syncCursor: {
    lastFetchedId: String,
    lastFetchedTime: Date,
    pageNumber: Number,
    offset: Number
  },
  
  // Statistics
  totalRecordsSynced: Number,
  lastSyncRecordCount: Number,
  
  // Metadata
  platformUserId: String,
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}

Indexes:
  - userId: 1, platform: 1 (unique compound)
  - lastSyncTime: -1
  - nextSyncTime: 1
```

### **UserSubmission Collection**
```javascript
{
  _id: ObjectId,
  
  // References
  userId: ObjectId (required, ref: 'User', indexed),
  problemId: ObjectId (indexed),
  
  // Submission Metadata
  platformSubmissionId: String (indexed),
  platform: String (required, indexed),
  
  // Result
  status: String (enum: 'accepted'|'wrong-answer'|'time-limit'|'runtime-error'|'compilation-error'|'pending'),
  passed: Boolean,
  
  // Metrics
  runtime: Number (in ms),
  memory: Number (in MB),
  language: String,
  
  // Timestamp
  submissionTime: Date (indexed),
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}

Indexes:
  - userId: 1, platform: 1 (compound)
  - platformSubmissionId: 1
  - submissionTime: -1
```

### **UserContest Collection**
```javascript
{
  _id: ObjectId,
  
  // References
  userId: ObjectId (required, ref: 'User', indexed),
  platform: String (required, indexed),
  
  // Contest Info
  contestId: String (indexed),
  contestName: String,
  contestDate: Date,
  
  // Performance
  rank: Number,
  rating: Number,
  score: Number,
  problems_solved: Number,
  
  // Participation
  participationTime: Date,
  durationMinutes: Number,
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}

Indexes:
  - userId: 1, platform: 1, contestDate: -1 (compound)
  - contestDate: -1
  - rating: -1
```

---

## 8️⃣ COMPLIANCE & MONITORING

### **UserPreparationCompliance Collection**
```javascript
{
  _id: ObjectId,
  
  // User Reference
  userId: ObjectId (required, ref: 'User', indexed),
  
  // Compliance Metrics
  plannedTasksPerWeek: Number,
  completedTasksPerWeek: Number,
  completionRate: Number (0-100),
  
  // Consistency
  practiceConsistencyScore: Number (0-100),
  weeklyConsistency: {
    week: Date,
    taskCompletionRate: Number
  },
  
  // Milestones
  milestonesOnTrack: Boolean,
  estimatedCompletionDate: Date,
  
  // Deviations
  deviations: [{
    date: Date,
    reason: String,
    impactScore: Number
  }],
  
  // Status
  complianceStatus: String (enum: 'on-track'|'at-risk'|'off-track'),
  lastReviewDate: Date,
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}

Indexes:
  - userId: 1 (unique)
  - complianceStatus: 1
  - lastReviewDate: -1
```

### **AutomationStatus Collection**
```javascript
{
  _id: ObjectId,
  
  // Automation Job Info
  jobId: String (unique),
  jobType: String (enum: 'telemetry-worker'|'sync-worker'|'mastery-update'|'weak-topic-detection'|'readiness-calculation'),
  
  // Status
  status: String (enum: 'pending'|'running'|'success'|'failed'|'paused'),
  
  // Timing
  startTime: Date,
  endTime: Date,
  durationMs: Number,
  
  // Error & Logging
  error: String,
  logUrl: String,
  
  // Retry Info
  retryCount: Number (default: 0),
  maxRetries: Number (default: 3),
  nextRetryTime: Date,
  
  // Affected Records
  recordsProcessed: Number,
  recordsSucceeded: Number,
  recordsFailed: Number,
  
  // Scheduling
  nextScheduledRun: Date,
  frequency: String (enum: 'hourly'|'daily'|'weekly'|'monthly'),
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}

Indexes:
  - jobId: 1 (unique)
  - jobType: 1
  - status: 1, startTime: -1 (compound)
  - nextScheduledRun: 1
```

---

## 📊 Database Statistics

| Collection | Purpose | Typical Size |
|-----------|---------|--------------|
| User | User accounts | Small (hundreds) |
| Topic | Knowledge topics | Small (100-500) |
| Problem | Coding problems | Medium (10k-100k) |
| Submission | Problem submissions | Large (millions) |
| PlatformIntegration | Platform connections | Small (thousands) |
| Roadmap | Learning paths | Small (10-100) |
| UserRoadmapProgress | Progress tracking | Medium (thousands) |
| MasteryMetric | Mastery scores | Large (millions) |
| ReadinessScore | Interview readiness | Medium (thousands) |
| PracticeSession | Practice history | Large (millions) |
| PreparationTask | Scheduled tasks | Large (millions) |
| AIMentorConversation | Chat history | Large (millions) |
| AnalyticsSnapshot | Daily snapshots | Large (millions) |
| CanonicalProblem | Problem mapping | Medium (10k-50k) |

---

## 🔗 Key Relationships

```
User
├── PlatformIntegration (1:N)
├── Topic (via UserRoadmapProgress)
├── Roadmap (via UserRoadmapProgress)
├── Problem (via Submission)
├── MasteryMetric (1:N via Topic)
├── WeakTopicSignal (1:N via Topic)
├── ReadinessScore (1:1)
├── RevisionSchedule (1:N via Topic)
├── PracticeSession (1:N)
├── PreparationTask (1:N)
├── AIMentorConversation (1:N)
├── AnalyticsSnapshot (1:N)
└── UserTopicStats (1:N via Topic)

Roadmap
├── RoadmapTopic (1:N)
├── Topic (via RoadmapTopic)
└── User (via UserRoadmapProgress)

Problem
├── Submission (1:N)
├── PlatformProblemMapping (1:N)
├── RoadmapTopicProblem (1:N)
└── CanonicalProblem (N:1 via PlatformProblemMapping)
```

---

## 🎯 AI/ML Collection Dependencies

The ML intelligence layer depends on:
- **MasteryMetric** - Core learning state
- **WeakTopicSignal** - Problem detection
- **ReadinessScore** - Interview readiness
- **RevisionSchedule** - Spaced repetition
- **UserTopicStats** - Aggregated stats
- **AnalyticsSnapshot** - Daily snapshots
- **Submission** - Raw performance data

---

## 📝 Notes

- All timestamps use MongoDB's native Date type
- IDs are MongoDB ObjectIds (except String IDs for specific purposes)
- Compound indexes optimize multi-field queries
- Sparse indexes for optional unique fields
- Text indexes on Problem title/description for search
- Most collections use soft deletes via `is_active`/`isActive` flags

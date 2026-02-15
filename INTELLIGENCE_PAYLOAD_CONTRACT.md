# Intelligence Payload Contract

**Status**: UNIFIED STANDARD - All three layers must conform to this contract
**Version**: 1.0
**Last Updated**: 2024

---

## Core Principle

All intelligence data flowing through the system (Python ML → Express Backend → React Frontend) MUST conform to these contract definitions. This ensures:
- ✅ Type safety across layers
- ✅ Predictable frontend UI rendering
- ✅ Consistent API responses
- ✅ Easy feature additions
- ✅ ML output complete utilization

---

## 1. Mastery Intelligence Payload

**Location**: `/api/dashboard/mastery-growth`
**Consumed By**: Frontend dashboard, recommendation engine
**Updated By**: IntelligenceOrchestratorService, unifiedIntelligencePipeline

```typescript
// TypeScript Interface - React Frontend
interface MasteryIntelligence {
  topic: string;                    // Human-readable topic name
  topicId: string;                  // MongoDB ObjectId
  mastery: number;                  // 0-100 (percentage)
  confidence: number;               // 0-100 (model confidence in prediction)
  improvementTrend: 'improving' | 'stable' | 'declining';
  recommendedDifficulty: 'easy' | 'medium' | 'hard';
  problemsSolved: number;           // Total problems completed
  successRate: number;              // 0-100 (recent success rate)
  isWeakTopic: boolean;             // Flagged by weakness detection
  riskScore: number;                // 0-100 (intervention priority)
  interventionRequired: boolean;    // Hint: should show intervention UI
  lastUpdated: ISO8601DateTime;
  daysSinceLastAttempt: number;     // -1 if never attempted
}

interface MasteryGrowthResponse {
  success: boolean;
  source: 'snapshot' | 'aggregation';  // Performance indicator
  data: {
    masteryScores: MasteryIntelligence[];
    summary: MasterySummary;
  };
}

interface MasterySummary {
  totalTopicsTracked: number;
  averageMastery: number;           // 0-100
  weakTopicsCount: number;          // Topics with risk > 70
  improvedTopicsCount: number;      // Topics trending up
}
```

**MongoDB Schema** - Backend storage post-ML processing:

```javascript
{
  userId: ObjectId,
  topicId: ObjectId,
  masteryScore: Number,            // 0-1 (stored as decimal, 100× for percent)
  confidenceScore: Number,         // 0-1
  improvementTrend: String,        // 'improving'|'stable'|'declining'
  problemsSolved: Number,
  successRate: Number,             // 0-1
  riskScore: Number,               // 0-100
  interventionRequired: Boolean,
  lastUpdated: Date
}
```

**Python Pydantic Model** - ML service output:

```python
from pydantic import BaseModel
from typing import Literal
from datetime import datetime

class MasteryUpdate(BaseModel):
    user_id: str
    topic_id: str
    mastery_probability: float      # 0-1
    confidence_score: float         # 0-1
    improvement_trend: Literal['improving', 'stable', 'declining']
    recommended_difficulty: Literal['easy', 'medium', 'hard']
    attempts_count: int
    explainability: dict = {}       # Reasoning from BKT algorithm
    timestamp: datetime = datetime.utcnow()
```

---

## 2. Readiness Intelligence Payload

**Location**: `/api/dashboard/readiness`
**Consumed By**: Frontend dashboard, interview readiness indicator
**Updated By**: readinessAutomationService, IntelligenceOrchestratorService

```typescript
// TypeScript Interface - React Frontend
interface ReadinessIntelligence {
  readinessScore: number;           // 0-100 (percentage)
  readinessLevel: 'not-ready' | 'early-stage' | 'progressing' | 'mostly-ready' | 'interview-ready';
  confidence: number;               // 0-100 (model confidence)
  estimatedReadyDate: ISO8601DateTime | null;
  contributingFactors: ReadinessFactor[];
  weakAreas: string[];              // Top 3 topics needing focus
  strongAreas: string[];            // Top 3 topics mastered
  daysSinceUpdate: number;
}

interface ReadinessFactor {
  factor: 'mastery' | 'retention' | 'consistency' | 'difficulty_coverage';
  value: number;                    // 0-100
  weight: number;                   // 0-1 (importance in calculation)
  status: 'critical' | 'warning' | 'good' | 'excellent';
}

interface ReadinessResponse {
  success: boolean;
  data: ReadinessIntelligence;
}
```

**MongoDB Schema** - Backend storage:

```javascript
{
  userId: ObjectId,
  overallReadinessScore: Number,    // 0-1
  readinessLevel: String,           // Enum
  confidence: Number,               // 0-1
  estimatedReadyDate: Date,
  contributingFactors: [{
    factor: String,
    value: Number,                  // 0-1
    weight: Number                  // 0-1
  }],
  weakAreas: [String],              // Topic IDs
  strongAreas: [String],            // Topic IDs
  lastUpdated: Date,
  explainability: Object
}
```

**Python Pydantic Model** - ML service output:

```python
class ReadinessPrediction(BaseModel):
    user_id: str
    readiness_score: float          # 0-1
    readiness_level: Literal['not-ready', 'early-stage', 'progressing', 'mostly-ready', 'interview-ready']
    confidence: float               # 0-1
    estimated_ready_date: Optional[datetime]
    contributing_factors: List[dict]  # [{factor, value, weight, status}]
    weak_areas: List[str]           # Topic IDs
    strong_areas: List[str]         # Topic IDs
    explainability: dict            # Reasoning trace
    timestamp: datetime = datetime.utcnow()
```

---

## 3. Weakness Intelligence Payload

**Location**: `/api/dashboard/mastery-growth` (included in each topic), or separate `/api/weakness/signals`
**Consumed By**: Intervention recommendations, task prioritization
**Updated By**: submissionAutomationService, IntelligenceOrchestratorService

```typescript
// TypeScript Interface - React Frontend
interface WeaknessSignal {
  topicId: string;
  topicName: string;
  masteryGap: number;               // 0-1 (distance from target)
  retentionRisk: number;            // 0-1 (forgetting urgency)
  difficultyGap: number;            // 0-1 (performance vs expected)
  consistencyScore: number;         // 0-1 (pattern regularity)
  riskScore: number;                // 0-100 (weighted combination)
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  signalTypes: string[];            // ['mastery_gap', 'retention_decay', 'high_error_rate']
  interventionPriority: number;     // 0-100 (urgency)
  suggestedActions: Action[];
  lastDetected: ISO8601DateTime;
}

interface Action {
  type: 'practice' | 'revise' | 'mentor' | 'simulate';
  description: string;
  estimatedTime: number;            // minutes
}

interface WeaknessResponse {
  success: boolean;
  data: {
    weakTopics: WeaknessSignal[];
    focusAreas: string[];           // Top 3 topics needing immediate focus
    interventionPriorityScore: number;  // 0-100
  };
}
```

**MongoDB Schema** - Backend storage:

```javascript
{
  userId: ObjectId,
  topicId: ObjectId,
  masteryGap: Number,               // 0-1
  retentionRisk: Number,            // 0-1
  difficultyGap: Number,            // 0-1
  consistencyScore: Number,         // 0-1
  riskScore: Number,                // 0-100
  riskLevel: String,                // Enum
  signalTypes: [String],
  interventionRequired: Boolean,
  interventionPriority: Number,     // 0-100
  suggestedActions: [Object],
  lastDetected: Date
}
```

**Python Pydantic Model** - ML service output:

```python
class WeaknessAnalysis(BaseModel):
    user_id: str
    weak_topics: List[dict]         # [{topic_id, risk_score, factors, signal_types}]
    focus_areas: List[str]          # Top 3 topic IDs
    intervention_priority_score: float  # 0-1
    explainability: dict
    timestamp: datetime = datetime.utcnow()
```

---

## 4. Recommendations Payload

**Location**: `/api/practice/recommendations/:topicId`
**Consumed By**: Practice lab, problem selection
**Updated By**: AdaptivePracticeRecommendationService

```typescript
// TypeScript Interface - React Frontend
interface ProblemRecommendation {
  problemId: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  estimatedSolveTime: number;       // seconds
  keyLearningsRequired: string[];
  successProbability: number;       // 0-1 (predicted success rate)
}

interface RecommendationsResponse {
  success: boolean;
  data: {
    recommendedProblems: ProblemRecommendation[];
    recommendedDifficulty: 'easy' | 'medium' | 'hard';
    reasonExplanation: string;      // Why these problems/difficulty
    masteryScore: number;           // 0-100 for this topic
    nextLevelRecommended: boolean;  // Should user progress to next difficulty
    estimatedTimeToMastery: number; // hours
  };
}
```

**MongoDB Schema** - Not stored, computed on-demand

**Python Pydantic Model** - Not a direct ML output, computed by backend

---

## 5. Adaptive Task Payload

**Location**: `/api/dashboard/today-tasks`
**Consumed By**: Today's learning agenda, task display
**Updated By**: plannerAutomationService

```typescript
// TypeScript Interface - React Frontend
interface TaskRecommendation {
  taskId: string;
  topic: string;
  type: 'practice' | 'revise' | 'mock-interview' | 'conceptual-learning';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number;            // minutes
  priority: 'critical' | 'high' | 'medium' | 'low';
  rationale: string;                // Why this task now
  resources: string[];              // URLs or IDs of learning materials
}

interface TasksResponse {
  success: boolean;
  data: {
    tasks: TaskRecommendation[];
    estimatedTotalTime: number;     // minutes to complete all
    focusArea: string;              // Primary topic today
    recommendedOrder: string[];     // Task IDs in recommended order
    lastUpdated: ISO8601DateTime;
  };
}
```

---

## 6. Dashboard Snapshot Payload (Read Model)

**Location**: Internal (cached reading, used by /api/dashboard/summary)
**Purpose**: Denormalized view for <100ms queries

```typescript
// TypeScript Interface - Backend read model
interface DashboardSnapshot {
  userId: ObjectId;
  totalSolved: number;
  solveRate: number;                // 0-1
  masteryDistribution: {
    excellent: number;              // Mastery >= 0.8
    good: number;                   // 0.6-0.8
    moderate: number;               // 0.4-0.6
    weak: number;                   // < 0.4
  };
  weakTopics: WeaknessSignal[];      // Top 5
  strongTopics: string[];           // Top 5
  readinessScore: number;           // 0-1
  readinessLevel: string;
  consistencyScore: number;         // 0-1
  activeTasks: number;
  practiceStreakDays: number;
  lastUpdatedAt: ISO8601DateTime;
}
```

---

## 7. Frontend Expected Payload Structure

**Aggregate Intelligence Response** - Could consolidate all signals:

```typescript
interface UnifiedIntelligencePayload {
  topicId: string;
  
  // Mastery signals
  mastery: MasteryIntelligence;
  
  // Readiness signals
  readiness: ReadinessIntelligence;
  
  // Weakness signals
  weakness?: WeaknessSignal;
  
  // Recommendations
  recommendations: ProblemRecommendation[];
  recommendations_difficulty: 'easy' | 'medium' | 'hard';
  
  // Tasks
  suggested_tasks: TaskRecommendation[];
  
  // Metadata
  confidence: number;               // 0-1 (overall confidence)
  lastUpdated: ISO8601DateTime;
  dataFreshness: 'fresh' | 'recent' | 'stale';  // Age indicator
}
```

---

## Implementation Checklist

### Backend (Express)
- [x] `/api/dashboard/mastery-growth` - Returns MasteryGrowthResponse
- [x] `/api/dashboard/readiness` - Returns ReadinessResponse
- [ ] `/api/weakness/signals` - Returns WeaknessResponse (needs creation)
- [x] `/api/practice/recommendations/:topicId` - Returns RecommendationsResponse
- [x] `/api/dashboard/today-tasks` - Returns TasksResponse
- [x] `/api/dashboard/summary` - Uses DashboardSnapshot

### Frontend (React)
- [ ] Update userDataService.ts to consume new payloads
- [ ] Update dashboard components to display all intelligence fields
- [ ] Add UI indicators for confidence scores
- [ ] Add intervention badges for risk_score > 70
- [ ] Show improvement trends with visual indicators

### Python ML Services
- [ ] Mastery Engine returns MasteryUpdate schema ✅
- [ ] Readiness Model returns ReadinessPrediction schema ✅
- [ ] Weakness Detection returns WeaknessAnalysis schema ✅
- [ ] Planner returns task structure ✅

---

## Evolution & Extensibility

### Adding New Signals (Future)

1. **Define TypeScript interface** in `/frontend/src/types/intelligence.ts`
2. **Add MongoDB schema** fields in model
3. **Create Python Pydantic model** in ML service
4. **Update orchestrator** to populate new fields
5. **Update API response** to include new payload
6. **Update frontend** to render new data

### Example: Adding "EstimatedHours-To-Mastery"

```typescript
// Frontend
interface MasteryIntelligence {
  // ... existing fields
  estimatedHoursToMastery: number;   // NEW
  hoursAlreadySpent: number;         // NEW
  masteryProjectionDate: ISO8601DateTime;  // NEW
}
```

---

## Testing Contract Compliance

Every endpoint should be tested to ensure:

1. ✅ Response structure matches defined interface
2. ✅ All required fields present
3. ✅ No extra unexpected fields
4. ✅ Field values in expected ranges
5. ✅ Timestamps in ISO8601 format
6. ✅ Null values handled gracefully

---

## Performance Targets

| Endpoint | Source | Target Latency | SLA |
|----------|--------|-----------------|-----|
| /mastery-growth | Snapshot | <50ms | 99% |
| /mastery-growth | Aggregation | <500ms | 95% |
| /readiness | Database | <100ms | 99% |
| /recommendations | Database | <200ms | 98% |
| /today-tasks | Aggregation | <300ms | 98% |
| /summary | Snapshot | <100ms | 99% |

---

**Compliance**: All new intelligence additions must conform to this contract before deployment.

# Complete Data Flow: Login → ML Processing → Dashboard

## Overview
This document describes the complete data flow from user login through ML processing to dashboard rendering in the PrepMate AI platform.

## Architecture Flow

```
User Login (Frontend)
    ↓
authStore.login() → Backend /auth/login
    ↓
Generate JWT Token + User Object
    ↓
Store in Zustand + localStorage
    ↓
userDataService.fetchUserDataAfterLogin()
    ├─ GET /dashboard/summary (user metrics, mastery scores)
    ├─ GET /submissions (submission history for ML)
    └─ Cache in localStorage
    ↓
userDataService.triggerMLProcessing()
    ├─ POST /automation/trigger/planner (Adaptive Planner)
    └─ POST /automation/trigger/readiness (Readiness Model)
    ↓
Backend ML Processing
    ├─ submissionAutomationService.js
    ├─ Bull Queue Worker
    ├─ Telemetry Feature Extraction
    ├─ Mastery Engine Calculation
    └─ Readiness Score Computation
    ↓
Dashboard Loads
    ├─ Fetches /dashboard/summary (with ML results)
    ├─ Fetches /dashboard/intelligence
    ├─ Fetches /user/tasks/today
    └─ Displays real-time automation results
    ↓
Frontend Components Render
    ├─ IntelligenceExecutionPanel (tasks + compliance)
    ├─ AutomationHealthIndicator (queue/scheduler status)
    ├─ PreparationComplianceWidget (compliance trends)
    └─ MasteryChart (mastery scores by topic)
```

## 1. Login → Authentication

### Frontend (DashboardPage.tsx, authStore.ts)
```typescript
// 1. User submits login form
const { user, token } = await authService.login(email, password);

// 2. Zustand store receives data
authStore.login(email, password);
  → setAuthenticated(true)
  → setToken(token)
  → setUser(user)
  → apiClient.setToken(token)
```

### Backend (authController.js)
```javascript
// Login handler
const login = async (req, res) => {
  const user = await User.findOne({ email });
  const token = generateToken(user._id, user.email);
  
  res.json({
    success: true,
    data: {
      user: user.toJSON(),
      token
    }
  });
};
```

## 2. User Data Fetching (userDataService.ts)

After successful login, the frontend automatically fetches user data:

```typescript
// In authStore.login() → automatically calls:
await userDataService.fetchUserDataAfterLogin();

// This fetches:
1. GET /dashboard/summary
   Returns: {
     totalScore,
     masteryScores {},
     readinessScore,
     recentActivity [],
     topicsAttempted []
   }

2. GET /submissions (limit: 100)
   Returns: []  // User's submission history for ML analysis

3. Cache in localStorage:
   localStorage.setItem('user_dashboard_data', ...)
   localStorage.setItem('user_submissions', ...)
```

## 3. ML Processing Trigger

### Frontend Triggers Backend ML
```typescript
// In userDataService:
userDataService.triggerMLProcessing();
  → POST /automation/trigger/planner
  → POST /automation/trigger/readiness
```

### Backend ML Services (ai-services/)

**submissionAutomationService.js** orchestrates ML:

```javascript
async processUserSubmissions(userId) {
  // 1. Extract telemetry features
  const features = await telemetryFeatures.extract(submissions);
  
  // 2. Calculate Mastery Scores
  const masteryScores = await masteryEngine.calculate(features);
  
  // 3. Detect Weakness Signals  
  const weaknessSignals = await weaknessDetection.detect(features);
  
  // 4. Compute Readiness Score
  const readinessScore = await readinessModel.predict(features);
  
  // 5. Generate Adaptive Plan
  const adaptivePlan = await adaptivePlanner.generate(
    masteryScores,
    weaknessSignals,
    readinessScore
  );
  
  // 6. Store Results in MongoDB
  await AutomationStatus.create({
    userId,
    status: 'completed',
    results: {
      masteryScores,
      weaknessSignals,
      readinessScore,
      adaptivePlan
    }
  });
}
```

### Bull Queue Processing
```javascript
// submissionIntelligenceWorker.js
queue.process(async (job) => {
  const { userId } = job.data;
  
  // Run ML pipeline
  const results = await submissionAutomationService.processUserSubmissions(userId);
  
  // Update dashboard data
  await dashboardService.updateUserMetrics(userId, results);
  
  return results;
});
```

## 4. Dashboard Data Rendering

### Data Fetching (DashboardPage.tsx)
```typescript
// TanStack Query fetches real backend data:

// Intelligence metrics
useQuery({
  queryKey: ['dashboard/intelligence'],
  queryFn: () => apiClient.get('/dashboard/intelligence'),
  refetchInterval: 5 * 60 * 1000 // 5 min polls
});

// Today's tasks
useQuery({
  queryKey: ['user/tasks/today'],
  queryFn: () => apiClient.get('/user/tasks/today'),
  refetchInterval: 1 * 60 * 1000 // 1 min polls
});

// Automation status
useQuery({
  queryKey: ['automation/status'],
  queryFn: () => apiClient.get('/automation/status'),
});

// Compliance metrics
useQuery({
  queryKey: ['user/compliance'],
  queryFn: () => apiClient.get('/user/compliance'),
});
```

### Component Rendering with Real Data

**IntelligenceExecutionPanel** shows:
- Today's tasks from DB
- Task completion percentage
- Weekly compliance metrics
- Automation heartbeat

**AutomationHealthIndicator** shows:
- Queue statistics (processing/pending/completed)
- Scheduler status (healthy/degraded)
- Recent automation runs

**PreparationComplianceWidget** shows:
- Weekly compliance score (from UserPreparationCompliance model)
- Consistency index
- Current/best streaks
- Compliance trends

**MasteryChart** shows:
- Mastery scores by topic (from MasteryMetric model)
- Topic progression over time

## 5. Data Models Involved

### Frontend
- **authStore** - User authentication state
- **dashboardStore** - Dashboard UI state

### Backend
- **User** - User profile
- **UserSubmission** - Practice submissions
- **MasteryMetric** - ML-calculated mastery scores
- **ReadinessScore** - ML-calculated readiness
- **WeakTopicSignal** - ML-detected weaknesses
- **AutomationStatus** - Automation execution logs
- **UserPreparationCompliance** - Task completion tracking
- **PreparationTask** - Daily tasks

## 6. Session Restoration

When user returns to site:

```typescript
// App.tsx → useAuthInitialize()
// In sessionService.ts:

async initializeSession() {
  const token = authStore.token;
  
  if (!token) {
    // No session, show login
    return;
  }
  
  // Verify token with backend
  const response = await apiClient.get('/auth/me');
  
  if (response.success) {
    // Valid token - refetch user data
    authStore.setUser(response.data.user);
    await userDataService.fetchUserDataAfterLogin();
  } else {
    // Invalid token - clear auth, show login
    authStore.logout();
  }
}
```

## 7. Testing the Complete Flow

### Clear Auth & Start Fresh
```javascript
// In browser console:
authDebug.clear();
// Redirects to /login
```

### Check Auth State
```javascript
// In browser console:
authDebug.log();
// Logs current auth state
```

### Verify Data is Cached
```javascript
// In browser console:
localStorage.getItem('user_dashboard_data');
localStorage.getItem('user_submissions');
```

### Test ML Processing
```bash
# After login, manually trigger ML:
curl -X POST http://localhost:5000/api/automation/trigger/planner \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Check Automation Status
```bash
curl -X GET http://localhost:5000/api/automation/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 8. Debugging Tips

### If dashboard shows instead of login:
1. Clear localStorage: `authDebug.clear()`
2. Check auth state: `authDebug.log()`
3. Verify token validity: `authDebug.isValid()`

### If ML data not showing:
1. Check `/dashboard/summary` endpoint returns data
2. Verify Python ML service is running on port 8000
3. Check Bull queue is processing jobs
4. Look at automation logs: GET `/api/automation/status`

### If tasks not showing:
1. Verify tasks exist in DB
2. Check `/user/tasks/today` endpoint
3. Ensure today's date is within task scheduledDate range

## 9. API Endpoints Used

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user

### User Data
- `GET /dashboard/summary` - User metrics & ML results
- `GET /dashboard/intelligence` - Intelligence metrics
- `GET /user/tasks/today` - Today's tasks
- `GET /user/compliance` - Compliance tracking
- `GET /submissions` - User submissions history

### ML Triggers
- `POST /automation/trigger/planner` - Trigger adaptive planner
- `POST /automation/trigger/readiness` - Trigger readiness computation
- `GET /automation/status` - Check automation pipeline status

## 10. Key Files Modified

### Frontend
- `src/store/authStore.ts` - Auth state + user data fetching
- `src/services/userDataService.ts` - User data & ML trigger service
- `src/services/sessionService.ts` - Session initialization
- `src/modules/dashboard/pages/DashboardPage.tsx` - Dashboard with error boundaries
- `src/components/ErrorBoundary.tsx` - Error handling
- `src/utils/authDebug.ts` - Debugging utilities

### Backend
- `src/controllers/automationController.js` - ML trigger endpoints
- `src/services/automation/submissionAutomationService.js` - ML orchestration
- `src/models/` - Data models for ML results

---

**Last Updated:** Feb 14, 2026
**Status:** Complete - All systems operational

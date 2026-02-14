/**
 * DASHBOARD QUICK REFERENCE GUIDE
 * PrepMate AI - Production Intelligence Dashboard
 * 
 * Essential information for developers working with the dashboard system
 */

# 🚀 Dashboard Quick Reference

## 1️⃣ Backend Endpoints Summary

| Endpoint | Method | Purpose | Query Params |
|----------|--------|---------|---------------|
| `/api/dashboard/summary` | GET | High-level statistics | - |
| `/api/dashboard/activity` | GET | Daily submission timeline | `days=7,14,30` |
| `/api/dashboard/intelligence` | GET | AI metrics & weak topics | - |
| `/api/dashboard/today-tasks` | GET | Recommended tasks | - |
| `/api/dashboard/readiness-trend` | GET | Historical readiness | `days=7,14,30` |
| `/api/dashboard/mastery-growth` | GET | Topic mastery stats | - |

**All endpoints require:** `Authorization: Bearer JWT_TOKEN` header

---

## 2️⃣ Frontend Components Map

```
DashboardPage (Main Container)
│
├─ IntelligenceHeader
│  └─ Hero section: Readiness %, Completeness %, Consistency %, Velocity
│
├─ Three-Column Section
│  ├─ PlatformSyncCard (Platform list, sync status)
│  ├─ TodayTasksPanel (High/Med/Low priority tasks)
│  └─ WeakTopicsCard (Risk-scored topics with signals)
│
├─ Two-Column Charts
│  ├─ ActivityChart (Daily bars + trend line)
│  └─ ReadinessTrendChart (30-day progression)
│
├─ Full-Width
│  └─ MasteryChart (Top 8 topics by mastery %)
│
└─ Conditional
   └─ ActivityFeed (Recent submissions)
```

---

## 3️⃣ Data Fetching Pattern

```typescript
// 1. Define query key and function
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['dashboard/summary'],
  queryFn: dashboardService.fetchDashboardSummary,
  staleTime: 5 * 60 * 1000,  // Cache for 5 minutes
});

// 2. Component receives data prop
<IntelligenceHeader data={data?.data} isLoading={isLoading} />

// 3. Manual refresh when needed
const handleRefresh = () => {
  dashboardStore.setLoadingSync(true);
  Promise.all([
    summaryQuery.refetch(),
    activityQuery.refetch(),
    // ... refetch other queries
  ]).finally(() => dashboardStore.setLoadingSync(false));
};
```

---

## 4️⃣ State Management (Zustand Store)

```typescript
// Access filters
const filters = useDashboardStore((state) => state.filters);

// Update filters
const setActivityDays = useDashboardStore((state) => state.setActivityDays);
setActivityDays(14);  // Change activity chart to 14-day view

// Trigger refresh across all components
const triggerRefresh = useDashboardStore((state) => state.triggerRefresh);
triggerRefresh();  // Increments counter, watched by useEffect

// Monitor sync loading
const isLoadingSync = useDashboardStore((state) => state.isLoadingSync);
```

---

## 5️⃣ API Response Structure

### `/summary` Response
```json
{
  "totalProblemsSolved": 127,
  "problemsSolvedLast7Days": 22,
  "difficultyDistribution": { "easy": 45, "medium": 62, "hard": 20 },
  "syncedPlatforms": [
    { "name": "leetcode", "connected": true, "username": "foo", "lastSync": "..." }
  ],
  "readinessScore": 73
}
```

### `/intelligence` Response
```json
{
  "readinessScore": 73,
  "preparationCompletenessIndex": 65,
  "consistencyScore": 82,
  "improvementVelocity": 18,              // +18% improvement
  "velocityTrend": "improving",           // improving|declining|stable
  "weakTopics": [
    {
      "topicName": "System Design",
      "riskScore": 85,
      "riskLevel": "critical",
      "mistakeRate": "45.3",
      "signalTypes": ["low-accuracy", "high-time"]
    }
  ],
  "upcomingRevisions": [...]
}
```

### `/today-tasks` Response
```json
[
  {
    "id": "task-practice-0",
    "title": "Practice: System Design",
    "type": "practice",                   // practice|revision|roadmap|mock
    "topicName": "System Design",
    "priority": "high",                   // high|medium|low
    "difficulty": "hard",
    "estimatedMinutes": 45,
    "completed": false
  }
]
```

---

## 6️⃣ MongoDB Models Used

```typescript
// UserSubmission - Core telemetry
{
  userId, problemId, platform, difficulty, isSolved, 
  solveTime, attempts, timestamp, codeLanguage
}

// ReadinessScore - Interview readiness metric
{
  userId, score (0-100), level, timestamp, 
  trendData: [{ date, score }]
}

// UserTopicStats - Topic mastery tracking
{
  userId, topic, estimated_mastery (%), problems_solved_count,
  last_updated, practice_problems_solved
}

// WeakTopicSignal - AI-detected weak areas
{
  userId, topic, riskScore (0-100), riskLevel,
  signalTypes: [...], mistakeRate, lastDetected
}

// PlatformIntegration - Connected accounts
{
  userId, platform, username, connected, lastSync,
  syncStatus, totalProblemsSynced
}
```

---

## 7️⃣ Caching Strategy

**Stale Times (Client-side):**
- Summary: **5 min** (changes frequently)
- Activity: **10 min** (updates with new submissions)
- Intelligence: **5 min** (AI calculations)
- Tasks: **10 min** (changes with weak topics)
- Trend: **30 min** (slow-changing historical data)
- Mastery: **15 min** (updates with new submissions)

**Refresh Behavior:**
1. Fetch from cache if within stale time
2. If stale, background refetch in progress
3. Manual refresh: Clear all caches + immediate fetch
4. Component unmount: Query persists but marked stale

---

## 8️⃣ Common Tasks

### **Add a New Metric to Intelligence Header**
1. Add field to `DashboardIntelligence` interface in service
2. Add to backend `getIntelligence()` response
3. Add prop to `IntelligenceHeaderProps`
4. Create new metric card JSX
5. Pass data from parent component

### **Change Activity Chart Range**
```typescript
// In DashboardPage.tsx
const handleActivityDaysChange = (days: 7 | 14 | 30) => {
  dashboardStore.setActivityDays(days);
  // Query auto-refetch because queryKey changes
};
```

### **Add New Chart**
1. Create component (e.g., `MyChart.tsx`)
2. Add service method: `dashboardService.fetchMyData()`
3. Add useQuery hook in `DashboardPage.tsx`
4. Add component to JSX with responsive grid class
5. Add to Zustand store if needs manual refresh

### **Filter by Difficulty**
```typescript
// In component
const difficulty = useDashboardStore((s) => s.filters.difficultyFilter);

// When user clicks filter button
dashboardStore.setDifficultyFilter('hard');

// Query automatically refetches because data changed
// (Backend can accept difficulty param if needed)
```

---

## 9️⃣ Performance Tips

### **Frontend**
- ✅ Memoize chart components: `React.memo(ActivityChart)`
- ✅ Use `isLoading` to prevent unnecessary re-renders
- ✅ Lazy-load Recharts: `const Recharts = lazy(() => import('recharts'))`
- ✅ Reduce refresh frequency: increase staleTime if acceptable
- ✅ Virtualize long lists (uses TanStack Virtual)

### **Backend**
- ✅ Add indexes on `userId`, `isSolved`, `lastAttemptTime`
- ✅ Use `$facet` for multi-group aggregations
- ✅ Add `.lean()` for read-only queries
- ✅ Cache aggregation results in Redis (5-10 min TTL)
- ✅ Limit results early in pipeline: `{ $limit: 100 }`

### **Database**
```javascript
// Add these indexes to MongoDB
db.usersubmissions.createIndex({ userId: 1 })
db.usersubmissions.createIndex({ userId: 1, isSolved: 1 })
db.usersubmissions.createIndex({ userId: 1, createdAt: -1 })
db.usersubmissions.createIndex({ platform: 1 })

db.readinessscores.createIndex({ userId: 1, createdAt: -1 })
db.weaktopicsignals.createIndex({ userId: 1 })
```

---

## 🔟 Error Handling

```typescript
// In components, always handle error state
const { data, isLoading, error } = useQuery({...});

if (error) {
  return <ErrorCard message={error.message} />;
}

if (isLoading) {
  return <SkeletonLoader />;
}

return <YourComponent data={data} />;
```

**Common errors:**
- **401 Unauthorized** → JWT expired, redirect to login
- **404 Not Found** → Endpoint missing, check backend routes
- **500 Internal Server Error** → Backend aggregation failed
- **Network Error** → Backend not running or wrong URL
- **Empty data** → Database is empty, run seed script

---

## 1️⃣1️⃣ Testing Endpoints

```bash
# Start backend
npm run dev

# In another terminal, test endpoints
# Get JWT first (login endpoint)
JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Test summary
curl -H "Authorization: Bearer $JWT" \
  http://localhost:3000/api/dashboard/summary | jq

# Test activity with params
curl -H "Authorization: Bearer $JWT" \
  "http://localhost:3000/api/dashboard/activity?days=14" | jq

# Check response time
time curl -H "Authorization: Bearer $JWT" \
  http://localhost:3000/api/dashboard/summary
```

---

## 1️⃣2️⃣ File Locations

**Backend:**
- Controller: `backend/src/controllers/dashboardController.js`
- Routes: `backend/src/routes/dashboardRoutes.js`
- Models: `backend/src/models/` (UserSubmission, ReadinessScore, etc.)

**Frontend:**
- Main Page: `frontend/src/modules/dashboard/pages/DashboardPage.tsx`
- Components: `frontend/src/modules/dashboard/components/*.tsx`
- Service: `frontend/src/modules/dashboard/services/dashboardService.ts`
- Store: `frontend/src/modules/dashboard/store/dashboardStore.ts`

---

## 1️⃣3️⃣ Important Notes

⚠️ **Must Know:**
1. All endpoints require JWT authentication
2. Backend filters data by `req.user.id` (from JWT)
3. Frontend queries use TanStack Query with caching
4. Manual refresh clears all caches and refetches
5. Stale time determines when data re-fetches
6. Zustand store persists across page reloads (default)
7. Charts use Recharts library (responsive containers)
8. Skeleton loaders show during loading (not spinners)

📌 **Common Pitfalls:**
- Forgetting to add `Authorization` header → 401 error
- Not running backend server → Network errors
- Empty database → No data in components
- Wrong stale time → Too frequent refreshes
- Circular state dependencies → Infinite loops

---

## 1️⃣4️⃣ Development Workflow

```bash
# 1. Start database
mongod --config /path/to/mongodb.conf

# 2. Seed data (one time)
cd backend
node scripts/seedDatabase.js

# 3. Start backend server
npm run dev              # Runs on http://localhost:3000

# 4. In new terminal, start frontend
cd frontend
npm run dev              # Runs on http://localhost:5173

# 5. Login with test user
Email: john@example.com
Password: TestPassword123!

# 6. Navigate to dashboard
http://localhost:5173/dashboard

# 7. Check browser console & network tab for API calls
```

---

## 1️⃣5️⃣ Debugging Tips

```typescript
// Enable verbose logging in service
// dashboardService.ts
export const dashboardService = {
  async fetchDashboardSummary() {
    console.log('Fetching summary...');
    const res = await axiosInstance.get('/dashboard/summary');
    console.log('Summary response:', res.data);  // Log response
    return res.data;
  }
};

// Watch store changes
// useMemo effect
import { useDashboardStore } from './store/dashboardStore';

useEffect(() => {
  const unsubscribe = useDashboardStore.subscribe(
    (state) => console.log('Store updated:', state)
  );
  return unsubscribe;
}, []);

// React Query DevTools
import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <Your App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>

// Check response payload
// In browser Network tab:
// 1. Open DevTools (F12)
// 2. Go to Network tab
// 3. Look for dashboard/* requests
// 4. Click on request → Response tab → Check JSON
```

---

## Deployment Checklist

- [ ] MongoDB indexes created
- [ ] JWT secret configured in `.env`
- [ ] Backend API URL set in frontend `.env`
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled on API endpoints
- [ ] Error logging configured (Sentry/Datadog)
- [ ] Performance monitoring enabled
- [ ] Database backups scheduled
- [ ] Environment variables secured
- [ ] API documentation updated
- [ ] Frontend build optimized (prod mode)
- [ ] Tests passing (unit + integration)

---

**Quick Links:**
- 📖 Full Guide: `DASHBOARD_REDESIGN_GUIDE.md`
- 🔗 Backend Routes: `backend/src/routes/dashboardRoutes.js`
- 🔗 Frontend Page: `frontend/src/modules/dashboard/pages/DashboardPage.tsx`
- 📚 Components: `frontend/src/modules/dashboard/components/`

**Last Updated:** February 14, 2026  
**Status:** Production Ready ✅

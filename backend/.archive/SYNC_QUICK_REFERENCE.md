# Quick Reference: Telemetry & Sync System

## ⚡ Quick Start (5 minutes)

### 1. Backend Initialization

```javascript
// server.js - automatically initialized
const scheduledSyncService = require('./services/scheduledSyncService');

// Initialize on startup
await scheduledSyncService.initialize();
```

### 2. Environment Setup

```bash
# Set these in .env
ENABLE_SCHEDULED_SYNC=true
SYNC_INTERVAL_MINUTES=5
MONGODB_URI=mongodb://localhost:27017/prepmate
```

### 3. Start Backend

```bash
npm install
npm start
```

## 📊 Client Integration (5 minutes)

### 1. Initialize Services

```typescript
import { TelemetryService } from '@/services/telemetry';
import { SyncService } from '@/services/sync';

const telemetry = new TelemetryService();
const sync = new SyncService();

onMounted(() => {
  telemetry.initialize();
  sync.start();
});
```

### 2. Track Events

```typescript
// Single event
telemetry.captureEvent('interview_completed', {
  score: 85,
  duration: 1800
});

// Listen for sync
telemetry.on('sync:complete', (result) => {
  console.log('Synced items:', result.successCount);
});
```

## 🔗 API Quick Reference

### Track Single Event
```
POST /api/telemetry/track
{
  "eventType": "string",
  "eventData": { /* object */ },
  "metadata": { /* object */ }
}
```

### Batch Sync
```
POST /api/telemetry/batch
{
  "batchId": "string",
  "items": [ /* array */ ]
}
```

### Get Status
```
GET /api/telemetry/status
Returns: { syncStatus: { lastSyncTime, pendingItems, ... } }
```

### Health Check
```
GET /api/health
Returns: { status: "healthy", services: { ... } }
```

## 🗂️ File Structure

```
backend/src/
├── controllers/
│   └── aiTelemetryController.js      # Event handlers
├── models/
│   ├── Telemetry.js                  # Event storage
│   ├── SyncQueue.js                  # Pending items
│   └── BatchLog.js                   # Sync history
├── services/
│   ├── scheduledSyncService.js       # Auto-sync orchestrator
│   ├── syncProcessingService.js      # Batch processing
│   └── conflictResolutionService.js  # Conflict handling
└── routes/
    └── telemetry.js                  # API endpoints
```

## 📌 Common Tasks

### Check Sync Queue
```javascript
const { SyncQueue } = require('./models');

// Get pending items
await SyncQueue.find({ status: 'pending' }).limit(10);
```

### View Sync History
```javascript
const { BatchLog } = require('./models');

// Last 24 hours
await BatchLog.find({
  createdAt: { $gte: new Date(Date.now() - 86400000) }
}).sort({ createdAt: -1 });
```

### Manually Trigger Sync
```javascript
const { scheduledSyncService } = require('./services');

// Force sync now
await scheduledSyncService.triggerSync();
```

### View Event Metrics
```javascript
const { Telemetry } = require('./models');

// By event type
await Telemetry.aggregate([
  { $group: { _id: '$eventType', count: { $sum: 1 } } }
]);
```

## 🚀 Performance Tuning

| Setting | Dev | Prod |
|---------|-----|------|
| Sync Interval | 1 min | 5 min |
| Batch Size | 50 | 200 |
| Max Queue | 500 | 2000 |
| Retries | 3 | 5 |

## 🔍 Debugging

### Enable Verbose Logging
```javascript
// In .env
DEBUG=prepmate:*
VERBOSITY=debug
```

### Check Service Status
```bash
curl http://localhost:5000/api/health
```

### View Recent Errors
```javascript
db.batchLogs.find({ status: 'error' }).sort({ createdAt: -1 }).limit(5);
```

## ✅ Verification Checklist

- [ ] Server starts without errors
- [ ] MongoDB connection successful
- [ ] `/api/health` returns 200
- [ ] Client can track events
- [ ] Events appear in database
- [ ] Sync completes without errors
- [ ] Offline events queue properly
- [ ] No duplicate events created

## 🎯 Event Types to Track

- `interview_started`
- `interview_completed`
- `assessment_submitted`
- `practice_question_answered`
- `learning_module_viewed`
- `weakness_detected`
- `mentor_session_started`
- `mentor_feedback_received`

## 💾 Data Models

### Event (Telemetry)
```javascript
{
  userId, eventType, eventData, status, 
  metadata: { clientTimestamp, serverTimestamp, ... }
}
```

### Queue Item (SyncQueue)
```javascript
{
  userId, itemType, itemData, status, 
  priority, conflictResolution
}
```

### Batch (BatchLog)
```javascript
{
  batchId, userId, itemCount, successCount,
  failureCount, startTime, endTime, status
}
```

## 📞 Quick Fixes

**"Sync not running"**
- Check: `ENABLE_SCHEDULED_SYNC=true`
- Check: Server logs for errors
- Verify: MongoDB connection

**"Events not appearing"**
- Check: Network tab (POST success?)
- Check: MongoDB for collection
- Verify: Auth headers present

**"Duplicate events"**
- Ensure: Unique eventId
- Check: Client doesn't retry manually
- Use: API endpoint responses

**"Conflicts not resolving"**
- Check: Conflict data in batch logs
- Verify: Resolution strategy configured
- Review: Manual conflict resolution

## 🔗 Related Documentation

- [Full Integration Guide](./UNIFIED_INTEGRATION_GUIDE.md)
- [Database Schema](./backend/src/models/)
- [API Specification](./ai-services/API_SPECIFICATION.py)

---

**Last Updated:** January 2024  
**Version:** 1.0

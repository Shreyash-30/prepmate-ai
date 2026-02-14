# Unified Telemetry & Sync Integration Guide

## Overview

This guide documents the unified telemetry and synchronization system integrated into PrepMate AI. The system provides comprehensive client-server communication for tracking user progress, learning patterns, and ensuring real-time data synchronization.

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Application                        │
│  (Vue/React Frontend with Telemetry & Sync Services)        │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   HTTP/REST    WebSocket         Event Bus
   (REST API)   (Real-time)      (Local)
        │              │              │
        └──────────────┼──────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  Backend Services                            │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │        AI Telemetry Controller                       │   │
│  │  - Track user interactions                           │   │
│  │  - Collect learning metrics                          │   │
│  │  - Record performance data                           │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        Scheduled Sync Service                        │   │
│  │  - Periodic data synchronization                     │   │
│  │  - Conflict resolution                              │   │
│  │  - Queue management                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        Data Models                                   │   │
│  │  - Telemetry, Sync Queue, Batch Logs               │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
  MongoDB         Redis Cache     File System
  (Persistent)    (Performance)   (Logs)
```

## Data Flow

### 1. Telemetry Collection Flow

```
User Action
    │
    ▼
Client Service (captureEvent)
    │
    ├─ Add local timestamp
    ├─ Generate event ID
    └─ Emit to local event bus
        │
        ▼
    Write to IndexedDB (offline support)
        │
        ▼
    Queue for sync
        │
        ▼
Send to `/api/telemetry/track` endpoint
        │
        ▼
Backend Processing:
    ├─ Validate event
    ├─ Enrich with server timestamp
    ├─ Process through ML pipelines
    └─ Store in MongoDB
        │
        ▼
    Response to client (200 OK)
```

### 2. Scheduled Sync Flow

```
Sync Interval Trigger (default: 5 minutes)
    │
    ▼
Retrieve all pending items from sync queue
    │
    ├─ Batch events
    ├─ Check for conflicts
    └─ Prioritize by importance
        │
        ▼
    Send via `/api/telemetry/batch` endpoint
        │
        ▼
Backend Processing:
    ├─ Process batch
    ├─ Handle conflicts
    ├─ Update queue status
    └─ Update master data
        │
        ▼
    Return sync results
        │
        ▼
Client Processing:
    ├─ Mark items as synced
    ├─ Remove from local queue
    ├─ Update conflict items
    └─ Emit sync complete event
```

## Implementation Details

### Backend Setup

#### 1. Dependencies Installation

```bash
cd backend
npm install
```

Key packages:
- `express` - REST API framework
- `mongoose` - MongoDB ORM
- `dotenv` - Environment configuration
- `node-schedule` - Task scheduling

#### 2. Environment Variables

Add to `.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/prepmate
MONGODB_BACKUP_URI=mongodb://backup-server:27017/prepmate-backup

# Sync Configuration
ENABLE_SCHEDULED_SYNC=true
SYNC_INTERVAL_MINUTES=5
SYNC_BATCH_SIZE=100
MAX_RETRIES=3
RETRY_DELAY_MS=5000

# Performance
CACHE_TTL_SECONDS=300
MAX_QUEUE_SIZE=1000

# AI Services
GEMINI_API_KEY=your_key_here
MODEL_API_BASE_URL=http://localhost:5001
```

#### 3. Database Schema

**Telemetry Model:**

```javascript
{
  userId: ObjectId,
  eventType: String,
  eventData: Object,
  metadata: {
    clientTimestamp: Date,
    serverTimestamp: Date,
    userAgent: String,
    ipAddress: String,
    eventId: String
  },
  status: String, // 'completed', 'failed', 'retrying'
  retryCount: Number,
  createdAt: Date,
  updatedAt: Date,
  batchId: String // Link to batch
}
```

**Sync Queue Model:**

```javascript
{
  userId: ObjectId,
  itemType: String, // 'event', 'progress', 'assessment'
  itemData: Object,
  status: String, // 'pending', 'syncing', 'synced', 'error'
  priority: Number,
  conflictResolution: Object,
  createdAt: Date,
  syncedAt: Date,
  errors: []
}
```

**Batch Log Model:**

```javascript
{
  batchId: ObjectId,
  userId: ObjectId,
  itemCount: Number,
  successCount: Number,
  failureCount: Number,
  conflictCount: Number,
  startTime: Date,
  endTime: Date,
  duration: Number,
  status: String
}
```

### Frontend Setup

#### 1. Installation

```bash
cd frontend
npm install
# or
bun install
```

#### 2. Configuration

Create `src/config/telemetry.ts`:

```typescript
export const TELEMETRY_CONFIG = {
  apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  syncInterval: 5 * 60 * 1000, // 5 minutes
  batchSize: 50,
  enableOfflineMode: true,
  storageKey: 'prepmate_telemetry',
  maxRetries: 3,
  retryDelay: 5000,
};
```

#### 3. Service Integration

**Telemetry Service:**

```typescript
import { TelemetryService } from '@/services/telemetry';

const telemetry = new TelemetryService();

// Track events
telemetry.captureEvent('interview_started', {
  interviewType: 'mock',
  duration: 30,
});

// Listen to sync events
telemetry.on('sync:complete', (result) => {
  console.log('Sync completed:', result);
});
```

**Sync Service:**

```typescript
import { SyncService } from '@/services/sync';

const sync = new SyncService();

// Start sync
await sync.start();

// Get sync status
const status = sync.getStatus();
console.log(`Synced: ${status.syncedCount}/${status.totalCount}`);
```

## API Endpoints

### Telemetry Endpoints

#### POST /api/telemetry/track
Single event tracking endpoint.

**Request:**
```json
{
  "eventType": "interview_completed",
  "eventData": {
    "interviewId": "12345",
    "score": 85,
    "duration": 1800,
    "questionsAttempted": 5,
    "correctAnswers": 4
  },
  "metadata": {
    "clientTimestamp": "2024-01-20T10:30:00Z",
    "userAgent": "Mozilla/5.0..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "eventId": "evt_abc123",
    "serverTimestamp": "2024-01-20T10:30:05Z"
  }
}
```

#### POST /api/telemetry/batch
Batch sync endpoint for multiple events.

**Request:**
```json
{
  "batchId": "batch_xyz789",
  "items": [
    {
      "itemType": "event",
      "itemData": {...}
    },
    ...
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "processed": 10,
    "failed": 1,
    "conflicts": 0,
    "results": [...]
  }
}
```

#### GET /api/telemetry/status
Get synchronization status.

**Response:**
```json
{
  "syncStatus": {
    "lastSyncTime": "2024-01-20T10:25:00Z",
    "pendingItems": 5,
    "totalItems": 100,
    "syncHealth": "good"
  }
}
```

### Health Endpoints

#### GET /api/health
Application health status.

**Response:**
```json
{
  "status": "healthy",
  "uptime": 3600,
  "services": {
    "database": "connected",
    "cache": "connected",
    "scheduler": "running"
  }
}
```

## Usage Examples

### Example 1: Track Interview Completion

**Client:**
```typescript
import { telemetry } from '@/services';

async function handleInterviewComplete(results) {
  telemetry.captureEvent('interview_completed', {
    interviewId: results.id,
    score: results.score,
    duration: results.duration,
    questionsAttempted: results.questions.length,
    correctAnswers: results.correct,
    weakAreas: results.weakAreas,
  });
}
```

**Server Processing:**
- Event received at `/api/telemetry/track`
- Validated and stored in MongoDB
- Triggered ML pipeline for:
  - Weakness detection
  - Adaptive planning updates
  - Performance trend analysis
- Returned confirmation to client

### Example 2: Scheduled Sync

**Server (runs every 5 minutes):**
```javascript
// Automatically executed by ScheduledSyncService
// 1. Collects all pending sync items
// 2. Processes batches (100 items max)
// 3. Handles conflicts
// 4. Updates database
// 5. Logs results
```

**Client:**
```typescript
// Automatically triggered
telemetry.on('sync:start', () => {
  updateUI('Syncing...');
});

telemetry.on('sync:complete', (result) => {
  updateUI(`Synced: ${result.successCount} items`);
});
```

### Example 3: Offline Support

**Client (automatic):**
```typescript
// When offline
telemetry.captureEvent('assessment_submitted', {
  // Data stored in IndexedDB
});

// When online (auto-sync)
// - Events automatically queued
// - Batch synced with next interval
// - Conflicts resolved gracefully
```

## Configuration

### Sync Interval Fine-tuning

**Development:**
```env
SYNC_INTERVAL_MINUTES=1
MAX_QUEUE_SIZE=500
ENABLE_SCHEDULED_SYNC=true
```

**Production:**
```env
SYNC_INTERVAL_MINUTES=5
MAX_QUEUE_SIZE=2000
ENABLE_SCHEDULED_SYNC=true
```

### Batch Processing

**Small Dataset:**
```env
SYNC_BATCH_SIZE=50
MAX_RETRIES=3
```

**Large Dataset:**
```env
SYNC_BATCH_SIZE=200
MAX_RETRIES=5
```

## Monitoring & Logging

### Key Metrics to Monitor

1. **Sync Health**
   - Success rate: (successful syncs / total syncs) × 100
   - Average sync duration
   - Failed items percentage

2. **Data Quality**
   - Event validation failures
   - Conflict resolution rate
   - Duplicate event rate

3. **System Performance**
   - Queue processing time
   - Database query latency
   - API response time

### Log Locations

- **Server Logs**: `backend/logs/` (configure in app.js)
- **Client Logs**: Browser console (development)
- **Batch Logs**: MongoDB `batchLogs` collection

### Example Monitoring Query

```javascript
// Get last hour of sync activity
db.batchLogs.find({
  startTime: { $gte: new Date(Date.now() - 3600000) }
}).sort({ startTime: -1 });
```

## Troubleshooting

### Issue: Items Not Syncing

**Diagnosis:**
```javascript
// Check sync queue
db.syncQueues.find({ status: 'pending' }).count();

// Check for errors
db.batchLogs.find({ status: 'error' }).sort({ startTime: -1 }).limit(1);
```

**Solutions:**
1. Verify `ENABLE_SCHEDULED_SYNC=true`
2. Check network connectivity
3. Review `SYNC_INTERVAL_MINUTES` setting
4. Check auth tokens

### Issue: Duplicate Events

**Prevention:**
- Ensure unique `eventId` generation on client
- Implement idempotency on server
- Check batch size configuration

**Recovery:**
```javascript
// Find duplicates
db.telemetry.aggregate([
  { $group: { _id: '$eventId', count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
]);
```

### Issue: Conflicts Not Resolving

**Check Conflict Log:**
```javascript
db.batchLogs.find({ conflictCount: { $gt: 0 } });
```

**Configure Conflict Resolution:**
```env
CONFLICT_RESOLUTION_STRATEGY=last-write-wins
# or
CONFLICT_RESOLUTION_STRATEGY=client-priority
```

## Performance Optimization

### Database Indexing

```javascript
// Recommended indexes
db.telemetry.createIndex({ userId: 1, createdAt: -1 });
db.telemetry.createIndex({ eventType: 1, createdAt: -1 });
db.syncQueues.createIndex({ userId: 1, status: 1 });
```

### Caching Strategy

```javascript
// Cache frequently accessed data
const CACHE_CONFIG = {
  userStats: 300, // 5 minutes
  weakness: 600,  // 10 minutes
  progress: 300   // 5 minutes
};
```

### Batch Optimization

- Increase batch size for high-volume scenarios
- Implement compression for large payloads
- Use pagination for historical data

## Security Considerations

1. **Data Validation**
   - All events validated on receipt
   - Sanitize user input
   - Limit payload size

2. **Authentication**
   - JWT token validation required
   - Rate limiting on telemetry endpoints
   - IP-based restrictions (optional)

3. **Data Privacy**
   - GDPR-compliant data retention
   - Encryption for sensitive fields
   - Audit trail for all data modifications

4. **Sync Security**
   - Cryptographic validation of batches
   - Secure timestamp verification
   - Conflict resolution auditing

## Deployment Checklist

- [ ] Environment variables configured
- [ ] MongoDB connection verified
- [ ] Redis cache (if used) running
- [ ] Telemetry endpoints tested
- [ ] Sync service initialized
- [ ] Database indexes created
- [ ] Monitoring alerts configured
- [ ] Backup procedures in place
- [ ] Client service initialized
- [ ] Event tracking verified
- [ ] Offline mode tested

## Support

For issues or questions:
1. Check troubleshooting section
2. Review server logs
3. Verify environment configuration
4. Contact development team

---

**Last Updated:** January 2024
**Version:** 1.0

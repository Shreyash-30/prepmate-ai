# Frontend Telemetry & Sync Implementation Guide

## Overview

This guide explains how to integrate telemetry and sync services into the PrepMate AI frontend application using Vue/React with TypeScript.

## Installation & Setup

### 1. Services Structure

Location: `src/services/`

```typescript
src/services/
├── telemetry.ts           # Main telemetry service
├── sync.ts                # Sync orchestration
├── storage.ts             # IndexedDB wrapper
├── eventQueue.ts          # Event buffering
└── api.ts                 # HTTP client
```

### 2. Initialize Services

**App.vue or main.tsx:**

```typescript
import { TelemetryService } from '@/services/telemetry';
import { SyncService } from '@/services/sync';

// Create instances
const telemetry = new TelemetryService({
  apiBaseUrl: import.meta.env.VITE_API_URL,
  syncInterval: 5 * 60 * 1000, // 5 minutes
});

const sync = new SyncService({
  telemetry,
  apiBaseUrl: import.meta.env.VITE_API_URL,
});

// Initialize on app startup
onMounted(() => {
  telemetry.initialize();
  sync.start();
});

// Cleanup on unmount
onBeforeUnmount(() => {
  sync.stop();
});
```

## Core Services

### TelemetryService

#### Initialization

```typescript
import { TelemetryService } from '@/services/telemetry';

const telemetry = new TelemetryService({
  apiBaseUrl: 'http://localhost:5000',
  syncInterval: 5 * 60 * 1000,
  batchSize: 50,
  enableOfflineMode: true,
});

// Initialize
await telemetry.initialize();
```

#### Capturing Events

```typescript
// Simple event
telemetry.captureEvent('interview_started', {
  interviewType: 'mock',
  difficulty: 'hard',
});

// Event with metadata
telemetry.captureEvent('interview_completed', {
  interviewId: '123',
  score: 85,
  duration: 1800,
  questionsAttempted: 5,
  correctAnswers: 4,
  weakAreas: ['arrays', 'graphs'],
}, {
  importance: 'high',
  retryOnFail: true,
});

// Batch capture (multiple events)
telemetry.captureEvents([
  { type: 'module_viewed', data: { moduleId: '1' } },
  { type: 'question_answered', data: { questionId: '2', correct: true } },
]);
```

#### Event Listeners

```typescript
// Listen for sync events
telemetry.on('sync:start', () => {
  console.log('Sync starting...');
  updateUI('Syncing...');
});

telemetry.on('sync:complete', (result) => {
  console.log('Sync completed:', result);
  console.log(`Synced: ${result.successCount}/${result.totalCount}`);
  showNotification(`Synced ${result.successCount} items`);
});

telemetry.on('sync:failed', (error) => {
  console.error('Sync failed:', error);
  showNotification('Sync failed', 'error');
});

telemetry.on('event:queued', (event) => {
  console.log('Event queued:', event.eventId);
});

telemetry.on('event:synced', (event) => {
  console.log('Event synced:', event.eventId);
});
```

#### Getting Status

```typescript
// Current telemetry status
const status = telemetry.getStatus();
console.log(`Pending events: ${status.pendingCount}`);
console.log(`Last sync: ${status.lastSyncTime}`);
console.log(`Online: ${status.isOnline}`);
```

### SyncService

#### Initialization

```typescript
import { SyncService } from '@/services/sync';

const sync = new SyncService({
  telemetry, // Pass telemetry service
  apiBaseUrl: 'http://localhost:5000',
  syncInterval: 5 * 60 * 1000,
});

// Start periodic sync
await sync.start();
```

#### Manual Sync Control

```typescript
// Start sync now (regardless of interval)
await sync.triggerSync();

// Stop automatic sync
sync.stop();

// Get sync status
const status = sync.getStatus();
console.log(`Synced: ${status.syncedCount}/${status.totalCount}`);
console.log(`Health: ${status.syncHealth}`); // 'good', 'degraded', 'critical'
```

#### Sync Events

```typescript
// Listen to sync lifecycle
sync.on('sync:start', () => {
  showSyncIndicator(true);
});

sync.on('sync:progress', (percent) => {
  updateProgressBar(percent);
});

sync.on('sync:conflict', (conflicts) => {
  handleConflicts(conflicts);
});

sync.on('sync:complete', (result) => {
  showSyncIndicator(false);
  showNotification(`Synced ${result.processedCount} items`);
});
```

## Implementation Patterns

### Pattern 1: Track User Interactions

```typescript
// Interview Component
export default function InterviewComponent() {
  const telemetry = useTelemetry();

  const startInterview = () => {
    telemetry.captureEvent('interview_started', {
      interviewType: 'mock',
      difficulty: 'medium',
      topicId: props.topicId,
    });
  };

  const submitAnswer = (answer) => {
    telemetry.captureEvent('answer_submitted', {
      questionId: currentQuestion.id,
      answer: answer,
      timeSpent: getTimeSpent(),
    });
  };

  const completeInterview = (results) => {
    telemetry.captureEvent('interview_completed', {
      interviewId: interview.id,
      score: results.score,
      duration: results.duration,
      questionsAttempted: results.questions.length,
      correctAnswers: results.correct,
      weakAreas: results.weakAreas,
    }, { importance: 'high' });
  };

  return (
    <>
      <button onClick={startInterview}>Start Interview</button>
      {/* ... interview UI ... */}
    </>
  );
}
```

### Pattern 2: Offline-First Sync

```typescript
export default function ProgressTracker() {
  const telemetry = useTelemetry();
  const sync = useSync();

  const trackProgress = (module, progress) => {
    // Captures event and queues automatically
    telemetry.captureEvent('progress_updated', {
      moduleId: module.id,
      progressPercent: progress,
      timestamp: Date.now(),
    });

    // If offline, event is stored and synced when online
    // If online, synced in next interval
  };

  return (
    <>
      <div>
        Online: {telemetry.getStatus().isOnline ? '✓' : '✗'}
      </div>
      <div>
        Pending: {telemetry.getStatus().pendingCount}
      </div>
      <button onClick={() => telemetry.captureEvent('button_clicked', {})}>
        Track Me
      </button>
    </>
  );
}
```

### Pattern 3: Composable Hook

```typescript
// src/hooks/useTelemetry.ts
import { TelemetryService } from '@/services/telemetry';

export function useTelemetry() {
  const telemetry = ref<TelemetryService | null>(null);

  onMounted(() => {
    telemetry.value = new TelemetryService();
    telemetry.value.initialize();
  });

  const captureEvent = (eventType: string, data: any) => {
    telemetry.value?.captureEvent(eventType, data);
  };

  return {
    captureEvent,
    getStatus: () => telemetry.value?.getStatus(),
    on: (event: string, handler: Function) => {
      telemetry.value?.on(event, handler);
    },
  };
}

// Usage in component
const { captureEvent, getStatus } = useTelemetry();
captureEvent('event_type', { /* data */ });
```

### Pattern 4: React Hook

```typescript
// src/hooks/useTelemetry.ts
import { useEffect, useRef } from 'react';
import { TelemetryService } from '@/services/telemetry';

export function useTelemetry() {
  const telemetryRef = useRef<TelemetryService | null>(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    telemetryRef.current = new TelemetryService();
    telemetryRef.current.initialize();

    // Listen to status changes
    telemetryRef.current.on('sync:complete', () => {
      setStatus(telemetryRef.current?.getStatus());
    });

    return () => {
      // Cleanup
    };
  }, []);

  const captureEvent = (eventType: string, data: any) => {
    telemetryRef.current?.captureEvent(eventType, data);
  };

  return {
    captureEvent,
    status,
    telemetry: telemetryRef.current,
  };
}
```

## Configuration

### Environment Variables

**.env** (development):
```
VITE_API_URL=http://localhost:5000
VITE_TELEMETRY_INTERVAL=60000
VITE_OFFLINE_MODE=true
```

**.env.production**:
```
VITE_API_URL=https://api.prepmate.ai
VITE_TELEMETRY_INTERVAL=300000
VITE_OFFLINE_MODE=true
```

### Config File

**src/config/telemetry.ts**:
```typescript
export const TELEMETRY_CONFIG = {
  apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  syncInterval: parseInt(import.meta.env.VITE_TELEMETRY_INTERVAL || '300000'),
  batchSize: 50,
  enableOfflineMode: import.meta.env.VITE_OFFLINE_MODE === 'true',
  storageKey: 'prepmate_telemetry',
  maxRetries: 3,
  retryDelay: 5000,
  events: {
    interview: {
      started: 'interview_started',
      completed: 'interview_completed',
      abandoned: 'interview_abandoned',
    },
    assessment: {
      submitted: 'assessment_submitted',
      completed: 'assessment_completed',
    },
    learning: {
      moduleViewed: 'learning_module_viewed',
      moduleCompleted: 'learning_module_completed',
    },
  },
};
```

## Event Schema

### Standard Event Format

```typescript
interface TelemetryEvent {
  eventType: string;
  eventData: {
    [key: string]: any;
  };
  metadata?: {
    importance?: 'low' | 'medium' | 'high';
    retryOnFail?: boolean;
    timeout?: number;
  };
}
```

### Example Events

**Interview Event:**
```typescript
{
  eventType: 'interview_completed',
  eventData: {
    interviewId: '123abc',
    score: 85,
    duration: 1800, // seconds
    questionsAttempted: 5,
    correctAnswers: 4,
    weakAreas: ['arrays', 'strings'],
    completedAt: new Date().toISOString(),
  },
  metadata: {
    importance: 'high',
    retryOnFail: true,
  }
}
```

**Assessment Event:**
```typescript
{
  eventType: 'assessment_submitted',
  eventData: {
    assessmentId: 'a456def',
    responses: [
      { questionId: 'q1', answer: 'A', correct: true },
      { questionId: 'q2', answer: 'B', correct: false },
    ],
    totalScore: 75,
    attemptNumber: 1,
  },
  metadata: {
    importance: 'high',
  }
}
```

## Error Handling

### Try-Catch Pattern

```typescript
async function initializeTelemetry() {
  try {
    const telemetry = new TelemetryService();
    await telemetry.initialize();
    console.log('✓ Telemetry initialized');
  } catch (error) {
    console.error('✗ Telemetry init failed:', error);
    // Fallback: Still works in offline mode
  }
}
```

### Event Error Handling

```typescript
telemetry.on('sync:failed', (error) => {
  if (error.code === 'NETWORK_ERROR') {
    showNotification('Network error - events queued locally');
  } else if (error.code === 'VALIDATION_ERROR') {
    showNotification('Invalid event format', 'error');
  } else if (error.code === 'AUTH_ERROR') {
    redirectToLogin();
  }
});
```

## Testing

### Unit Test Example

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { TelemetryService } from '@/services/telemetry';

describe('TelemetryService', () => {
  let telemetry: TelemetryService;

  beforeEach(() => {
    telemetry = new TelemetryService();
  });

  it('should capture events', () => {
    const eventId = telemetry.captureEvent('test_event', { data: 'test' });
    expect(eventId).toBeDefined();
  });

  it('should queue events when offline', async () => {
    telemetry.setOnline(false);
    telemetry.captureEvent('offline_event', {});
    
    const status = telemetry.getStatus();
    expect(status.pendingCount).toBeGreaterThan(0);
  });

  it('should sync when online', async () => {
    telemetry.setOnline(true);
    await telemetry.sync();
    
    const status = telemetry.getStatus();
    expect(status.pendingCount).toBe(0);
  });
});
```

## Debugging

### Dev Tools

```typescript
// Enable verbose logging
window.__TELEMETRY_DEBUG__ = true;

// View local queue
const db = await openIndexedDB();
const queue = await db.getAll('eventQueue');
console.table(queue);

// Manually trigger sync
telemetry.sync();

// Check API calls in Network tab
```

### Browser Storage

```typescript
// View IndexedDB
// Open DevTools → Application → Storage → IndexedDB → prepmate_telemetry

// View localStorage
localStorage.getItem('prepmate_telemetry_status');
```

## Performance Tips

1. **Batch Events**
```typescript
// ✓ Good: Batch related events
telemetry.captureEvents([
  { type: 'question_loaded', data: { id: '1' } },
  { type: 'question_answered', data: { id: '1', answer: 'A' } },
]);

// ✗ Avoid: Many individual captures
for (item of items) {
  telemetry.captureEvent('item_processed', item);
}
```

2. **Set Appropriate Intervals**
```typescript
// Development: Shorter interval for testing
const syncInterval = isDevelopment ? 1 * 60 * 1000 : 5 * 60 * 1000;

// Production: Longer interval to reduce server load
```

3. **Use Importance Flags**
```typescript
// High importance: Always sync
telemetry.captureEvent('critical_action', data, { importance: 'high' });

// Low importance: Batch with others
telemetry.captureEvent('minor_action', data, { importance: 'low' });
```

## Compliance

### GDPR Compliance

```typescript
// User data minimization
const compliantEvent = {
  // ✓ Include: Necessary data only
  eventType: 'quiz_completed',
  eventData: {
    score: 85, // Anonymous metric
    duration: 300,
  },
  // ✗ Avoid: PII, sensitive info
};
```

### Data Retention

```typescript
// Clear old events (implement retention policy)
const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
await telemetry.clearOldEvents(thirtyDaysAgo);
```

## Deployment Checklist

- [ ] Services configured in App.tsx/main.vue
- [ ] Environment variables set
- [ ] API endpoints verified
- [ ] Event types defined
- [ ] Error handling implemented
- [ ] Offline mode tested
- [ ] Sync working in both modes
- [ ] No PII in events
- [ ] Performance acceptable
- [ ] Storage usage within limits

## Support & Troubleshooting

### "Events not syncing"
1. Check network tab for POST requests to `/api/telemetry/batch`
2. Verify auth headers are present
3. Check browser console for errors
4. Ensure backend is running

### "Duplicate events"
1. Each event has unique ID
2. Check browser storage isn't corrupted
3. Clear IndexedDB if needed
4. Restart app

### "Storage full"
1. Clear old events: `telemetry.clearOldEvents()`
2. Reduce event verbosity
3. Implement data archival

---

**Last Updated:** January 2024
**Version:** 1.0

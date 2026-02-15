# Router Integration Guide for New Frontend Components

This file shows how to integrate all new pages into the existing React Router setup.
Copy and paste these routes into your router.tsx file.

## Current Status

- ✅ Dashboard routes: Existing (keep as-is)
- ✅ Practice routes: ADD below
- ✅ Revision routes: ADD below
- ✅ Mock Interview routes: ADD below
- ✅ Planner routes: ADD below
- ✅ Settings routes: ADD below

## Router Configuration Example

```typescript
import { lazy, Suspense } from 'react';
import MainLayout from '@/layouts/MainLayout';

// Lazy load new page components for code splitting
const PracticePageNew = lazy(() => import('@/modules/practice/pages/PracticePageNew'));
const RevisionPage = lazy(() => import('@/modules/revision/pages/RevisionPage'));
const MockInterviewPageNew = lazy(() => import('@/modules/mock-interview/pages/MockInterviewPageNew'));
const PlannerPage = lazy(() => import('@/modules/planning/pages/PlannerPage'));
const IntegrationsPage = lazy(() => import('@/modules/settings/pages/IntegrationsPage'));
const ProfilePage = lazy(() => import('@/modules/settings/pages/ProfilePage'));

// Fallback component for lazy loading
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
  </div>
);

// Main router configuration
export const mainRoutes = [
  {
    path: '',
    element: <MainLayout />,
    children: [
      {
        path: 'dashboard',
        element: <Dashboard />, // Keep existing dashboard
      },

      // Practice Module
      {
        path: 'practice',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PracticePageNew />
          </Suspense>
        ),
        children: [
          {
            path: 'recommended',
            element: (
              <Suspense fallback={<PageLoader />}>
                <PracticePageNew />
              </Suspense>
            ),
          },
          {
            path: 'by-subject',
            element: (
              <Suspense fallback={<PageLoader />}>
                <PracticePageNew />
              </Suspense>
            ),
          },
          {
            path: 'by-difficulty',
            element: (
              <Suspense fallback={<PageLoader />}>
                <PracticePageNew />
              </Suspense>
            ),
          },
        ],
      },

      // Revision Module
      {
        path: 'revision',
        element: (
          <Suspense fallback={<PageLoader />}>
            <RevisionPage />
          </Suspense>
        ),
      },

      // Mock Interview Module
      {
        path: 'mock-interview',
        element: (
          <Suspense fallback={<PageLoader />}>
            <MockInterviewPageNew />
          </Suspense>
        ),
        children: [
          {
            path: 'setup',
            element: (
              <Suspense fallback={<PageLoader />}>
                <MockInterviewPageNew />
              </Suspense>
            ),
          },
          {
            path: ':sessionId/workspace',
            element: (
              <Suspense fallback={<PageLoader />}>
                <MockInterviewPageNew />
              </Suspense>
            ),
          },
          {
            path: ':sessionId/report',
            element: (
              <Suspense fallback={<PageLoader />}>
                <MockInterviewPageNew />
              </Suspense>
            ),
          },
        ],
      },

      // Planner Module
      {
        path: 'planner',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PlannerPage />
          </Suspense>
        ),
      },

      // Settings Module
      {
        path: 'settings',
        children: [
          {
            path: 'profile',
            element: (
              <Suspense fallback={<PageLoader />}>
                <ProfilePage />
              </Suspense>
            ),
          },
          {
            path: 'integrations',
            element: (
              <Suspense fallback={<PageLoader />}>
                <IntegrationsPage />
              </Suspense>
            ),
          },
          {
            path: 'notifications',
            element: null, // TODO: Create NotificationsPage
          },
          {
            path: 'preferences',
            element: null, // TODO: Create PreferencesPage
          },
        ],
      },

      // Future Routes
      {
        path: 'mentor',
        element: null, // TODO: Implement with AI mentor chat
      },
      {
        path: 'analytics',
        element: null, // TODO: Implement analytics dashboard
      },
    ],
  },
];
```

## Sidebar Navigation Update

Update MainLayout.tsx Sidebar component with these navigation items.

### Main Sections (6 items)

1. Dashboard → `/dashboard`
2. Practice → `/practice` (with children: Recommended, By Subject, By Difficulty)
3. Revision → `/revision`
4. Mock Interview → `/mock-interview`
5. Planner → `/planner`
6. Integrations → `/settings/integrations` (moved to settings dropdown)

### Header Dropdown (from Header.tsx Avatar)

- Profile → `/settings/profile`
- Settings → (submenu)
  - Notifications → `/settings/notifications`
  - Preferences → `/settings/preferences`
  - Integrations → `/settings/integrations`
- Logout → `/login`

**Note:** The Sidebar.tsx is already implemented with all 6 sections.
Just ensure the paths match the router configuration above.

## Required Environment Variables

Add these to `.env.local`:

```bash
# Backend API
VITE_API_URL=http://localhost:5000/api
VITE_AI_SERVICE_URL=http://localhost:8000/api

# Feature Flags (optional)
VITE_ENABLE_VOICE_FEATURES=true
VITE_ENABLE_CODE_EDITOR=true
VITE_ENABLE_REAL_TIME_HINTS=true

# Analytics
VITE_SENTRY_DSN=           # Optional error tracking
VITE_POSTHOG_KEY=          # Optional analytics
```

## API Endpoint Mapping

Each page component expects these API endpoints from backend:

### Practice Module

```
GET /practice/subjects
GET /practice/subject/:subject/topics
POST /practice/start-session
GET /practice/:topicId/problems?difficulty=easy|medium|hard
GET /practice/:problemId/hints
POST /practice/submit
```

### Revision Module

```
GET /revision/tasks
GET /revision/tasks?filter=due|priority|phase
POST /revision/:taskId/start
POST /revision/:taskId/complete
POST /revision/:taskId/postpone
```

### Mock Interview Module

```
POST /interviews/create-session
GET /interviews/:sessionId
POST /interviews/:sessionId/submit-answer
POST /interviews/:sessionId/complete
GET /interviews/:sessionId/report
```

### Planner Module

```
GET /tasks
POST /tasks
PUT /tasks/:taskId
DELETE /tasks/:taskId
POST /tasks/:taskId/toggle
```

### Integrations Module

```
GET /integrations/status
POST /integrations/:platform/connect
POST /integrations/:platform/sync
DELETE /integrations/:platform/disconnect
GET /integrations/:platform/last-sync
```

### Profile Module

```
GET /user/profile
PUT /user/profile
PUT /user/profile/picture
GET /user/settings
PUT /user/settings
```

## Component Import Guide

New reusable components available for use:

```typescript
// Layout
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';

// Reusable Panels
import {
  IntelligencePanel,
  TopicMasteryHeatmap,
  WeakTopicAlerts,
  ReadinessScoreCard,
  SkeletonLoader,
} from '@/components/IntelligencePanels';

// Practice Components
import { ProblemCard } from '@/modules/practice/components/ProblemCard';
import { HintPanel } from '@/modules/practice/components/HintPanel';

// Services
import { apiClient } from '@/services/apiClient';
import { useThemeStore } from '@/store/themeStore';
```

## Dark Mode Integration

All components use this pattern for dark mode:

```typescript
import { useThemeStore } from '@/store/themeStore';

export default function MyComponent() {
  const { isDark } = useThemeStore();
  
  return (
    <div className={`
      p-4 rounded-lg
      ${isDark
        ? 'bg-slate-800 text-white border-slate-700'
        : 'bg-white text-slate-900 border-slate-200'
      }
    `}>
      Content
    </div>
  );
}
```

## Testing Integration

Run these tests to verify integration:

### 1. Dark Mode Toggle

- Visit any page
- Click sun/moon icon in header
- Verify all text is visible in both modes
- Check localStorage: `{ 'theme-store': 'light/dark' }`

### 2. Navigation

- Click each sidebar item
- Verify correct page loads
- Check breadcrumbs update
- Test browser back/forward

### 3. API Integration

- Open DevTools Network tab
- Perform an action (submit task, connect platform, etc)
- Verify correct endpoint called
- Check request includes auth token

### 4. Responsive Design

- Resize browser to 320px width (mobile)
- Verify sidebar collapses
- Check grid adapts to single column
- Test at 768px (tablet) and 1024px (desktop)

### 5. Error Handling

- Network tab: Throttle to offline
- Try submitting a form
- Verify error message appears
- Check 401 response triggers logout

### 6. Performance

- Check bundle size: `npm run build`
- Verify lazy loading works
- Test page load time < 2 seconds
- Monitor memory usage in DevTools

/**
 * Router Integration Guide for New Frontend Components
 * 
 * This file shows how to integrate all new pages into the existing React Router setup.
 * Copy and paste these routes into your router.tsx file.
 * 
 * Current Status:
 * - Dashboard routes: Existing (keep as-is)
 * - Practice routes: ADD below
 * - Revision routes: ADD below
 * - Mock Interview routes: ADD below
 * - Planner routes: ADD below
 * - Settings routes: ADD below
 */

import { lazy, Suspense } from 'react';
import MainLayout from '@/layouts/MainLayout';
import SkeletonLoader from '@/components/IntelligencePanels'; // Or create a LoadingSpinner component

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
  // EXISTING ROUTES (Keep these)
  {
    path: '',
    element: <MainLayout />,
    children: [
      {
        path: 'dashboard',
        element: <Dashboard />, // Keep existing dashboard
      },

      // NEW ROUTES - ADD THESE
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

      {
        path: 'revision',
        element: (
          <Suspense fallback={<PageLoader />}>
            <RevisionPage />
          </Suspense>
        ),
      },

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

      {
        path: 'planner',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PlannerPage />
          </Suspense>
        ),
      },

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
            path: 'notifications', // Future: NotificationsPage
            element: null, // TODO: Create NotificationsPage
          },
          {
            path: 'preferences', // Future: PreferencesPage
            element: null, // TODO: Create PreferencesPage
          },
        ],
      },

      // FUTURE ROUTES (Placeholder)
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

/**
 * SIDEBAR NAVIGATION UPDATE
 * 
 * Update MainLayout.tsx Sidebar component with these navigation items:
 * 
 * Main Sections (6 items):
 * 1. Dashboard → /dashboard
 * 2. Practice → /practice (with children: Recommended, By Subject, By Difficulty)
 * 3. Revision → /revision
 * 4. Mock Interview → /mock-interview
 * 5. Planner → /planner
 * 6. Integrations → /settings/integrations (moved to settings dropdown)
 * 
 * Header Dropdown (from Header.tsx Avatar):
 * - Profile → /settings/profile
 * - Settings → (submenu)
 *   - Notifications → /settings/notifications
 *   - Preferences → /settings/preferences
 *   - Integrations → /settings/integrations
 * - Logout → /login
 * 
 * UPDATE: The Sidebar.tsx is already implemented with all 6 sections.
 * Just ensure the paths match the router configuration above.
 */

/**
 * REQUIRED ENVIRONMENT VARIABLES
 * 
 * Add these to .env.local:
 */
const envRequirements = `
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
`;

/**
 * API ENDPOINT MAPPING
 * 
 * Each page component expects these API endpoints from backend:
 */
const apiEndpoints = {
  // Practice Module
  practice: {
    'GET /practice/subjects': 'List all subjects (DSA, OS, DBMS, etc)',
    'GET /practice/subject/:subject/topics': 'Get topics for a subject',
    'POST /practice/start-session': 'Create new practice session',
    'GET /practice/:topicId/problems?difficulty=easy|medium|hard': 'Get problems by difficulty',
    'GET /practice/:problemId/hints': 'Get hint levels (4 levels)',
    'POST /practice/submit': 'Submit solution for feedback',
  },

  // Revision Module
  revision: {
    'GET /revision/tasks': 'Get all revision tasks',
    'GET /revision/tasks?filter=due|priority|phase': 'Filter by due/priority/phase',
    'POST /revision/:taskId/start': 'Start revision session',
    'POST /revision/:taskId/complete': 'Mark revision complete',
    'POST /revision/:taskId/postpone': 'Postpone to later',
  },

  // Mock Interview Module
  interview: {
    'POST /interviews/create-session': 'Create interview session',
    'GET /interviews/:sessionId': 'Get session details',
    'POST /interviews/:sessionId/submit-answer': 'Submit answer to question',
    'POST /interviews/:sessionId/complete': 'End interview and calculate scores',
    'GET /interviews/:sessionId/report': 'Get interview report with scores',
  },

  // Planner Module
  planner: {
    'GET /tasks': 'Get all tasks',
    'POST /tasks': 'Create new task',
    'PUT /tasks/:taskId': 'Update task (status, details)',
    'DELETE /tasks/:taskId': 'Delete task',
    'POST /tasks/:taskId/toggle': 'Toggle task completion',
  },

  // Integrations Module
  integrations: {
    'GET /integrations/status': 'Get all platform connection status',
    'POST /integrations/:platform/connect': 'Connect platform account',
    'POST /integrations/:platform/sync': 'Sync problems from platform',
    'DELETE /integrations/:platform/disconnect': 'Disconnect platform',
    'GET /integrations/:platform/last-sync': 'Get last sync timestamp',
  },

  // Profile Module
  profile: {
    'GET /user/profile': 'Get user profile info',
    'PUT /user/profile': 'Update profile (name, bio, companies, etc)',
    'PUT /user/profile/picture': 'Upload avatar',
    'GET /user/settings': 'Get user preferences',
    'PUT /user/settings': 'Update preferences',
  },
};

/**
 * COMPONENT IMPORT GUIDE
 * 
 * New reusable components available for use:
 */
const componentImports = `
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
`;

/**
 * DARK MODE INTEGRATION
 * 
 * All components use this pattern for dark mode:
 */
const darkModePattern = `
import { useThemeStore } from '@/store/themeStore';

export default function MyComponent() {
  const { isDark } = useThemeStore();
  
  return (
    <div className={\`
      p-4 rounded-lg
      \${isDark
        ? 'bg-slate-800 text-white border-slate-700'
        : 'bg-white text-slate-900 border-slate-200'
      }
    \`}>
      Content
    </div>
  );
}
`;

/**
 * TESTING INTEGRATION
 * 
 * Run these tests to verify integration:
 */
const testingGuidance = `
# 1. Dark Mode Toggle
- Visit any page
- Click sun/moon icon in header
- Verify all text is visible in both modes
- Check localStorage: { 'prematec-theme': 'light/dark' }

# 2. Navigation
- Click each sidebar item
- Verify correct page loads
- Check breadcrumbs update
- Test browser back/forward

# 3. API Integration
- Open DevTools Network tab
- Perform an action (submit task, connect platform, etc)
- Verify correct endpoint called
- Check request includes auth token

# 4. Responsive Design
- Resize browser to 320px width (mobile)
- Verify sidebar collapses
- Check grid adapts to single column
- Test at 768px (tablet) and 1024px (desktop)

# 5. Error Handling
- Network tab: Throttle to offline
- Try submitting a form
- Verify error message appears
- Check 401 response triggers logout

# 6. Performance
- Check bundle size: npm run build
- Verify lazy loading works
- Test page load time < 2 seconds
- Monitor memory usage in DevTools
`;

export { apiEndpoints, componentImports, darkModePattern, testingGuidance };

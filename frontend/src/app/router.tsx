/**
 * Centralized Router Configuration
 * All routes defined here with lazy loading for code splitting
 */

import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import AuthLayout from '@/layouts/AuthLayout';
import MainLayout from '@/layouts/MainLayout';

// Auth Pages
const LoginPage = lazy(() => import('@/modules/auth/pages/LoginPage'));
const SignupPage = lazy(() => import('@/modules/auth/pages/SignupPage'));

// Dashboard Pages
const DashboardPage = lazy(() => import('@/modules/dashboard/pages/DashboardPage'));
const PracticePageNew = lazy(() => import('@/modules/practice/pages/PracticePageNew'));
const RevisionPage = lazy(() => import('@/modules/revision/pages/RevisionPage'));
const MockInterviewPageNew = lazy(() => import('@/modules/mock-interview/pages/MockInterviewPageNew'));
const AnalyticsPage = lazy(() => import('@/modules/analytics/pages/AnalyticsPage'));
const PlannerPage = lazy(() => import('@/modules/planning/pages/PlannerPage'));
const MentorPage = lazy(() => import('@/modules/mentor/pages/MentorPage'));
const SettingsPage = lazy(() => import('@/modules/settings/pages/SettingsPage'));
const ProfilePage = lazy(() => import('@/modules/settings/pages/ProfilePage'));
const IntegrationsPage = lazy(() => import('@/modules/settings/pages/IntegrationsPage'));
const NotFoundPage = lazy(() => import('@/modules/dashboard/pages/NotFoundPage'));

// Loading fallback
function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

// Protected Route Wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/**
 * Main Router Component
 */
export function Router() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Root redirect - sends to login if not authenticated */}
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />

        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        {/* Protected Routes */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/practice" element={<PracticePageNew />} />
          <Route path="/revision" element={<RevisionPage />} />
          <Route path="/mock-interview" element={<MockInterviewPageNew />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/mentor" element={<MentorPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/profile" element={<ProfilePage />} />
          <Route path="/settings/integrations" element={<IntegrationsPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

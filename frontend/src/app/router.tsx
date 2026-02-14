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
const RoadmapPage = lazy(() => import('@/modules/roadmap/pages/RoadmapPage'));
const PracticePage = lazy(() => import('@/modules/practice/pages/PracticePage'));
const MockInterviewPage = lazy(() => import('@/modules/mock-interview/pages/MockInterviewPage'));
const AnalyticsPage = lazy(() => import('@/modules/analytics/pages/AnalyticsPage'));
const PlanningPage = lazy(() => import('@/modules/planning/pages/PlanningPage'));
const MentorPage = lazy(() => import('@/modules/mentor/pages/MentorPage'));
const SettingsPage = lazy(() => import('@/modules/settings/pages/SettingsPage'));
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
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/mock-interview" element={<MockInterviewPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/planning" element={<PlanningPage />} />
          <Route path="/mentor" element={<MentorPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

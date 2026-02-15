/**
 * Dashboard Page - AI-Powered Interview Preparation Dashboard
 * Real-time metrics, progress tracking, and intelligent recommendations
 */

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import Header from '@/components/layout/Header';
import { IntelligencePanel, TopicMasteryHeatmap, ReadinessScoreCard, WeakTopicAlerts } from '@/components/dashboard/IntelligencePanels';
import { TrendingUp, Award, BookOpen, Zap, AlertCircle, Calendar, CheckCircle } from 'lucide-react';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { isDark } = useThemeStore();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    readinessScore: 72,
    masteryTopics: 8,
    practiceStreak: 5,
    weeklyHours: 12.5,
    topTopics: [
      { topic: 'Arrays', mastery: 0.85, problems: 45 },
      { topic: 'Strings', mastery: 0.72, problems: 32 },
      { topic: 'Trees', mastery: 0.65, problems: 28 },
      { topic: 'Graphs', mastery: 0.58, problems: 18 },
    ] as any[],
    recommendations: [
      { type: 'weak-topic', title: 'Focus on Dynamic Programming', description: 'Your mastery is 45%. Practice 5-10 medium difficulty problems.' },
      { type: 'streak', title: 'Keep your 5-day streak!', description: 'Solve one problem today to maintain your momentum.' },
      { type: 'revision', title: 'Review Arrays', description: 'Last practiced 7 days ago. Time for revision.' },
    ] as any[],
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    // Simulate loading dashboard data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <Header />

      <main className={`p-6 ml-60 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
        {/* Header Section */}
        <div className="mb-8">
          <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {greeting}, {user?.name?.split(' ')[0] || 'Student'} 👋
          </h1>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Your AI-powered interview preparation dashboard
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <IntelligencePanel
            title="Readiness Score"
            value={`${metrics.readinessScore}%`}
            subtitle="Interview Ready"
            trend="up"
            trendValue={8}
            loading={loading}
          />
          <IntelligencePanel
            title="Mastery Topics"
            value={metrics.masteryTopics}
            subtitle="Topics learned"
            trend="up"
            trendValue={2}
            loading={loading}
          />
          <IntelligencePanel
            title="Practice Streak"
            value={`${metrics.practiceStreak}d`}
            subtitle="Keep it going!"
            trend="up"
            trendValue={5}
            loading={loading}
          />
          <IntelligencePanel
            title="This Week"
            value={`${metrics.weeklyHours}h`}
            subtitle="Practice hours"
            trend="stable"
            trendValue={0}
            loading={loading}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Topic Mastery Heatmap - 2 cols */}
          <div className="lg:col-span-2">
            <TopicMasteryHeatmap data={metrics.topTopics} loading={loading} />
          </div>

          {/* Readiness Meter - 1 col */}
          <div className="lg:col-span-1">
            <ReadinessScoreCard
              overallScore={metrics.readinessScore}
              level="Good"
              companies={[
                { name: 'Google', score: 72 },
                { name: 'Amazon', score: 68 },
              ]}
              loading={loading}
            />
          </div>
        </div>

        {/* Recommendations Section */}
        <div className={`p-6 rounded-xl border mb-8 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Zap className="w-5 h-5 text-yellow-500" />
            AI Recommendations
          </h3>
          <div className="space-y-3">
            {metrics.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-l-4 ${
                  rec.type === 'weak-topic'
                    ? isDark ? 'bg-red-900/20 border-red-500' : 'bg-red-50 border-red-500'
                    : rec.type === 'streak'
                      ? isDark ? 'bg-green-900/20 border-green-500' : 'bg-green-50 border-green-500'
                      : isDark ? 'bg-blue-900/20 border-blue-500' : 'bg-blue-50 border-blue-500'
                }`}
              >
                <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {rec.title}
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {rec.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section - Weak Topics & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <WeakTopicAlerts
              alerts={[
                { topic: 'Dynamic Programming', riskLevel: 'high', message: 'Mastery: 45%. Practice 5-10 medium difficulty problems.' },
                { topic: 'System Design', riskLevel: 'medium', message: 'Mastery: 55%. Review concepts and architecture patterns.' },
                { topic: 'Graph Algorithms', riskLevel: 'low', message: 'Mastery: 65%. Good progress, keep practicing.' },
              ]}
              loading={loading}
            />
          </div>

          <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Calendar className="w-5 h-5 text-blue-500" />
              7-Day Activity
            </h3>
            <div className="space-y-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                const scores = [65, 68, 72, 70, 75, 78, 72];
                return (
                  <div key={day} className="flex items-center gap-3">
                    <span className={`text-xs font-medium w-8 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {day}
                    </span>
                    <div className={`flex-1 h-6 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                      <div
                        className="h-full rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                        style={{ width: `${scores[idx]}%` }}
                      ></div>
                    </div>
                    <span className={`text-xs font-medium w-8 text-right ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {scores[idx]}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );}
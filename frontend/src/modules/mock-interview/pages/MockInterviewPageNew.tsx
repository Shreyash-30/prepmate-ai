/**
 * Mock Interview Page - Interview setup, workspace, and results
 * Multi-dimensional scoring: coding, reasoning, communication, pressure, time management
 */

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { useThemeStore } from '@/store/themeStore';
import { apiClient } from '@/services/apiClient';
import { ChevronRight, Play, BarChart3, Zap, Volume2 } from 'lucide-react';

interface InterviewSession {
  id: string;
  interviewType: 'technical' | 'behavioral' | 'system-design';
  targetCompany: string;
  duration: number;
  questionIds: string[];
  overallScore?: number;
  codingScore?: number;
  communicationScore?: number;
  timeManagementScore?: number;
  startTime?: string;
  status: 'setup' | 'in-progress' | 'completed';
}

type ViewMode = 'setup' | 'workspace' | 'report';

export default function MockInterviewPageNew() {
  const { isDark } = useThemeStore();
  const [viewMode, setViewMode] = useState<ViewMode>('setup');
  const [interviewType, setInterviewType] = useState<'technical' | 'behavioral' | 'system-design'>('technical');
  const [targetCompany, setTargetCompany] = useState('');
  const [questionsCount, setQuestionsCount] = useState(2);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(false);

  const companies = [
    'Google', 'Amazon', 'Meta', 'Apple', 'Microsoft',
    'Tesla', 'Netflix', 'Uber', 'Airbnb', 'LinkedIn',
    'Adobe', 'Salesforce', 'Oracle', 'IBM', 'GoldmanSachs',
  ];

  const handleStartInterview = async () => {
    setLoading(true);
    try {
      // Mock session creation
      const newSession: InterviewSession = {
        id: `session-${Date.now()}`,
        interviewType,
        targetCompany: targetCompany || 'General',
        duration: questionsCount * 30, // 30 min per question
        questionIds: Array.from({ length: questionsCount }, (_, i) => `q-${i + 1}`),
        status: 'in-progress',
        startTime: new Date().toISOString(),
      };
      setSession(newSession);
      setViewMode('workspace');
    } catch (error) {
      console.error('Error starting interview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteInterview = () => {
    // Mock scores
    const newSession = session ? {
      ...session,
      status: 'completed' as const,
      overallScore: Math.round(Math.random() * 40 + 60),
      codingScore: Math.round(Math.random() * 40 + 60),
      communicationScore: Math.round(Math.random() * 40 + 60),
      timeManagementScore: Math.round(Math.random() * 40 + 60),
    } : null;
    
    if (newSession) {
      setSession(newSession);
      setViewMode('report');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return isDark ? 'bg-green-900/20' : 'bg-green-100';
    if (score >= 60) return isDark ? 'bg-blue-900/20' : 'bg-blue-100';
    if (score >= 40) return isDark ? 'bg-yellow-900/20' : 'bg-yellow-100';
    return isDark ? 'bg-red-900/20' : 'bg-red-100';
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <Header />

      <main className="p-6 ml-60">
        {/* Breadcrumb */}
        <div className={`flex items-center gap-2 mb-6 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          <span>Mock Interview</span>
          {session && <ChevronRight className="w-4 h-4" />}
          {session && <span>{session.interviewType}</span>}
        </div>

        {/* Setup Mode */}
        {viewMode === 'setup' && (
          <div>
            <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              🎤 Mock Interview Studio
            </h1>
            <p className={`mb-8 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Practice interviews with multi-dimensional scoring and AI feedback
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Interview Type Selection */}
              <div className={`lg:col-span-1 p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <h2 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Interview Type
                </h2>
                <div className="space-y-2">
                  {(['technical', 'behavioral', 'system-design'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setInterviewType(type)}
                      className={`w-full p-3 rounded-lg text-left transition ${
                        interviewType === type
                          ? isDark ? 'bg-blue-900/30 border-2 border-blue-500' : 'bg-blue-50 border-2 border-blue-500'
                          : isDark ? 'bg-slate-700 border border-slate-600' : 'bg-slate-50 border border-slate-200'
                      }`}
                    >
                      {type === 'technical' && '💻 Technical (DSA/DBMS/OS)'}
                      {type === 'behavioral' && '🗣️ Behavioral (STAR method)'}
                      {type === 'system-design' && '🏗️ System Design'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Configuration */}
              <div className={`lg:col-span-2 p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <h2 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Configuration
                </h2>

                {/* Target Company */}
                <div className="mb-6">
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Target Company (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type to search or select..."
                      value={targetCompany}
                      onChange={(e) => setTargetCompany(e.target.value)}
                      list="companies"
                      className={`w-full px-4 py-2 rounded-lg border transition ${
                        isDark
                          ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500'
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
                      }`}
                    />
                    <datalist id="companies">
                      {companies.map((company) => (
                        <option key={company} value={company} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Questions Count */}
                <div className="mb-6">
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Questions: <span className="font-bold">{questionsCount}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={questionsCount}
                    onChange={(e) => setQuestionsCount(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Estimated duration: {questionsCount * 30} minutes
                  </div>
                </div>

                {/* Features */}
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-slate-100'} mb-6`}>
                  <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    🎯 Features Enabled
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span>AI Code Review</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-blue-500" />
                      <span>Voice Analysis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-purple-500" />
                      <span>Multi-Dimensional Scoring</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-green-500" />
                      <span>Real-Time Hints</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleStartInterview}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg font-medium transition"
                >
                  {loading ? '⏳ Starting...' : '🚀 Start Interview'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Workspace Mode */}
        {viewMode === 'workspace' && session && (
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {session.interviewType.toUpperCase()} Interview - {session.targetCompany}
            </h1>

            <div className={`p-8 rounded-xl border text-center ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              <Play className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Interview Workspace
              </h2>
              <p className={`mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Full-featured interview editor with real-time scoring coming soon
              </p>

              <div className="space-y-3">
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                  <div className="text-sm font-mono text-left">
                    <div>Total Questions: {session.questionIds.length}</div>
                    <div>Duration: {session.duration} minutes</div>
                    <div>Features: Code editor, voice recording, real-time hints</div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleCompleteInterview}
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                  >
                    ✓ Complete Interview
                  </button>
                  <button
                    onClick={() => setViewMode('setup')}
                    className={`px-6 py-3 rounded-lg font-medium border transition ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                        : 'bg-slate-100 border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    ← Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report Mode */}
        {viewMode === 'report' && session && session.status === 'completed' && (
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              📊 Interview Report
            </h1>
            <p className={`mb-8 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {session.targetCompany} • {session.interviewType}
            </p>

            {/* Overall Score */}
            <div className={`mb-8 p-8 rounded-xl border text-center ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              <div className={`text-6xl font-bold mb-2 ${getScoreColor(session.overallScore || 0)}`}>
                {session.overallScore}%
              </div>
              <div className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Overall Score
              </div>
            </div>

            {/* Detailed Scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Coding', score: session.codingScore || 0, icon: '💻' },
                { label: 'Communication', score: session.communicationScore || 0, icon: '🗣️' },
                { label: 'Reasoning', score: 75, icon: '🧠' },
                { label: 'Time Management', score: session.timeManagementScore || 0, icon: '⏱️' },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className={`p-4 rounded-lg border ${
                    isDark
                      ? `${getScoreBgColor(metric.score).replace('bg-', 'bg-opacity-20 bg-')} border-slate-700`
                      : `${getScoreBgColor(metric.score)} border-slate-200`
                  }`}
                >
                  <div className="text-2xl mb-2">{metric.icon}</div>
                  <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {metric.label}
                  </div>
                  <div className={`text-2xl font-bold mt-1 ${getScoreColor(metric.score)}`}>
                    {metric.score}%
                  </div>
                </div>
              ))}
            </div>

            {/* Recommendations */}
            <div className={`p-6 rounded-xl border mb-8 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                💡 Recommendations
              </h2>
              <ul className="space-y-2">
                <li className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  ✓ Improve algorithm optimization skills (Medium problems needed)
                </li>
                <li className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  ✓ Practice explaining solutions clearly under time pressure
                </li>
                <li className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  ✓ Work on edge case identification
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => setViewMode('setup')}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
              >
                🔄 Start Another Interview
              </button>
              <button className={`flex-1 px-6 py-3 rounded-lg font-medium border transition ${
                isDark
                  ? 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                  : 'bg-slate-100 border-slate-300 hover:bg-slate-200'
              }`}>
                💾 Save Report
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

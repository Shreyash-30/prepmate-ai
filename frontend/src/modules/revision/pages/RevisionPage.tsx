/**
 * Revision Page - Spaced Repetition & Ebbinghaus Scheduling
 * Shows next scheduled revisions, priority queue, and revision progress
 */

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useThemeStore } from '@/store/themeStore';
import { apiClient } from '@/services/apiClient';
import { ChevronRight, Clock, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

interface RevisionTask {
  id: string;
  topicId: string;
  topicName: string;
  nextScheduledDate: string;
  revisionPriority: 1 | 2 | 3 | 4 | 5;
  phase: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  estimatedTimeMinutes: number;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  problemsToRevise: string[];
  reinforcementProblems: string[];
}

type FilterMode = 'due' | 'priority' | 'phase' | 'all';

export default function RevisionPage() {
  const { isDark } = useThemeStore();
  const [filterMode, setFilterMode] = useState<FilterMode>('due');
  const [revisionTasks, setRevisionTasks] = useState<RevisionTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<RevisionTask | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Mock data
    setRevisionTasks([
      {
        id: '1',
        topicId: 'dynamic-programming',
        topicName: 'Dynamic Programming',
        nextScheduledDate: 'Today',
        revisionPriority: 5,
        phase: 2,
        estimatedTimeMinutes: 45,
        status: 'pending',
        problemsToRevise: ['knapsack', 'coin-change', 'lcs'],
        reinforcementProblems: ['edit-distance', 'longest-increasing-subsequence'],
      },
      {
        id: '2',
        topicId: 'graphs',
        topicName: 'Graphs',
        nextScheduledDate: 'Tomorrow',
        revisionPriority: 4,
        phase: 1,
        estimatedTimeMinutes: 60,
        status: 'pending',
        problemsToRevise: ['bfs', 'dfs', 'dijkstra'],
        reinforcementProblems: ['floyd-warshall', 'bellman-ford'],
      },
      {
        id: '3',
        topicId: 'arrays',
        topicName: 'Arrays',
        nextScheduledDate: '3 days',
        revisionPriority: 2,
        phase: 3,
        estimatedTimeMinutes: 30,
        status: 'pending',
        problemsToRevise: ['sliding-window', 'two-pointer'],
        reinforcementProblems: ['prefix-sum', 'range-query'],
      },
    ]);
  }, []);

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return isDark ? 'bg-red-900/20 text-red-300' : 'bg-red-100 text-red-700';
    if (priority === 3) return isDark ? 'bg-orange-900/20 text-orange-300' : 'bg-orange-100 text-orange-700';
    return isDark ? 'bg-yellow-900/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700';
  };

  const getPhaseLabel = (phase: number) => {
    const phases = ['—', '1 day', '3 days', '1 week', '2 weeks', '1 month', '2 months', 'Maintenance'];
    return phases[phase] || 'Unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return isDark ? 'text-red-400' : 'text-red-600';
      case 'in-progress':
        return isDark ? 'text-yellow-400' : 'text-yellow-600';
      case 'completed':
        return isDark ? 'text-green-400' : 'text-green-600';
      default:
        return isDark ? 'text-slate-400' : 'text-slate-600';
    }
  };

  const sortedTasks = [...revisionTasks].sort((a, b) => {
    if (filterMode === 'priority') return b.revisionPriority - a.revisionPriority;
    if (filterMode === 'phase') return a.phase - b.phase;
    return 0;
  });

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <Header />

      <main className="p-6 ml-60">
        {/* Breadcrumb */}
        <div className={`flex items-center gap-2 mb-6 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          <span>Revision Planning</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            ⏰ Revision Schedule
          </h1>
          <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
            Ebbinghaus spaced repetition system optimized for long-term retention
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className={`p-4 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-red-500" />
              <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Due Today</span>
            </div>
            <div className={`text-2xl font-bold text-red-600`}>
              {revisionTasks.filter(t => t.nextScheduledDate === 'Today').length}
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>This Week</span>
            </div>
            <div className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              {revisionTasks.filter(t => ['Today', 'Tomorrow', '3 days'].includes(t.nextScheduledDate)).length}
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Completed</span>
            </div>
            <div className={`text-2xl font-bold text-green-600`}>
              {revisionTasks.filter(t => t.status === 'completed').length}
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Est. Total Time</span>
            </div>
            <div className={`text-2xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
              {revisionTasks.reduce((sum, t) => sum + t.estimatedTimeMinutes, 0)} min
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          {(['due', 'priority', 'phase', 'all'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterMode(filter)}
              className={`px-4 py-2 border-b-2 font-medium transition ${
                filterMode === filter
                  ? 'border-blue-600 text-blue-600'
                  : isDark
                  ? 'border-transparent text-slate-400 hover:text-slate-300'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {filter === 'due' && '📅 Due Soon'}
              {filter === 'priority' && '🔥 High Priority'}
              {filter === 'phase' && '📊 By Phase'}
              {filter === 'all' && '📋 All Tasks'}
            </button>
          ))}
        </div>

        {/* Tasks List */}
        <div className="space-y-3">
          {sortedTasks.length === 0 ? (
            <div className={`p-12 text-center rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-600 opacity-50" />
              <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                No revision tasks scheduled. Great work! 🎉
              </p>
            </div>
          ) : (
            sortedTasks.map((task) => (
              <button
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className={`w-full p-4 rounded-lg border transition-all text-left group ${
                  selectedTask?.id === task.id
                    ? isDark ? 'bg-blue-900/20 border-blue-500' : 'bg-blue-50 border-blue-500'
                    : isDark
                    ? 'bg-slate-800 border-slate-700 hover:border-blue-500'
                    : 'bg-white border-slate-200 hover:border-blue-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`font-semibold group-hover:text-blue-600 transition ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        {task.topicName}
                      </h3>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getPriorityColor(task.revisionPriority)}`}>
                        P{task.revisionPriority}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>
                        📅 {task.nextScheduledDate}
                      </span>
                      <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>
                        ⏱️ {task.estimatedTimeMinutes} min
                      </span>
                      <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Phase {task.phase}: {getPhaseLabel(task.phase)}
                      </span>
                      <span className={`text-xs font-semibold ${getStatusColor(task.status)}`}>
                        {task.status === 'overdue' && '⚠️ Overdue'}
                        {task.status === 'pending' && '◯ Pending'}
                        {task.status === 'in-progress' && '🔄 In Progress'}
                        {task.status === 'completed' && '✓ Done'}
                      </span>
                    </div>

                    {/* Progress bar from current phase */}
                    <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{ width: `${(task.phase / 7) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="ml-4 text-right">
                    <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {task.problemsToRevise.length} problems
                    </div>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Task Details Panel */}
        {selectedTask && (
          <div className={`mt-8 p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {selectedTask.topicName} - Revision Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div>
                <h3 className={`font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                  🎯 Problems to Revise
                </h3>
                <div className="space-y-2">
                  {selectedTask.problemsToRevise.map((problem, idx) => (
                    <div key={idx} className={`p-2 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                      <code className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        • {problem}
                      </code>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column */}
              <div>
                <h3 className={`font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                  💪 Reinforcement Problems
                </h3>
                <div className="space-y-2">
                  {selectedTask.reinforcementProblems.map((problem, idx) => (
                    <div key={idx} className={`p-2 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                      <code className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        • {problem}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mt-6">
              <button className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition">
                🚀 Start Revision
              </button>
              <button className={`px-6 py-3 rounded-lg font-medium border transition ${
                isDark
                  ? 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                  : 'bg-slate-100 border-slate-300 hover:bg-slate-200'
              }`}>
                ⏭️ Postpone
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

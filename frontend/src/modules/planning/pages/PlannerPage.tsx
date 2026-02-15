/**
 * Daily Planner Page - Task management, daily roadmap, progress tracking
 */

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { useThemeStore } from '@/store/themeStore';
import { apiClient } from '@/services/apiClient';
import { CheckCircle2, Circle, Clock, Zap, Plus, Trash2, Edit2 } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  category: 'practice' | 'revision' | 'interview' | 'learning';
  priority: 'high' | 'medium' | 'low';
  estimatedMinutes: number;
  dueDate: string;
  completed: boolean;
  focusTag?: string;
}

type FilterMode = 'today' | 'overdue' | 'upcoming' | 'all';

export default function PlannerPage() {
  const { isDark } = useThemeStore();
  const [filterMode, setFilterMode] = useState<FilterMode>('today');
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: '10 Medium Problems - Arrays',
      category: 'practice',
      priority: 'high',
      estimatedMinutes: 60,
      dueDate: 'Today',
      completed: false,
      focusTag: 'Arrays',
    },
    {
      id: '2',
      title: 'Revision - Dynamic Programming',
      category: 'revision',
      priority: 'high',
      estimatedMinutes: 45,
      dueDate: 'Today',
      completed: false,
      focusTag: 'DP',
    },
    {
      id: '3',
      title: 'Mock Interview - Amazon Technical',
      category: 'interview',
      priority: 'medium',
      estimatedMinutes: 90,
      dueDate: 'Tomorrow',
      completed: false,
      focusTag: 'Amazon',
    },
    {
      id: '4',
      title: 'Learn: System Design Basics',
      category: 'learning',
      priority: 'medium',
      estimatedMinutes: 40,
      dueDate: 'This Week',
      completed: false,
      focusTag: 'SD',
    },
  ]);
  const [showNewTask, setShowNewTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'practice':
        return isDark ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-100 text-blue-700';
      case 'revision':
        return isDark ? 'bg-purple-900/20 text-purple-300' : 'bg-purple-100 text-purple-700';
      case 'interview':
        return isDark ? 'bg-orange-900/20 text-orange-300' : 'bg-orange-100 text-orange-700';
      case 'learning':
        return isDark ? 'bg-green-900/20 text-green-300' : 'bg-green-100 text-green-700';
      default:
        return `bg-slate-200 text-slate-700`;
    }
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return isDark ? 'text-red-400' : 'text-red-600';
    if (priority === 'medium') return isDark ? 'text-yellow-400' : 'text-yellow-600';
    return isDark ? 'text-green-400' : 'text-green-600';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'practice':
        return '🎯';
      case 'revision':
        return '🔄';
      case 'interview':
        return '🎤';
      case 'learning':
        return '📚';
      default:
        return '📋';
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterMode === 'today') return t.dueDate === 'Today' && !t.completed;
    if (filterMode === 'overdue') return ['Today'].includes(t.dueDate) && !t.completed;
    if (filterMode === 'upcoming') return !t.completed;
    return true;
  });

  const completedCount = tasks.filter(t => t.completed).length;
  const totalMinutes = filteredTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <Header />

      <main className="p-6 ml-60">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              📅 Daily Planner
            </h1>
            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
              {completedCount}/{tasks.length} tasks completed • {totalMinutes} min estimated
            </p>
          </div>
          <button
            onClick={() => setShowNewTask(!showNewTask)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            <Plus className="w-5 h-5" />
            New Task
          </button>
        </div>

        {/* Daily Progress */}
        <div className={`mb-8 p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Today's Progress
            </h2>
            <span className={`text-sm px-3 py-1 rounded-full ${
              isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
            }`}>
              {completedCount}/{tasks.filter(t => t.dueDate === 'Today').length} completed
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 rounded-full bg-slate-700 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
              style={{ width: `${tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0}%` }}
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
              <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Remaining Today</div>
              <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {tasks.filter(t => t.dueDate === 'Today' && !t.completed).length} tasks
              </div>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
              <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Estimated Time</div>
              <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {tasks.filter(t => t.dueDate === 'Today' && !t.completed).reduce((sum, t) => sum + t.estimatedMinutes, 0)} min
              </div>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
              <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Focus Areas</div>
              <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {new Set(tasks.filter(t => t.dueDate === 'Today').map(t => t.focusTag)).size} topics
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          {(['today', 'overdue', 'upcoming', 'all'] as const).map((filter) => (
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
              {filter === 'today' && '📅 Today'}
              {filter === 'overdue' && '⚠️ Overdue'}
              {filter === 'upcoming' && '📋 Upcoming'}
              {filter === 'all' && '🎯 All'}
            </button>
          ))}
        </div>

        {/* Tasks List */}
        <div className="space-y-2">
          {filteredTasks.length === 0 ? (
            <div className={`p-12 text-center rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-600 opacity-50" />
              <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                No tasks! Great job! 🎉
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
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
                <div className="flex items-center gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTask(task.id);
                    }}
                    className="flex-shrink-0 mt-1"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <Circle className="w-6 h-6 text-slate-400" />
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold group-hover:text-blue-600 transition ${
                      task.completed ? 'line-through opacity-60' : ''
                    } ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${getCategoryColor(task.category)}`}>
                        {getCategoryIcon(task.category)} {task.category}
                      </span>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="w-3.5 h-3.5" />
                        <span className={`opacity-75 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {task.estimatedMinutes}m
                        </span>
                      </div>
                      {task.priority === 'high' && (
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'
                        }`}>
                          🔥 High
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className={`p-2 rounded hover:bg-slate-700`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTask(task.id);
                      }}
                      className={`p-2 rounded hover:bg-red-900 text-red-400`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* New Task Form */}
        {showNewTask && (
          <div className={`mt-6 p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Create New Task
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Task title..."
                className={`w-full px-4 py-2 rounded-lg border transition ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
                }`}
              />
              <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                + Add Task
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * Today's Tasks Panel Component
 * Shows recommended problems, revision tasks, roadmap suggestions
 * Displays tasks organized by priority and type
 */

import React from 'react';
import { Clock, Zap, AlertCircle, BookOpen, Lightbulb, Target } from 'lucide-react';

export interface Task {
  id: string;
  title: string;
  type: 'practice' | 'revision' | 'roadmap' | 'mock';
  topicName: string;
  priority: 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedMinutes: number;
  completed: boolean;
}

export interface TodayTasksPanelProps {
  tasks: Task[];
  isLoading?: boolean;
  onTaskStartClick?: (task: Task) => void;
  onTaskCompleteChange?: (taskId: string, completed: boolean) => void;
}

const typeIcons: { [key in Task['type']]: any } = {
  practice: Zap,
  revision: BookOpen,
  roadmap: Target,
  mock: Lightbulb,
};

const typeLabels: { [key in Task['type']]: string } = {
  practice: 'Practice',
  revision: 'Revision',
  roadmap: 'Roadmap',
  mock: 'Mock',
};

const difficultyColors: { [key in Task['difficulty']]: string } = {
  easy: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
  medium: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700',
  hard: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700',
};

const priorityColors: { [key in Task['priority']]: { badge: string; indicator: string } } = {
  low: {
    badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    indicator: 'bg-slate-500 dark:bg-slate-400',
  },
  medium: {
    badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    indicator: 'bg-blue-500 dark:bg-blue-400',
  },
  high: {
    badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    indicator: 'bg-red-500 dark:bg-red-400',
  },
};

export const TodayTasksPanel: React.FC<TodayTasksPanelProps> = ({
  tasks,
  isLoading = false,
  onTaskStartClick,
  onTaskCompleteChange,
}) => {
  const completedCount = tasks.filter(t => t.completed).length;
  const totalMinutes = tasks.reduce((sum, task) => sum + (task.completed ? 0 : task.estimatedMinutes), 0);

  const groupedTasks = {
    high: tasks.filter(t => t.priority === 'high'),
    medium: tasks.filter(t => t.priority === 'medium'),
    low: tasks.filter(t => t.priority === 'low'),
  };

  const TaskItem = ({ task, priority }: { task: Task; priority: Task['priority'] }) => {
    const TypeIcon = typeIcons[task.type];

    return (
      <div
        className={`flex items-start gap-4 p-4 rounded-lg border transition-all duration-200 group ${
          task.completed
            ? 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700'
            : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        {/* Priority Indicator */}
        <div className="pt-1">
          <div
            className={`w-1 h-6 rounded-full transition-all ${priorityColors[priority].indicator}`}
            style={{ opacity: task.completed ? 0.4 : 1 }}
          />
        </div>

        {/* Checkbox */}
        <input
          type="checkbox"
          checked={task.completed}
          onChange={e => onTaskCompleteChange?.(task.id, e.target.checked)}
          className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary cursor-pointer mt-0.5 flex-shrink-0"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-2">
            <TypeIcon className="h-4 w-4 text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium transition-all ${
                  task.completed
                    ? 'line-through text-slate-500 dark:text-slate-400'
                    : 'text-foreground'
                }`}
              >
                {task.title}
              </p>
            </div>
          </div>

          {/* Topic and Meta */}
          <div className="flex flex-wrap items-center gap-2 ml-7">
            <span className="text-xs text-slate-600 dark:text-slate-400">{task.topicName}</span>
            <span className={`text-xs px-2 py-0.5 rounded border ${difficultyColors[task.difficulty]}`}>
              {task.difficulty.charAt(0).toUpperCase() + task.difficulty.slice(1)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {task.estimatedMinutes}min
            </span>
          </div>
        </div>

        {/* Action Button */}
        {!task.completed && (
          <button
            onClick={() => onTaskStartClick?.(task)}
            className="ml-4 px-3 py-1.5 text-xs font-medium bg-primary hover:bg-primary-600 text-white rounded-lg transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
          >
            Start
          </button>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20 dark:to-transparent">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-40 animate-pulse" />
        </div>
        <div className="p-6 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4 bg-gradient-to-r from-green-50/50 to-transparent dark:from-green-950/20 dark:to-transparent">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
            Today's Tasks
          </h3>
        </div>
        <div className="p-12 text-center">
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">🎉 All Caught Up!</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            You've completed all your tasks for today
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20 dark:to-transparent flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Today's Tasks
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {completedCount} of {tasks.length} completed · {totalMinutes}m remaining
          </p>
        </div>
      </div>

      <div className="p-6">
        {/* Progress Bar */}
        <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-end justify-between mb-2">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Progress</span>
            <span className="text-sm font-bold text-primary">{Math.round((completedCount / tasks.length) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-primary to-blue-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / tasks.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Priority Sections */}
        <div className="space-y-6">
          {/* High Priority */}
          {groupedTasks.high.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  High Priority ({groupedTasks.high.length})
                </p>
              </div>
              <div className="space-y-2">
                {groupedTasks.high.map(task => (
                  <TaskItem key={task.id} task={task} priority="high" />
                ))}
              </div>
            </div>
          )}

          {/* Medium Priority */}
          {groupedTasks.medium.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Medium Priority ({groupedTasks.medium.length})
                </p>
              </div>
              <div className="space-y-2">
                {groupedTasks.medium.map(task => (
                  <TaskItem key={task.id} task={task} priority="medium" />
                ))}
              </div>
            </div>
          )}

          {/* Low Priority */}
          {groupedTasks.low.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Low Priority ({groupedTasks.low.length})
                </p>
              </div>
              <div className="space-y-2">
                {groupedTasks.low.map(task => (
                  <TaskItem key={task.id} task={task} priority="low" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

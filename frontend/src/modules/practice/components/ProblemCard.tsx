/**
 * Problem Card Component - Reusable problem display for practice/revision
 */

interface ProblemCardProps {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  acceptance: number;
  mastery?: number;
  status?: 'not-attempted' | 'attempted' | 'solved' | 'revision-due';
  onClick: () => void;
}

import { useThemeStore } from '@/store/themeStore';
import { CheckCircle, Circle, RefreshCw, AlertCircle } from 'lucide-react';

export function ProblemCard({
  id,
  title,
  difficulty,
  topic,
  acceptance,
  mastery,
  status = 'not-attempted',
  onClick,
}: ProblemCardProps) {
  const { isDark } = useThemeStore();

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy':
        return isDark ? 'text-green-400 bg-green-900/20' : 'text-green-700 bg-green-100';
      case 'medium':
        return isDark ? 'text-yellow-400 bg-yellow-900/20' : 'text-yellow-700 bg-yellow-100';
      case 'hard':
        return isDark ? 'text-red-400 bg-red-900/20' : 'text-red-700 bg-red-100';
      default:
        return '';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'solved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'attempted':
        return <Circle className="w-5 h-5 text-yellow-500" />;
      case 'revision-due':
        return <RefreshCw className="w-5 h-5 text-orange-500" />;
      case 'not-attempted':
        return <Circle className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-lg border transition-all text-left group ${
        isDark
          ? 'bg-slate-800 border-slate-700 hover:border-blue-500'
          : 'bg-white border-slate-200 hover:border-blue-500'
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        {getStatusIcon()}
        <h3 className={`font-semibold flex-1 group-hover:text-blue-600 transition ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}>
          {title}
        </h3>
        <span className={`text-xs font-semibold px-2 py-1 rounded ${getDifficultyColor(difficulty)}`}>
          {difficulty}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs mt-2">
        <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>
          Topic: {topic}
        </span>
        <div className="flex items-center gap-3">
          <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>
            {acceptance}% acceptance
          </span>
          {mastery !== undefined && (
            <span className={`font-medium ${
              mastery >= 0.8 ? 'text-green-500' : mastery >= 0.5 ? 'text-blue-500' : 'text-red-500'
            }`}>
              {Math.round(mastery * 100)}% mastery
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

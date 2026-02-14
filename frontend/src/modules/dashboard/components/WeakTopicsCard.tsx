/**
 * Weak Topics Card Component
 * Displays topics with risk indicators and quick practice buttons
 * Shows risk levels with color coding (red/yellow/green)
 */

import React from 'react';
import { TrendingDown, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface WeakTopic {
  topicName: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  mistakeRate: string;
  signalTypes: string[];
}

export interface WeakTopicsCardProps {
  topics: WeakTopic[];
  isLoading?: boolean;
  onPracticeClick?: (topicName: string) => void;
}

const riskColors: { [key in WeakTopic['riskLevel']]: { bg: string; border: string; text: string; indicator: string } } = {
  low: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-200 dark:border-emerald-700',
    text: 'text-emerald-700 dark:text-emerald-300',
    indicator: 'bg-emerald-500 dark:bg-emerald-400',
  },
  medium: {
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-700',
    text: 'text-amber-700 dark:text-amber-300',
    indicator: 'bg-amber-500 dark:bg-amber-400',
  },
  high: {
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    border: 'border-orange-200 dark:border-orange-700',
    text: 'text-orange-700 dark:text-orange-300',
    indicator: 'bg-orange-500 dark:bg-orange-400',
  },
  critical: {
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-200 dark:border-red-700',
    text: 'text-red-700 dark:text-red-300',
    indicator: 'bg-red-500 dark:bg-red-400',
  },
};

const riskLevelLabels: { [key in WeakTopic['riskLevel']]: { label: string; icon: any } } = {
  low: { label: 'Low Risk', icon: CheckCircle2 },
  medium: { label: 'Medium Risk', icon: AlertCircle },
  high: { label: 'High Risk', icon: AlertTriangle },
  critical: { label: 'Critical', icon: AlertTriangle },
};

export const WeakTopicsCard: React.FC<WeakTopicsCardProps> = ({
  topics,
  isLoading = false,
  onPracticeClick,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4 bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-950/20 dark:to-transparent">
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

  if (topics.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4 bg-gradient-to-r from-emerald-50/50 to-transparent dark:from-emerald-950/20 dark:to-transparent">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Weak Topics
          </h3>
        </div>
        <div className="p-12 text-center">
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">✨ No Weak Topics!</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            You're mastering all topics. Keep up the great work!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4 bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-950/20 dark:to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              Weak Topics & Risk Signals
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Topics requiring immediate attention
            </p>
          </div>
          <div className="text-4xl font-bold text-slate-300 dark:text-slate-700 opacity-30">⚠️</div>
        </div>
      </div>

      <div className="p-6 space-y-3">
        {topics.map((topic, index) => {
          const colors = riskColors[topic.riskLevel];
          const levelInfo = riskLevelLabels[topic.riskLevel];
          const LevelIcon = levelInfo.icon;

          return (
            <div
              key={index}
              className={`relative overflow-hidden rounded-lg border p-4 transition-all hover:shadow-md ${colors.bg} ${colors.border}`}
            >
              {/* Risk Level Indicator Bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${colors.indicator}`} />

              <div className="pl-3">
                {/* Topic Name and Risk Level */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground text-sm mb-1">{topic.topicName}</h4>
                    <div className="flex items-center gap-2">
                      <LevelIcon className="h-3.5 w-3.5" style={{ color: 'inherit' }} />
                      <span className={`text-xs font-medium uppercase tracking-wide ${colors.text}`}>
                        {levelInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Risk Score Circle */}
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors.indicator}20` }}>
                    <div className="text-center">
                      <p className={`font-bold text-sm ${colors.text}`}>{topic.riskScore}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Risk</p>
                    </div>
                  </div>
                </div>

                {/* Mistake Rate */}
                <div className="mb-3">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1.5">Error Rate</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all`}
                        style={{
                          width: `${parseFloat(topic.mistakeRate)}%`,
                          backgroundColor: topic.riskLevel === 'critical' ? '#ef4444' : topic.riskLevel === 'high' ? '#f97316' : topic.riskLevel === 'medium' ? '#eab308' : '#10b981',
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {topic.mistakeRate}%
                    </span>
                  </div>
                </div>

                {/* Signal Types */}
                {topic.signalTypes && topic.signalTypes.length > 0 && (
                  <div className="mb-3 pb-3 border-b border-current border-opacity-20">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Issues Detected:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {topic.signalTypes.map((signal, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 rounded bg-white dark:bg-slate-800 border border-current border-opacity-30"
                          style={{ color: 'inherit' }}
                        >
                          {signal.replace(/-/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Action Button */}
                <button
                  onClick={() => onPracticeClick?.(topic.topicName)}
                  className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-all border ${colors.border} hover:shadow-md`}
                  style={{
                    backgroundColor: `${colors.indicator}20`,
                    color: colors.text,
                  }}
                >
                  Practice Now
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

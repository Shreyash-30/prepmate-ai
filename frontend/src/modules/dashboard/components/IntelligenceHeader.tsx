/**
 * Intelligence Header Component
 * Displays readiness score, completion index, consistency, and improvement metrics
 * Core metrics of the preparation dashboard
 */

import React, { useMemo } from 'react';
import { TrendingUp, Zap, Target, CheckCircle2 } from 'lucide-react';

export interface IntelligenceHeaderProps {
  readinessScore: number;
  readinessLevel: string;
  completenessIndex: number;
  consistencyScore: number;
  improvementVelocity: number;
  velocityTrend: 'improving' | 'declining' | 'stable';
  isLoading?: boolean;
}

export const IntelligenceHeader: React.FC<IntelligenceHeaderProps> = ({
  readinessScore,
  readinessLevel,
  completenessIndex,
  consistencyScore,
  improvementVelocity,
  velocityTrend,
  isLoading = false,
}) => {
  // Determine readiness level color
  const getReadinessColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-emerald-50 dark:bg-emerald-950', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-700' };
    if (score >= 60) return { bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-700' };
    if (score >= 40) return { bg: 'bg-amber-50 dark:bg-amber-950', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-700' };
    return { bg: 'bg-red-50 dark:bg-red-950', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-700' };
  };

  const readinessColor = getReadinessColor(readinessScore);

  // Calculate progress percentages for visual indicators
  const getProgressColor = (value: number) => {
    if (value >= 75) return 'from-emerald-500 to-teal-400';
    if (value >= 50) return 'from-blue-500 to-cyan-400';
    if (value >= 25) return 'from-amber-500 to-orange-400';
    return 'from-red-500 to-pink-400';
  };

  const MetricIndicator = ({
    label,
    value,
    unit,
    icon: Icon,
    gradient,
    trend,
  }: {
    label: string;
    value: number;
    unit: string;
    icon: any;
    gradient: string;
    trend?: number;
  }) => (
    <div className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:shadow-md transition-shadow">
      <div className={`flex-shrink-0 p-2.5 rounded-lg bg-gradient-to-br ${gradient}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</p>
        <div className="flex items-baseline gap-1 mt-1">
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <span className="text-xs text-slate-500 dark:text-slate-400">{unit}</span>
        </div>
      </div>
      {trend !== undefined && (
        <div className={`text-xs font-medium px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : trend < 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-gradient-to-r from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-600 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Readiness Hero Card */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-8 ${readinessColor.bg} ${readinessColor.border}`}
      >
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-slate-900/30 dark:to-transparent" />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-8">
            <div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                Interview Readiness Score
              </p>
              <h2 className={`text-4xl font-bold ${readinessColor.text}`}>{readinessScore}%</h2>
              <p className="text-sm mt-3 text-slate-700 dark:text-slate-300 capitalize font-medium">
                Status: {readinessLevel.replace('-', ' ')}
              </p>
            </div>
            <div className="flex items-center justify-center w-32 h-32">
              <svg className="w-full h-full" viewBox="0 0 120 120">
                {/* Background circle */}
                <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-300 dark:text-slate-600" opacity="0.3" />
                {/* Progress circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className={readinessColor.text}
                  strokeDasharray={`${(readinessScore / 100) * 2 * Math.PI * 54} ${2 * Math.PI * 54}`}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                  style={{ transition: 'stroke-dasharray 0.5s ease' }}
                />
                {/* Center text */}
                <text x="60" y="55" textAnchor="middle" className="text-xs font-bold fill-current" fontSize="18">
                  {readinessScore}%
                </text>
              </svg>
            </div>
          </div>

          {/* Progress indicators grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-current border-opacity-20">
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1" >Completion</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full" style={{ width: `${completenessIndex}%` }} />
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{completenessIndex}%</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Consistency</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-400 h-2 rounded-full" style={{ width: `${consistencyScore}%` }} />
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{consistencyScore}%</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Improvement</p>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${improvementVelocity > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {improvementVelocity > 0 ? '+' : ''}{improvementVelocity}%
                </span>
                <span className={`text-xs ${velocityTrend === 'improving' ? 'text-emerald-600 dark:text-emerald-400' : velocityTrend === 'declining' ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {velocityTrend}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Trend</p>
              <p className={`text-sm font-bold capitalize ${velocityTrend === 'improving' ? 'text-emerald-600 dark:text-emerald-400' : velocityTrend === 'declining' ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>
                {velocityTrend}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricIndicator
          label="Completion Index"
          value={completenessIndex}
          unit="%"
          icon={Target}
          gradient="from-blue-500 to-cyan-500"
        />
        <MetricIndicator
          label="Consistency Score"
          value={consistencyScore}
          unit="%"
          icon={CheckCircle2}
          gradient="from-purple-500 to-pink-500"
        />
        <MetricIndicator
          label="Improvement Rate"
          value={Math.abs(improvementVelocity)}
          unit="%"
          icon={TrendingUp}
          gradient={improvementVelocity > 0 ? 'from-emerald-500 to-teal-500' : 'from-red-500 to-orange-500'}
          trend={improvementVelocity}
        />
        <MetricIndicator
          label="Velocity"
          value={improvementVelocity > 0 ? improvementVelocity : 0}
          unit="/wk"
          icon={Zap}
          gradient="from-amber-500 to-orange-500"
          trend={improvementVelocity}
        />
      </div>
    </div>
  );
};

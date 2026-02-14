/**
 * Platform Sync Overview Card Component
 * Shows connected platforms, sync status, and difficulty distribution
 */

import React from 'react';
import { Cloud, Zap, RotateCw, CheckCircle2 } from 'lucide-react';

interface PlatformInfo {
  name: string;
  connected: boolean;
  username?: string;
  problemsSynced: number;
  lastSync?: string;
}

export interface PlatformSyncCardProps {
  platforms: PlatformInfo[];
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  isLoading?: boolean;
  onRefresh?: () => void;
}

const platformIcons: { [key: string]: string } = {
  leetcode: '🟡',
  codeforces: '📘',
  hackerrank: '🔴',
  geeksforgeeks: '📊',
};

export const PlatformSyncCard: React.FC<PlatformSyncCardProps> = ({
  platforms,
  difficultyDistribution,
  isLoading = false,
  onRefresh,
}) => {
  const formatLastSync = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const totalProblems = difficultyDistribution.easy + difficultyDistribution.medium + difficultyDistribution.hard;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-6 overflow-hidden">
        <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded mb-4 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20 dark:to-transparent">
        <div className="flex items-center gap-3">
          <Cloud className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-foreground">Platform Integration</h3>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors group"
          title="Refresh sync data"
        >
          <RotateCw className="h-4 w-4 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 group-hover:animate-spin" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Platform List */}
        <div className="space-y-3">
          {platforms.map(platform => (
            <div key={platform.name} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-lg">{platformIcons[platform.name.toLowerCase()] || '🔗'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground capitalize">{platform.name}</p>
                  {platform.username && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">@{platform.username}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4">
                {platform.connected ? (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" />
                    <span className="text-xs font-medium">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    <span className="text-xs font-medium">Disconnected</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Synced Problems Summary */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <p className="text-sm font-medium text-foreground">Problems by Difficulty</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-700">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Easy</p>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{difficultyDistribution.easy}</p>
                <span className="text-xs text-emerald-600 dark:text-emerald-300">/{totalProblems}</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Medium</p>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{difficultyDistribution.medium}</p>
                <span className="text-xs text-amber-600 dark:text-amber-300">/{totalProblems}</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-700">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Hard</p>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">{difficultyDistribution.hard}</p>
                <span className="text-xs text-red-600 dark:text-red-300">/{totalProblems}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Problems */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{totalProblems}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Total Problems Synced</p>
          </div>
        </div>
      </div>
    </div>
  );
};

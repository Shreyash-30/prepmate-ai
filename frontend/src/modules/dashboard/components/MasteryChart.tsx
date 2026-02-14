/**
 * Mastery Chart Component
 * Shows mastery progression by topic with horizontal bar chart
 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Zap } from 'lucide-react';

export interface MasteryTopic {
  topic: string;
  mastery: number;
  problemsSolved: number;
  lastUpdated?: string;
}

export interface MasteryChartProps {
  data: MasteryTopic[];
  isLoading?: boolean;
}

export const MasteryChart: React.FC<MasteryChartProps> = ({ data, isLoading = false }) => {
  if (isLoading || !data || data.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-950/20 dark:to-transparent">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            Topic Mastery
          </h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-600 dark:text-slate-400">Loading mastery data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate average mastery
  const avgMastery = Math.round(data.reduce((sum, item) => sum + item.mastery, 0) / data.length);

  // Sort by mastery descending
  const sortedData = [...data].sort((a, b) => b.mastery - a.mastery);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-950/20 dark:to-transparent">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            Topic Mastery
          </h3>
          <div className="text-right">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{avgMastery}%</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Average</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <ResponsiveContainer width="100%" height={data.length * 40 + 100}>
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.1)" />
            <XAxis
              type="number"
              domain={[0, 100]}
              stroke="rgba(0, 0, 0, 0.5)"
              style={{ fontSize: '12px' }}
              tick={{ fill: 'rgba(0, 0, 0, 0.6)' }}
            />
            <YAxis
              type="category"
              dataKey="topic"
              stroke="rgba(0, 0, 0, 0.5)"
              style={{ fontSize: '12px' }}
              tick={{ fill: 'rgba(0, 0, 0, 0.6)' }}
              width={140}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
              }}
              formatter={(value: number, name: string, props: any) => {
                if (name === 'mastery') {
                  return [`${value}%`, 'Mastery'];
                }
                return [value, name];
              }}
              cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
            />
            <Bar
              dataKey="mastery"
              fill="#f59e0b"
              radius={[0, 4, 4, 0]}
              animationDuration={800}
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Stats Grid */}
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Mastered (≥80%)</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {data.filter(t => t.mastery >= 80).length}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">In Progress (50-80%)</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {data.filter(t => t.mastery >= 50 && t.mastery < 80).length}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Needs Work (&lt;50%)</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {data.filter(t => t.mastery < 50).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

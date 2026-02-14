/**
 * Readiness Trend Chart Component
 * Shows readiness score progression over time
 */

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

export interface ReadinessTrendPoint {
  date: string;
  score: number;
}

export interface ReadinessTrendChartProps {
  data: ReadinessTrendPoint[];
  isLoading?: boolean;
}

export const ReadinessTrendChart: React.FC<ReadinessTrendChartProps> = ({ data, isLoading = false }) => {
  if (isLoading || !data || data.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4 bg-gradient-to-r from-green-50/50 to-transparent dark:from-green-950/20 dark:to-transparent">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            Readiness Trend
          </h3>
        </div>
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-600 dark:text-slate-400">Loading trend data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate trend indicators
  const currentScore = data[data.length - 1]?.score || 0;
  const previousScore = data[Math.max(0, data.length - 8)]?.score || 0;
  const trendChange = currentScore - previousScore;
  const trendPercent = previousScore > 0 ? ((trendChange / previousScore) * 100).toFixed(1) : '0';

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4 bg-gradient-to-r from-green-50/50 to-transparent dark:from-green-950/20 dark:to-transparent">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            Readiness Trend (30 Days)
          </h3>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{currentScore.toFixed(0)}%</p>
            <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${
              trendChange > 0
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                : trendChange < 0
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {trendChange > 0 ? '+' : ''}{trendPercent}%
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.1)" />
            <XAxis
              dataKey="date"
              stroke="rgba(0, 0, 0, 0.5)"
              style={{ fontSize: '12px' }}
              tick={{ fill: 'rgba(0, 0, 0, 0.6)' }}
            />
            <YAxis
              domain={[0, 100]}
              stroke="rgba(0, 0, 0, 0.5)"
              style={{ fontSize: '12px' }}
              tick={{ fill: 'rgba(0, 0, 0, 0.6)' }}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
              }}
              formatter={(value: number) => `${value.toFixed(1)}%`}
              cursor={{ stroke: 'rgba(0, 0, 0, 0.1)' }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ fill: '#10b981', r: 5 }}
              activeDot={{ r: 7 }}
              isAnimationActive={true}
              animationDuration={800}
            />
            {/* Reference line at 80% (interview ready) */}
            <Line
              type="stepAfter"
              dataKey={() => 80}
              stroke="rgba(239, 68, 68, 0.3)"
              strokeDasharray="5 5"
              name="Interview Ready"
              isAnimationActive={false}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Legend Info */}
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Current</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{currentScore.toFixed(0)}%</p>
          </div>
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Change (7d)</p>
            <p className={`text-2xl font-bold ${trendChange > 0 ? 'text-emerald-600 dark:text-emerald-400' : trendChange < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>
              {trendChange > 0 ? '+' : ''}{trendPercent}%
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Goal</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">80%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Activity Chart Component
 * Shows daily problems solved, attempts, and effort over time
 */

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { Activity } from 'lucide-react';

export interface ActivityDataPoint {
  date: string;
  problemsSolved: number;
  totalAttempts: number;
  avgSolveTime: number;
}

export interface ActivityChartProps {
  data: ActivityDataPoint[];
  isLoading?: boolean;
}

export const ActivityChart: React.FC<ActivityChartProps> = ({ data, isLoading = false }) => {
  if (isLoading || !data || data.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4 bg-gradient-to-r from-purple-50/50 to-transparent dark:from-purple-950/20 dark:to-transparent">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Weekly Activity
          </h3>
        </div>
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-600 dark:text-slate-400">No activity data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4 bg-gradient-to-r from-purple-50/50 to-transparent dark:from-purple-950/20 dark:to-transparent">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          Weekly Activity
        </h3>
      </div>

      <div className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.1)" />
            <XAxis
              dataKey="date"
              stroke="rgba(0, 0, 0, 0.5)"
              style={{ fontSize: '12px' }}
              tick={{ fill: 'rgba(0, 0, 0, 0.6)' }}
            />
            <YAxis
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
              cursor={{ stroke: 'rgba(0, 0, 0, 0.1)' }}
            />
            <Legend />
            <Bar dataKey="problemsSolved" fill="#3b82f6" name="Problems Solved" radius={[4, 4, 0, 0]} />
            <Line
              type="monotone"
              dataKey="totalAttempts"
              stroke="#8b5cf6"
              name="Total Attempts"
              strokeWidth={2}
              dot={{ fill: '#8b5cf6', r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

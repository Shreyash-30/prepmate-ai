/**
 * Dashboard Intelligence Panels
 * Core metrics and performance indicators
 */

import { TrendingUp } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';

interface IntelligencePanelProps {
  title: string;
  value?: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  loading?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function IntelligencePanel({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  loading,
  children,
  className = '',
}: IntelligencePanelProps) {
  const { isDark } = useThemeStore();

  if (loading) return <SkeletonLoader height="h-32" />;

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-slate-600';
    }
  };

  return (
    <div
      className={`p-6 rounded-xl border transition-all duration-200 ${
        isDark
          ? 'bg-slate-800 border-slate-700 hover:border-slate-600'
          : 'bg-white border-slate-200 hover:border-slate-300'
      } ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {title}
          </h3>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 ${getTrendColor()}`}>
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">{trendValue}%</span>
          </div>
        )}
      </div>

      {children ? (
        children
      ) : (
        <>
          <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {value}
          </div>
          {subtitle && (
            <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              {subtitle}
            </p>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Mastery Heatmap
 */
interface TopicMastery {
  topic: string;
  mastery: number; // 0-1
  problems: number;
}

interface TopicMasteryHeatmapProps {
  data?: TopicMastery[];
  loading?: boolean;
}

export function TopicMasteryHeatmap({ data, loading }: TopicMasteryHeatmapProps) {
  const { isDark } = useThemeStore();

  if (loading) return <SkeletonLoader height="h-48" />;

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 0.8) return 'bg-green-500';
    if (mastery >= 0.6) return 'bg-yellow-500';
    if (mastery >= 0.4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div
      className={`p-6 rounded-xl border ${
        isDark
          ? 'bg-slate-800 border-slate-700'
          : 'bg-white border-slate-200'
      }`}
    >
      <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
        Topic Mastery Heatmap
      </h3>

      <div className="space-y-2">
        {data?.map((item) => (
          <div key={item.topic} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {item.topic}
              </span>
              <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                {(item.mastery * 100).toFixed(0)}%
              </span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
              <div
                className={`h-full ${getMasteryColor(item.mastery)} transition-all duration-300`}
                style={{ width: `${item.mastery * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Weak Topic Alerts
 */
interface WeakTopicAlert {
  topic: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

interface WeakTopicAlertsProps {
  alerts?: WeakTopicAlert[];
  loading?: boolean;
}

export function WeakTopicAlerts({ alerts, loading }: WeakTopicAlertsProps) {
  const { isDark } = useThemeStore();

  if (loading) return <SkeletonLoader height="h-48" />;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return isDark ? 'bg-red-900 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-700';
      case 'high':
        return isDark ? 'bg-orange-900 border-orange-700 text-orange-200' : 'bg-orange-50 border-orange-200 text-orange-700';
      case 'medium':
        return isDark ? 'bg-yellow-900 border-yellow-700 text-yellow-200' : 'bg-yellow-50 border-yellow-200 text-yellow-700';
      default:
        return isDark ? 'bg-blue-900 border-blue-700 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-700';
    }
  };

  return (
    <div
      className={`p-6 rounded-xl border ${
        isDark
          ? 'bg-slate-800 border-slate-700'
          : 'bg-white border-slate-200'
      }`}
    >
      <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
        ⚠️ Weak Areas Alert
      </h3>

      {alerts && alerts.length > 0 ? (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.topic}
              className={`p-3 rounded-lg border ${getRiskColor(alert.riskLevel)}`}
            >
              <div className="font-medium text-sm">{alert.topic}</div>
              <p className="text-xs mt-1 opacity-80">{alert.message}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          ✅ No weak areas detected! Keep up the good work.
        </p>
      )}
    </div>
  );
}

/**
 * Readiness Score Card
 */
interface ReadinessScoreProps {
  overallScore?: number;
  level?: string;
  companies?: Array<{ name: string; score: number }>;
  loading?: boolean;
}

export function ReadinessScoreCard({ overallScore = 0, level, companies, loading }: ReadinessScoreProps) {
  const { isDark } = useThemeStore();

  if (loading) return <SkeletonLoader height="h-56" />;

  const getReadinessColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div
      className={`p-6 rounded-xl border ${
        isDark
          ? 'bg-slate-800 border-slate-700'
          : 'bg-white border-slate-200'
      }`}
    >
      <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
        Interview Readiness
      </h3>

      <div className="space-y-6">
        {/* Overall Score */}
        <div className="text-center">
          <div className={`text-5xl font-bold ${getReadinessColor(overallScore)}`}>
            {overallScore}%
          </div>
          <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {level || 'Not Ready'}
          </p>
        </div>

        {/* Company Specific */}
        {companies && companies.length > 0 && (
          <div className="space-y-2">
            <p className={`text-xs font-medium uppercase ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              Company Readiness
            </p>
            {companies.map((company) => (
              <div key={company.name} className="flex justify-between items-center">
                <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {company.name}
                </span>
                <span className={`font-medium ${getReadinessColor(company.score)}`}>
                  {company.score}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Skeleton Loader Component
 */
interface SkeletonLoaderProps {
  height?: string;
  className?: string;
}

export function SkeletonLoader({ height = 'h-32', className = '' }: SkeletonLoaderProps) {
  const { isDark } = useThemeStore();

  return (
    <div
      className={`${height} rounded-xl animate-pulse ${
        isDark ? 'bg-slate-700' : 'bg-slate-200'
      } ${className}`}
    ></div>
  );
}

import React from 'react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: number;
  className?: string;
  gradient?: boolean;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
  gradient = false,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-border/50 p-6 transition-all duration-300 hover:shadow-card-hover',
        gradient ? 'bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20' : 'bg-card',
        className
      )}
    >
      {gradient && (
        <div className="absolute -right-8 -top-8 h-20 w-20 bg-primary-200/30 dark:bg-primary-700/30 rounded-full blur-xl" />
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
          </div>
          {icon && (
            <div className="text-2xl text-primary ml-4 flex-shrink-0">
              {icon}
            </div>
          )}
        </div>

        {(subtitle || trend !== undefined) && (
          <div className="flex items-center gap-2">
            {trend !== undefined && (
              <span className={cn(
                'text-xs font-medium px-2 py-1 rounded-full',
                trend >= 0 ? 'bg-success-50 text-success dark:bg-success-900/30 dark:text-success-400' : 'bg-destructive/10 text-destructive'
              )}>
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
            )}
            {subtitle && (
              <span className="text-xs text-muted-foreground">{subtitle}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  value: number;
  max?: number;
  label?: string;
  color?: 'success' | 'warning' | 'destructive' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

export function ProgressIndicator({
  value,
  max = 100,
  label,
  color = 'primary',
  size = 'md',
  animated = true,
  className,
}: ProgressIndicatorProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const colorClasses = {
    success: 'bg-success',
    warning: 'bg-warning',
    destructive: 'bg-destructive',
    primary: 'bg-primary',
  };

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">{label}</label>
          <span className="text-xs text-muted-foreground">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn('w-full bg-secondary rounded-full overflow-hidden', heightClasses[size])}>
        <div
          className={cn(
            colorClasses[color],
            'h-full rounded-full transition-all duration-500 ease-out',
            animated && 'animate-pulse-soft'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

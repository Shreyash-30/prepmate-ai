import React from 'react';
import { cn } from '@/lib/utils';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function ChartCard({
  title,
  subtitle,
  children,
  className,
  action,
}: ChartCardProps) {
  return (
    <div className={cn(
      'rounded-lg border border-border/50 bg-card p-6',
      'transition-all duration-300 hover:shadow-card-hover hover:border-border',
      className
    )}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="ml-4">{action}</div>}
      </div>
      <div className="h-auto">
        {children}
      </div>
    </div>
  );
}

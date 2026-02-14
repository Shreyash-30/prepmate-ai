import React from 'react';
import { cn } from '@/lib/utils';

interface GradientCardProps {
  children: React.ReactNode;
  from?: string;
  to?: string;
  className?: string;
}

export function GradientCard({
  children,
  from = 'from-primary-50',
  to = 'to-primary-100/50',
  className,
}: GradientCardProps) {
  return (
    <div className={cn(
      'relative overflow-hidden rounded-lg border border-primary-200/50 dark:border-primary-700/50 p-6',
      `bg-gradient-to-br ${from} ${to}`,
      'dark:from-primary-900/20 dark:to-primary-800/10',
      'transition-all duration-300 hover:shadow-card-hover hover:border-primary-300/80',
      className
    )}>
      <div className="absolute -right-12 -top-12 h-32 w-32 bg-primary-200/40 dark:bg-primary-700/40 rounded-full blur-2xl" />
      <div className="absolute -left-12 -bottom-12 h-32 w-32 bg-primary-300/20 dark:bg-primary-600/20 rounded-full blur-2xl" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

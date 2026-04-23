import React from 'react';
import { cn } from './cn';

type PageHeaderProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, description, icon, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6', className)}>
      <div className="flex items-start gap-3 min-w-0">
        {icon && (
          <div className="shrink-0 mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-ink tracking-tight truncate">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-ink-soft">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function PageContainer({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8', className)}>{children}</div>;
}

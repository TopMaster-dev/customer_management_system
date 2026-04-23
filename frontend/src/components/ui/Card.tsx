import React from 'react';
import { cn } from './cn';

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  padded?: boolean;
  hoverable?: boolean;
};

export function Card({ padded = true, hoverable, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-surface border border-slate-200/70 shadow-card',
        padded && 'p-5 sm:p-6',
        hoverable && 'transition-all hover:shadow-elevated hover:border-slate-300',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-base font-semibold text-ink', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-ink-soft mt-1', className)} {...props}>
      {children}
    </p>
  );
}

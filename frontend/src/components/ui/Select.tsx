import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from './cn';

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, wrapperClassName, className, id, children, ...props }, ref) => {
    const selectId = id || props.name;
    return (
      <div className={cn('w-full', wrapperClassName)}>
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-ink-muted mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'block w-full appearance-none rounded-lg border bg-white pl-3 pr-9 py-2.5 text-sm text-ink transition-colors focus:outline-none disabled:opacity-60 disabled:bg-slate-50',
              error
                ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                : 'border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200',
              className,
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
        </div>
        {error ? (
          <p className="mt-1.5 text-xs text-rose-600">{error}</p>
        ) : hint ? (
          <p className="mt-1.5 text-xs text-ink-faint">{hint}</p>
        ) : null}
      </div>
    );
  },
);
Select.displayName = 'Select';

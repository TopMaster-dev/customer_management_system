import React from 'react';
import { cn } from './cn';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  wrapperClassName?: string;
};

const base =
  'block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint ' +
  'transition-colors focus:outline-none disabled:opacity-60 disabled:bg-slate-50';

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, leftIcon, rightIcon, wrapperClassName, className, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className={cn('w-full', wrapperClassName)}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-ink-muted mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-faint">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              base,
              error
                ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                : 'border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200',
              leftIcon ? 'pl-9' : '',
              rightIcon ? 'pr-9' : '',
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute inset-y-0 right-3 flex items-center text-ink-faint">{rightIcon}</span>
          )}
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
Input.displayName = 'Input';

import React from 'react';

interface NeonInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const NeonInput: React.FC<NeonInputProps> = ({ 
  label, 
  error, 
  icon,
  className = '',
  ...props 
}) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label className="font-label text-xs uppercase tracking-wider text-on-surface-variant px-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full bg-surface-container-low border border-outline-variant/10 rounded-xl px-4 py-3
            text-on-surface placeholder:text-on-surface-variant/40 outline-none
            focus:border-primary/40 focus:bg-surface-container-highest focus:shadow-[0_0_15px_rgba(63,255,139,0.05)]
            transition-all duration-300
            ${icon ? 'pl-11' : ''}
            ${error ? 'border-error/40 focus:border-error/60' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <span className="text-xs text-error px-1 font-medium animate-in fade-in slide-in-from-top-1">
          {error}
        </span>
      )}
    </div>
  );
};

import type { ReactNode } from 'react';

interface FilterCardProps {
  children: ReactNode;
  className?: string;
}

export function FilterCard({ children, className = '' }: FilterCardProps) {
  return (
    <div className={`bg-surface-container-low rounded-3xl border border-white/5 p-5 ${className}`}>
      {children}
    </div>
  );
}

interface FilterFieldProps {
  label: string;
  children: ReactNode;
}

export function FilterField({ label, children }: FilterFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">
        {label}
      </label>
      {children}
    </div>
  );
}

interface FilterInputWrapperProps {
  icon?: ReactNode;
  children: ReactNode;
}

export function FilterInputWrapper({ icon, children }: FilterInputWrapperProps) {
  return (
    <div className="flex h-11 items-center gap-2 rounded-2xl bg-surface-container px-3">
      {icon && <span className="shrink-0 text-sm text-on-surface-variant">{icon}</span>}
      {children}
    </div>
  );
}

export const filterInputClass =
  'bg-transparent border-none text-sm text-white w-full focus:outline-none placeholder:text-on-surface-variant/50';

export const filterSelectClass =
  'appearance-none bg-transparent border-none text-sm text-white w-full focus:outline-none cursor-pointer';

import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface SelectFilterOption {
  label: string;
  value: string;
}

interface SelectFilterProps {
  options: SelectFilterOption[];
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  icon?: ReactNode;
  ariaLabel?: string;
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className="h-3 w-3" fill="none">
      <path d="M3.5 8.2 6.6 11 12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className="h-3.5 w-3.5" fill="none">
      <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SelectFilter({ options, value, onChange, placeholder = 'Todos', icon, ariaLabel }: SelectFilterProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const selected = options.find((option) => option.value === value);
  const hasValue = Boolean(selected && selected.value !== '');

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex h-11 w-full items-center gap-2 rounded-2xl border border-white/5 bg-surface-container px-3 text-left transition-colors hover:border-primary/30 hover:bg-surface-container-high focus:outline-none focus-visible:border-primary/60"
      >
        {icon && <span className="shrink-0 text-sm text-on-surface-variant">{icon}</span>}
        <span className={`flex-1 truncate text-sm ${hasValue ? 'text-white' : 'text-on-surface-variant/70'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="shrink-0 text-on-surface-variant">
          <ChevronIcon />
        </span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-2xl border border-white/10 bg-surface-container-high p-1 shadow-xl">
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors hover:bg-primary/20 hover:text-primary ${
                  active ? 'bg-primary/20 text-primary' : 'text-on-surface'
                }`}
              >
                <span>{option.label}</span>
                {active && <CheckIcon />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

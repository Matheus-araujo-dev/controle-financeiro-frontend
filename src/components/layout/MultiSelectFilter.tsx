import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectFilterProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  icon?: ReactNode;
  ariaLabel?: string;
  searchable?: boolean;
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

export function MultiSelectFilter({
  options,
  value,
  onChange,
  placeholder = 'Todos',
  icon,
  ariaLabel,
  searchable = false
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setSearch('');
      return;
    }
    if (searchable) {
      setTimeout(() => searchRef.current?.focus(), 0);
    }

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, searchable]);

  const selected = options.filter((option) => value.includes(option.value));
  const label =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? selected[0].label
        : `${selected.length} selecionados`;

  const filteredOptions = searchable && search.trim()
    ? options.filter((option) => option.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  function toggle(optionValue: string) {
    onChange(value.includes(optionValue) ? value.filter((item) => item !== optionValue) : [...value, optionValue]);
  }

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
        <span className={`flex-1 truncate text-sm ${selected.length ? 'text-white' : 'text-on-surface-variant/60'}`}>
          {label}
        </span>
        {value.length > 0 && (
          <span
            role="button"
            tabIndex={0}
            onClick={(event) => {
              event.stopPropagation();
              onChange([]);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.stopPropagation();
                onChange([]);
              }
            }}
            className="shrink-0 cursor-pointer text-xs text-on-surface-variant hover:text-white"
            aria-label="Limpar seleção"
          >
            ×
          </span>
        )}
        <span className="shrink-0 text-on-surface-variant">
          <ChevronIcon />
        </span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-2xl border border-white/10 bg-surface-container-high shadow-xl">
          {searchable && (
            <div className="border-b border-white/10 px-2 py-2">
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full rounded-xl bg-surface-container px-3 py-1.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
          )}
          <div className="max-h-56 overflow-auto p-1">
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-2 text-sm text-on-surface-variant">
                {search ? 'Nenhum resultado' : 'Sem opções'}
              </p>
            ) : (
              filteredOptions.map((option) => {
                const checked = value.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggle(option.value)}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors hover:bg-primary/20 hover:text-primary ${
                      checked ? 'bg-primary/20 text-primary' : 'text-on-surface'
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        checked ? 'border-primary/70 bg-primary/20 text-primary' : 'border-white/20 text-transparent'
                      }`}
                    >
                      {checked && <CheckIcon />}
                    </span>
                    <span>{option.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

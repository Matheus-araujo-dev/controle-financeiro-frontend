import { createPortal } from 'react-dom';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ChangeEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { formatDateBR, formatMonthYearBR, toMonthInputValue } from '../../shared/date';

export type DateInputMode = 'date' | 'month';

export type DateInputProps = {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  mode?: DateInputMode;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
  /** Reduz a altura para h-11 (contexto de filtros) em vez de min-h-[54px] (formulários). */
  compact?: boolean;
};

const monthLabels = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const weekdayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function parseIsoDate(value?: string) {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function parseIsoMonth(value?: string) {
  if (!value) return null;

  const normalized = toMonthInputValue(value);
  const match = /^(\d{4})-(\d{2})$/.exec(normalized);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!year || !month) return null;

  return { year, month };
}

function formatDisplayValue(mode: DateInputMode, value?: string) {
  if (!value) return '';
  return mode === 'date' ? formatDateBR(value) : formatMonthYearBR(value);
}

function monthDays(year: number, month: number) {
  const first = new Date(year, month - 1, 1);
  const firstDay = first.getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const prevMonthDays = new Date(year, month - 1, 0).getDate();
  const cells: Array<{ day: number; inMonth: boolean }> = [];

  for (let index = firstDay - 1; index >= 0; index -= 1) {
    cells.push({ day: prevMonthDays - index, inMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, inMonth: true });
  }

  const nextDays = 42 - cells.length;
  for (let day = 1; day <= nextDays; day += 1) {
    cells.push({ day, inMonth: false });
  }

  return cells;
}

function maskDate(raw: string, mode: DateInputMode): string {
  const digits = raw.replace(/\D/g, '');
  if (mode === 'date') {
    // dd/mm/aaaa
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  }
  // mm/aaaa
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2, 6)}`;
}

function parseMaskedToIso(masked: string, mode: DateInputMode): string | null {
  if (mode === 'date') {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(masked);
    if (!m) return null;
    const [, dd, mm, yyyy] = m;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (Number.isNaN(d.getTime()) || d.getMonth() + 1 !== Number(mm)) return null;
    return `${yyyy}-${mm}-${dd}`;
  }
  const m = /^(\d{2})\/(\d{4})$/.exec(masked);
  if (!m) return null;
  const [, mm, yyyy] = m;
  if (Number(mm) < 1 || Number(mm) > 12) return null;
  return `${yyyy}-${mm}`;
}

export function DateInput({
  value,
  onChange,
  disabled = false,
  mode = 'date',
  placeholder = mode === 'date' ? 'dd/mm/aaaa' : 'mm/aaaa',
  className = '',
  ariaLabel,
  compact = false
}: DateInputProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState<string | null>(null);
  const [popupStyle, setPopupStyle] = useState<CSSProperties>({});
  const [viewYear, setViewYear] = useState(() => {
    const month = parseIsoMonth(value);
    const date = parseIsoDate(value);
    return month?.year ?? date?.getFullYear() ?? new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const month = parseIsoMonth(value);
    const date = parseIsoDate(value);
    return month?.month ?? (date?.getMonth() ?? new Date().getMonth()) + 1;
  });

  const selectedDate = useMemo(() => parseIsoDate(value), [value]);
  const selectedMonth = useMemo(() => parseIsoMonth(value), [value]);
  const displayValue = formatDisplayValue(mode, value) || placeholder;
  const monthCells = useMemo(() => (mode === 'date' ? monthDays(viewYear, viewMonth) : []), [mode, viewMonth, viewYear]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !popupRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useLayoutEffect(() => {
    if (!open || disabled || !rootRef.current) return;

    const rect = rootRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const estimatedHeight = mode === 'date' ? 362 : 246;
    const minWidth = mode === 'date' ? 280 : 280;
    const estimatedWidth = Math.max(minWidth, Math.min(rect.width, viewportWidth - 16));
    const gap = 8;
    const showAbove = rect.bottom + estimatedHeight + gap > viewportHeight && rect.top > estimatedHeight + gap;
    const top = showAbove ? rect.top - estimatedHeight - gap : rect.bottom + gap;
    const left = Math.min(Math.max(8, rect.left), Math.max(8, viewportWidth - estimatedWidth - 8));

    setPopupStyle({
      position: 'fixed',
      top,
      left,
      width: estimatedWidth
    });
  }, [disabled, mode, open, value]);

  useEffect(() => {
    if (!open) return;

    const current =
      mode === 'date'
        ? selectedDate
        : selectedMonth
          ? new Date(selectedMonth.year, selectedMonth.month - 1, 1)
          : null;

    if (current) {
      setViewYear(current.getFullYear());
      setViewMonth(current.getMonth() + 1);
    }
  }, [mode, open, selectedDate, selectedMonth]);

  function close() {
    setOpen(false);
  }

  function selectDate(year: number, month: number, day: number) {
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange?.(iso);
    close();
  }

  function selectMonth(year: number, month: number) {
    const iso = `${year}-${String(month).padStart(2, '0')}`;
    onChange?.(iso);
    close();
  }

  const popup = open && !disabled ? (
    <div
      ref={popupRef}
      style={popupStyle}
      className={`z-[9999] overflow-hidden rounded-xl border border-white/10 bg-surface-container-high shadow-2xl ${
        mode === 'month' ? 'min-w-[280px]' : ''
      }`}
    >
      {mode === 'date' ? (
        <div className="p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-primary/15 hover:text-primary"
              onClick={() => {
                const next = new Date(viewYear, viewMonth - 2, 1);
                setViewYear(next.getFullYear());
                setViewMonth(next.getMonth() + 1);
              }}
              aria-label="Mês anterior"
            >
              <span className="material-symbols-outlined text-lg">keyboard_arrow_left</span>
            </button>
            <span className="text-sm font-bold text-on-surface">
              {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(viewYear, viewMonth - 1, 1))}
            </span>
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-primary/15 hover:text-primary"
              onClick={() => {
                const next = new Date(viewYear, viewMonth, 1);
                setViewYear(next.getFullYear());
                setViewMonth(next.getMonth() + 1);
              }}
              aria-label="Próximo mês"
            >
              <span className="material-symbols-outlined text-lg">keyboard_arrow_right</span>
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            {weekdayLabels.map((label, index) => (
              <span key={`${label}-${index}`}>{label}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {monthCells.map((cell, index) => {
              const isSelected =
                cell.inMonth &&
                selectedDate &&
                selectedDate.getFullYear() === viewYear &&
                selectedDate.getMonth() + 1 === viewMonth &&
                selectedDate.getDate() === cell.day;

              return (
                <button
                  key={`${cell.day}-${index}`}
                  type="button"
                  aria-label={`${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`}
                  className={`h-8 rounded-lg text-sm font-semibold transition-colors ${
                    cell.inMonth
                      ? isSelected
                        ? 'bg-primary/20 text-primary'
                        : 'text-on-surface hover:bg-primary/15 hover:text-primary'
                      : 'text-on-surface-variant/15 opacity-50'
                  }`}
                  onClick={() => {
                    const day = cell.day;

                    if (cell.inMonth) {
                      selectDate(viewYear, viewMonth, day);
                      return;
                    }

                    if (index < 7) {
                      const prev = new Date(viewYear, viewMonth - 2, day);
                      selectDate(prev.getFullYear(), prev.getMonth() + 1, day);
                      return;
                    }

                    const next = new Date(viewYear, viewMonth, day);
                    selectDate(next.getFullYear(), next.getMonth() + 1, day);
                  }}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              className="text-sm font-medium text-primary transition-colors hover:text-primary-container"
              onClick={() => onChange?.('')}
            >
              Limpar
            </button>
            <button
              type="button"
              className="text-sm font-medium text-primary transition-colors hover:text-primary-container"
              onClick={() => {
                const today = new Date();
                selectDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
              }}
            >
              Hoje
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-primary/15 hover:text-primary"
              onClick={() => setViewYear((current) => current - 1)}
              aria-label="Ano anterior"
            >
              <span className="material-symbols-outlined text-lg">keyboard_arrow_left</span>
            </button>
            <span className="text-sm font-bold text-on-surface">{viewYear}</span>
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-primary/15 hover:text-primary"
              onClick={() => setViewYear((current) => current + 1)}
              aria-label="Próximo ano"
            >
              <span className="material-symbols-outlined text-lg">keyboard_arrow_right</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {monthLabels.map((label, index) => {
              const monthNumber = index + 1;
              const isSelected = selectedMonth?.year === viewYear && selectedMonth?.month === monthNumber;

              return (
                <button
                  key={label}
                  type="button"
                  aria-label={`${label} ${viewYear}`}
                  className={`flex h-11 w-full items-center justify-center rounded-lg px-3 text-sm font-semibold capitalize transition-colors ${
                    isSelected ? 'bg-primary/20 text-primary' : 'text-on-surface hover:bg-primary/15 hover:text-primary'
                  }`}
                  onClick={() => selectMonth(viewYear, monthNumber)}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              className="text-sm font-medium text-primary transition-colors hover:text-primary-container"
              onClick={() => onChange?.('')}
            >
              Limpar
            </button>
            <button
              type="button"
              className="text-sm font-medium text-primary transition-colors hover:text-primary-container"
              onClick={() => {
                const today = new Date();
                selectMonth(today.getFullYear(), today.getMonth() + 1);
              }}
            >
              Este mês
            </button>
          </div>
        </div>
      )}
    </div>
  ) : null;

  function handleTextChange(e: ChangeEvent<HTMLInputElement>) {
    const masked = maskDate(e.target.value, mode);
    setTyped(masked);
    const iso = parseMaskedToIso(masked, mode);
    if (iso) {
      onChange?.(iso);
      setTyped(null);
      setOpen(false);
    } else if (masked === '') {
      onChange?.('');
    }
  }

  function handleTextKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      const iso = parseMaskedToIso(typed ?? '', mode);
      if (iso) { onChange?.(iso); setTyped(null); setOpen(false); }
    }
    if (e.key === 'Escape') { setTyped(null); setOpen(false); }
  }

  const inputDisplayValue = typed !== null ? typed : (value ? formatDisplayValue(mode, value) : '');

  return (
    <div ref={rootRef} className="relative w-full">
      <div
        className={`${className} flex w-full items-stretch overflow-hidden rounded-xl bg-surface-container ring-1 ring-white/5 transition-all ${compact ? 'h-11' : 'min-h-[54px]'} ${
          open ? 'ring-2 ring-primary/40' : 'hover:ring-white/10'
        } ${disabled ? 'opacity-60' : ''}`}
      >
        <input
          ref={inputRef}
          type="text"
          inputMode="none"
          disabled={disabled}
          aria-label={ariaLabel}
          placeholder={placeholder}
          value={inputDisplayValue}
          onChange={handleTextChange}
          onKeyDown={handleTextKeyDown}
          onFocus={() => { if (!disabled) setOpen(true); }}
          className={`min-w-0 flex-1 bg-transparent px-4 font-medium text-on-surface outline-none placeholder:text-outline/50 disabled:cursor-not-allowed ${compact ? 'text-sm' : ''}`}
        />
        <button
          type="button"
          disabled={disabled}
          aria-label={`Abrir calendário${ariaLabel ? ` — ${ariaLabel}` : ''}`}
          aria-expanded={open}
          onClick={() => { if (!disabled) setOpen((c) => !c); }}
          className="flex w-11 shrink-0 items-center justify-center border-l border-white/5 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary disabled:cursor-not-allowed"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-base">
            {mode === 'date' ? 'calendar_month' : 'date_range'}
          </span>
        </button>
      </div>

      {popup ? createPortal(popup, document.body) : null}
    </div>
  );
}

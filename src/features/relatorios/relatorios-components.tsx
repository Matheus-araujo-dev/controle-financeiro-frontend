import type { ReactNode } from 'react';
import { ComboBox } from '../../components/forms/ComboBox';
import { PageState } from '../../components/states/PageState';
import type { AlertItem } from './relatorios-helpers';

export function FilterInput({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <label className="px-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="cf-form-control min-h-[54px] w-full rounded-xl border border-white/5 bg-surface-container px-4 py-3 text-sm font-semibold text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary/40"
      />
    </div>
  );
}

export function FilterCombo({
  label,
  value,
  onChange,
  options,
  ariaLabel
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  ariaLabel?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="px-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</label>
      <ComboBox value={value} onChange={onChange} options={options} aria-label={ariaLabel ?? label} />
    </div>
  );
}

export function MetricCard({
  label,
  value,
  tone = 'neutral',
  hint
}: {
  label: string;
  value: string | number;
  tone?: 'neutral' | 'success' | 'danger' | 'warning';
  hint?: string;
}) {
  const toneClass = {
    neutral: 'text-on-surface',
    success: 'text-primary',
    danger: 'text-error',
    warning: 'text-tertiary'
  }[tone];

  return (
    <div className="rounded-2xl border border-white/5 bg-surface-container p-5">
      <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</span>
      <span className={`block font-headline text-2xl font-extrabold ${toneClass}`}>{value}</span>
      {hint ? <span className="mt-2 block text-xs text-on-surface-variant">{hint}</span> : null}
    </div>
  );
}

export function AlertCard({ alerta }: { alerta: AlertItem }) {
  const styles = {
    danger: { border: 'border-error/40', bg: 'bg-error/8', icon: 'text-error', title: 'text-error' },
    warning: { border: 'border-warning/40', bg: 'bg-warning/8', icon: 'text-warning', title: 'text-warning' },
    info: { border: 'border-primary/30', bg: 'bg-primary/8', icon: 'text-primary', title: 'text-primary' }
  }[alerta.severity];

  return (
    <div className={`flex items-start gap-4 rounded-2xl border p-5 ${styles.border} ${styles.bg}`}>
      <span className={`material-symbols-outlined mt-0.5 shrink-0 text-2xl ${styles.icon}`}>{alerta.icon}</span>
      <div className="min-w-0">
        <p className={`font-bold ${styles.title}`}>{alerta.title}</p>
        <p className="mt-1 text-sm text-on-surface-variant">{alerta.description}</p>
      </div>
    </div>
  );
}

export function ReportTable({
  headers,
  children,
  emptyText
}: {
  headers: string[];
  children?: ReactNode;
  emptyText: string;
}) {
  const isEmpty = !children;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-surface-container-low">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-left">
          <thead className="bg-surface-container text-[11px] font-bold tracking-widest text-on-surface-variant">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-5 py-4">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          {!isEmpty ? <tbody className="divide-y divide-white/5 text-sm text-on-surface">{children}</tbody> : null}
        </table>
      </div>
      {isEmpty ? (
        <div className="p-8">
          <PageState state="empty" title={emptyText} subtitle="Ajuste os filtros ou registre novos lançamentos para alimentar este relatório." />
        </div>
      ) : null}
    </div>
  );
}

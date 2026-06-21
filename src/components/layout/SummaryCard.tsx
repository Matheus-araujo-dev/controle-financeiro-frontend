import type { ReactNode } from 'react';

type SummaryCardAccent = 'primary' | 'error' | 'warning' | 'muted';

const accentClasses: Record<SummaryCardAccent, string> = {
  primary: 'text-primary',
  error: 'text-error',
  warning: 'text-amber-400',
  muted: 'text-on-surface-variant'
};

interface SummaryCardProps {
  label: string;
  value: ReactNode;
  accent?: SummaryCardAccent;
  /** Ícone discreto exibido abaixo do valor */
  icon?: ReactNode;
  /** Conteúdo livre no rodapé (ações rápidas, badges de status) */
  footer?: ReactNode;
  highlight?: boolean;
}

export function SummaryCard({ label, value, accent = 'muted', icon, footer, highlight = false }: SummaryCardProps) {
  return (
    <article
      className={`relative overflow-hidden rounded-2xl border bg-surface-container-low px-6 py-5 ${
        highlight ? 'border-primary/25' : 'border-white/6'
      }`}
    >
      {highlight && (
        <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
      )}
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">{label}</p>
      <p className={`mt-3 text-2xl font-black tracking-tight ${accentClasses[accent]}`}>{value}</p>
      {icon && <div className="mt-2 flex items-center gap-1.5 text-xs text-on-surface-variant">{icon}</div>}
      {footer && <div className="mt-3 text-xs text-on-surface-variant">{footer}</div>}
    </article>
  );
}

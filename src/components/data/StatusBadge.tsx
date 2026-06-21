export type StatusTone = 'success' | 'neutral' | 'danger' | 'warning' | 'info';

const toneStyles: Record<StatusTone, { dot: string; text: string; bg: string }> = {
  success: { dot: 'bg-primary', text: 'text-primary', bg: 'bg-primary/10' },
  neutral: { dot: 'bg-on-surface-variant', text: 'text-on-surface-variant', bg: 'bg-white/5' },
  danger: { dot: 'bg-error', text: 'text-error', bg: 'bg-error/10' },
  warning: { dot: 'bg-amber-400', text: 'text-amber-400', bg: 'bg-amber-400/10' },
  info: { dot: 'bg-primary', text: 'text-primary', bg: 'bg-primary/10' }
};

interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
}

/** Badge de status no padrão Carbon: ponto colorido + texto, fundo translúcido sutil. */
export function StatusBadge({ label, tone = 'neutral' }: StatusBadgeProps) {
  const style = toneStyles[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden />
      {label}
    </span>
  );
}

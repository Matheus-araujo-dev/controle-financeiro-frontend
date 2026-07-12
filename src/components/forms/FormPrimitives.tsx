import type { ReactNode } from 'react';
import { FormSection } from '../layout';
import { Button } from '../ui/Button';

export const formLabelClass = 'block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1';

export const formFieldClass =
  'cf-form-control w-full min-h-[54px] bg-surface-container border-none rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/40 transition-all font-medium placeholder:text-outline/40 outline-none disabled:cursor-not-allowed disabled:opacity-60';

export const formCompactFieldClass =
  'cf-form-control w-full min-h-[54px] bg-surface-container border-none rounded-xl px-4 py-3 text-sm text-on-surface focus:ring-2 focus:ring-primary/40 transition-all font-medium placeholder:text-outline/40 outline-none disabled:cursor-not-allowed disabled:opacity-60';

export const formTextAreaClass = `${formFieldClass} resize-none`;

export function FieldError({ message }: { message?: ReactNode }) {
  if (!message) return null;
  return <p className="ml-1 text-xs font-bold text-error">{message}</p>;
}

export function ToggleField({
  checked,
  disabled,
  onChange,
  label,
  description
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex min-h-[54px] w-full items-center justify-between gap-4 rounded-xl bg-surface-container px-4 py-3 text-left ring-1 ring-white/5 transition-all hover:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60 ${
        checked ? 'text-primary' : 'text-on-surface'
      }`}
    >
      <span className="min-w-0">
        {label ? <span className="block text-sm font-bold">{label}</span> : null}
        {description ? <span className="block text-xs text-on-surface-variant">{description}</span> : null}
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-surface-container-high'}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${checked ? 'right-1' : 'left-1'}`} />
      </span>
    </button>
  );
}

export function ReadonlyField({ children }: { children: ReactNode }) {
  return (
    <div className={`${formFieldClass} flex items-center text-on-surface-variant`}>
      <span className="truncate">{children}</span>
    </div>
  );
}

type SummaryItem = {
  label: string;
  value: ReactNode;
  accent?: boolean;
};

export function FormActionPanel({
  title = 'Pronto para salvar?',
  eyebrow = 'Resumo',
  icon = <span className="material-symbols-outlined font-bold text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>,
  items,
  submitLabel,
  cancelLabel = 'Cancelar e Voltar',
  submitDisabled,
  submitting,
  error,
  onCancel,
  children
}: {
  title?: string;
  eyebrow?: string;
  icon?: ReactNode;
  items: SummaryItem[];
  submitLabel: string;
  cancelLabel?: string;
  submitDisabled?: boolean;
  submitting?: boolean;
  error?: string;
  onCancel: () => void;
  children?: ReactNode;
}) {
  return (
    <FormSection className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto" title={title} eyebrow={eyebrow} icon={icon} compact>
      <div className="mb-5 space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-baseline justify-between gap-4 rounded-2xl border border-white/5 bg-surface-container p-2.5">
            <span className="text-xs font-medium text-on-surface-variant">{item.label}</span>
            <strong
              className={`max-w-[62%] truncate text-right font-headline ${
                item.accent ? 'text-lg text-primary' : 'text-on-surface'
              }`}
            >
              {item.value}
            </strong>
          </div>
        ))}
      </div>

      {error ? (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-error/20 bg-error/10 p-4 text-error">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          <p className="text-xs font-bold">{error}</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <Button type="submit" size="lg" className="w-full rounded-2xl font-black" disabled={submitDisabled} loading={submitting}>
          {submitting ? 'Salvando...' : submitLabel}
        </Button>
        <Button type="button" size="lg" variant="secondary" className="w-full rounded-2xl font-bold" onClick={onCancel}>
          {cancelLabel}
        </Button>
      </div>

      {children ? <div className="mt-5 border-t border-outline-variant/10 pt-5">{children}</div> : null}
    </FormSection>
  );
}

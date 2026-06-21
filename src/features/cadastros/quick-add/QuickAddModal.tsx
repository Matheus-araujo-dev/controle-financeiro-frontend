import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { Button } from '../../../components/ui/Button';

type QuickAddModalProps = {
  open: boolean;
  title: string;
  eyebrow?: string;
  icon?: string;
  children: ReactNode;
  error?: string;
  loading?: boolean;
  submitDisabled?: boolean;
  submitLabel?: string;
  onClose: () => void;
  onSubmit: () => void;
};

export function QuickAddModal({
  open,
  title,
  eyebrow = 'Cadastro rápido',
  icon = 'add_circle',
  children,
  error,
  loading = false,
  submitDisabled = false,
  submitLabel = 'Confirmar Cadastro',
  onClose,
  onSubmit
}: QuickAddModalProps) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm" role="presentation">
      <div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-2xl rounded-3xl border border-outline-variant/10 bg-surface-container-low p-7 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-surface-container text-primary shadow">
            <span aria-hidden="true" className="material-symbols-outlined text-2xl">
              {icon}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{eyebrow}</p>
            <h3 className="font-headline text-lg font-bold text-on-surface">{title}</h3>
          </div>
        </div>

        <div className="space-y-4">{children}</div>

        {error ? (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-error/20 bg-error/10 p-4 text-error">
            <span aria-hidden="true" className="material-symbols-outlined text-sm">
              warning
            </span>
            <p className="text-xs font-bold">{error}</p>
          </div>
        ) : null}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" size="lg" className="rounded-2xl font-bold" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" size="lg" className="rounded-2xl font-black" loading={loading} disabled={submitDisabled || loading} onClick={onSubmit}>
            {loading ? 'Salvando...' : submitLabel}
          </Button>
        </div>
      </div>
    </div>
    ,
    document.body
  );
}

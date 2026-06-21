import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Button, type ButtonVariant } from '../ui/Button';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  body: ReactNode;
  children?: ReactNode;
  eyebrow?: string;
  icon?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ButtonVariant;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  title,
  body,
  children,
  eyebrow = 'Confirmação',
  icon = 'help',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmVariant = 'primary',
  loading = false,
  onClose,
  onConfirm
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (!loading && event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-lg rounded-3xl border border-outline-variant/10 bg-surface-container-low p-7 shadow-2xl">
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

        <div className="text-sm leading-6 text-on-surface-variant">{body}</div>

        {children ? <div className="mt-5 space-y-4">{children}</div> : null}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" size="lg" className="rounded-2xl font-bold" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            size="lg"
            className="rounded-2xl font-black"
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

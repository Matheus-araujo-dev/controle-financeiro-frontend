import type { PropsWithChildren } from 'react';
import { Button } from 'antd';

type EntityFormShellProps = PropsWithChildren<{
  title: string;
  description: string;
  submitLabel?: string;
  cancelLabel?: string;
  isValid: boolean;
  isSubmitting?: boolean;
  showSubmit?: boolean;
  showCancel?: boolean;
  showHeader?: boolean;
  onCancel?: () => void;
}>;

export function EntityFormShell({
  title,
  description,
  children,
  submitLabel = 'Salvar',
  cancelLabel = 'Cancelar',
  isValid,
  isSubmitting = false,
  showSubmit = true,
  showCancel = true,
  showHeader = true,
  onCancel
}: EntityFormShellProps) {
  return (
    <div className="entity-form-shell bg-surface-container-low p-8 rounded-3xl border border-white/5 space-y-6">
      {showHeader ? (
        <div className="entity-form-shell__header">
          <h3 className="text-lg font-headline font-bold text-on-surface">{title}</h3>
          <p className="text-on-surface-variant text-sm mt-1">{description}</p>
        </div>
      ) : null}

      <div className="entity-form-shell__body">{children}</div>

      <div className="entity-form-shell__footer flex justify-end gap-3 pt-5 border-t border-white/5">
        {showCancel && onCancel ? <Button onClick={onCancel}>{cancelLabel}</Button> : null}
        {showSubmit ? (
          <Button type="primary" htmlType="submit" disabled={!isValid} loading={isSubmitting}>
            {submitLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

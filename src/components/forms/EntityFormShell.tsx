import type { PropsWithChildren } from 'react';
import { Button, Card, Space, Typography } from 'antd';

type EntityFormShellProps = PropsWithChildren<{
  title: string;
  description: string;
  submitLabel?: string;
  cancelLabel?: string;
  isValid: boolean;
  isSubmitting?: boolean;
  showSubmit?: boolean;
  showCancel?: boolean;
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
  onCancel
}: EntityFormShellProps) {
  return (
    <Card className="entity-form-shell">
      <Space orientation="vertical" size={24} style={{ width: '100%' }}>
        <div className="entity-form-shell__header">
          <Typography.Title level={4}>{title}</Typography.Title>
          <Typography.Paragraph>{description}</Typography.Paragraph>
        </div>

        <div className="entity-form-shell__body">{children}</div>

        <Space className="entity-form-shell__footer">
          {showCancel && onCancel ? <Button onClick={onCancel}>{cancelLabel}</Button> : null}
          {showSubmit ? (
            <Button type="primary" htmlType="submit" disabled={!isValid} loading={isSubmitting}>
              {submitLabel}
            </Button>
          ) : null}
        </Space>
      </Space>
    </Card>
  );
}

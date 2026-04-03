import type { PropsWithChildren } from 'react';
import { Button, Card, Space, Typography } from 'antd';

type EntityFormShellProps = PropsWithChildren<{
  title: string;
  description: string;
  submitLabel?: string;
  cancelLabel?: string;
  isValid: boolean;
  isSubmitting?: boolean;
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
  onCancel
}: EntityFormShellProps) {
  return (
    <Card>
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <div>
          <Typography.Title level={4}>{title}</Typography.Title>
          <Typography.Paragraph>{description}</Typography.Paragraph>
        </div>

        <div>{children}</div>

        <Space>
          {onCancel ? <Button onClick={onCancel}>{cancelLabel}</Button> : null}
          <Button type="primary" htmlType="submit" disabled={!isValid} loading={isSubmitting}>
            {submitLabel}
          </Button>
        </Space>
      </Space>
    </Card>
  );
}

import type { ReactNode } from 'react';
import { Card, Col, Row, Space, Typography } from 'antd';

export type SummaryCardItem = {
  key: string;
  label: string;
  value: ReactNode;
  caption?: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
};

const toneColors: Record<NonNullable<SummaryCardItem['tone']>, string> = {
  neutral: 'rgba(255,255,255,0.14)',
  success: 'rgba(82, 196, 26, 0.35)',
  warning: 'rgba(250, 173, 20, 0.35)',
  danger: 'rgba(255, 77, 79, 0.35)'
};

export function ListSummaryCards({ items }: { items: SummaryCardItem[] }) {
  if (!items.length) {
    return null;
  }

  return (
    <Row gutter={[16, 16]} className="list-summary-cards">
      {items.map((item) => (
        <Col key={item.key} xs={24} sm={12} lg={8} xl={6}>
          <Card
            className={`list-summary-card list-summary-card--${item.tone ?? 'neutral'}`}
            size="small"
            style={{
              borderColor: toneColors[item.tone ?? 'neutral'],
              background: 'rgba(255,255,255,0.02)'
            }}
          >
            <Space orientation="vertical" size={8} style={{ width: '100%' }}>
              <Typography.Text className="list-summary-card__label" type="secondary">{item.label}</Typography.Text>
              <Typography.Title level={3} className="list-summary-card__value" style={{ margin: 0 }}>
                {item.value}
              </Typography.Title>
              {item.caption ? (
                <Typography.Text className="list-summary-card__caption" type="secondary">{item.caption}</Typography.Text>
              ) : null}
            </Space>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

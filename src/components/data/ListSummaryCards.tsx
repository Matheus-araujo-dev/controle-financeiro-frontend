import type { ReactNode } from 'react';
import { SummaryCard } from '../layout';

export type SummaryCardItem = {
  key: string;
  label: string;
  value: ReactNode;
  caption?: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
};

const toneToAccent: Record<NonNullable<SummaryCardItem['tone']>, 'primary' | 'warning' | 'error' | 'muted'> = {
  neutral: 'muted',
  success: 'primary',
  warning: 'warning',
  danger: 'error'
};

export function ListSummaryCards({ items }: { items: SummaryCardItem[] }) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <SummaryCard
          key={item.key}
          label={item.label}
          value={item.value}
          accent={toneToAccent[item.tone ?? 'neutral']}
          footer={item.caption}
        />
      ))}
    </section>
  );
}

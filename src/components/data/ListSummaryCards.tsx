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

const colsClass: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  5: 'grid-cols-2 lg:grid-cols-5'
};

export function ListSummaryCards({ items, columns = 4 }: { items: SummaryCardItem[]; columns?: number }) {
  if (!items.length) {
    return null;
  }

  const gridClass = colsClass[columns] ?? colsClass[4];

  return (
    <section className={`grid gap-4 ${gridClass}`}>
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

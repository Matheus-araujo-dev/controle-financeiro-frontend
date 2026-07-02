import type { ReactNode } from 'react';

interface ListPageShellProps {
  actions?: ReactNode;
  summary?: ReactNode;
  filters?: ReactNode;
  children: ReactNode;
  summaryColumns?: 2 | 3 | 4;
}

const summaryGridCols: Record<2 | 3 | 4, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 xl:grid-cols-4'
};

export function ListPageShell({
  actions,
  summary,
  filters,
  children,
  summaryColumns = 3
}: ListPageShellProps) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {(actions || filters) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* FilterCard handles its own mobile/desktop split */}
          {filters && <div className="flex-1 min-w-0">{filters}</div>}
          {actions && (
            <div className="flex flex-wrap items-center gap-3 shrink-0">{actions}</div>
          )}
        </div>
      )}

      {summary && (
        <section className={`grid gap-3 sm:gap-4 ${summaryGridCols[summaryColumns]}`}>{summary}</section>
      )}

      {children}
    </div>
  );
}

import type { ReactNode } from 'react';

interface ListPageShellProps {
  /** Botões de ação no canto superior direito (ex: "Nova conta", "Exportar") */
  actions?: ReactNode;
  /** Cards de KPI — use <SummaryCard> aqui */
  summary?: ReactNode;
  /** Área de filtros — use <FilterCard> aqui */
  filters?: ReactNode;
  /** Tabela ou conteúdo principal */
  children: ReactNode;
  /** Colunas do grid de summary (padrão: 3) */
  summaryColumns?: 2 | 3 | 4;
}

const summaryGridCols: Record<2 | 3 | 4, string> = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-2 xl:grid-cols-4'
};

export function ListPageShell({
  actions,
  summary,
  filters,
  children,
  summaryColumns = 3
}: ListPageShellProps) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {actions && (
        <div className="flex flex-wrap items-center justify-end gap-3">{actions}</div>
      )}

      {summary && (
        <section className={`grid gap-4 ${summaryGridCols[summaryColumns]}`}>{summary}</section>
      )}

      {filters}

      {children}
    </div>
  );
}

import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../ui/Button';
import { PageState } from '../states/PageState';

type DataIndexKey = string | number;
type DataIndexPath = readonly DataIndexKey[];
type SortOrder = 'ascend' | 'descend' | undefined;

export type TablePaginationConfig = {
  current?: number;
  defaultPageSize?: number;
  pageSize?: number;
  total?: number;
  showSizeChanger?: boolean;
  pageSizeOptions?: Array<string | number>;
  size?: 'small' | 'middle' | 'large';
  showTotal?: (total: number, range: [number, number]) => ReactNode;
  onChange?: (page: number, pageSize: number) => void;
};

export type AppTableSorter<T extends object> = {
  field?: string;
  columnKey?: string;
  order?: SortOrder;
  column?: AppDataColumn<T>;
};

export type AppTableChange<T extends object> = (
  pagination: TablePaginationConfig,
  filters: Record<string, unknown>,
  sorter: AppTableSorter<T>
) => void;

export type AppDataColumn<T extends object> = {
  title: ReactNode;
  dataIndex?: DataIndexKey | DataIndexPath;
  key?: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  fixed?: 'left' | 'right';
  sorter?: boolean | ((left: T, right: T) => number);
  className?: string;
  responsive?: string[];
  ellipsis?: boolean;
  children?: AppDataColumn<T>[];
  // O valor é tipado dinamicamente conforme o `dataIndex` da coluna (contrato igual ao
  // ColumnType do Ant Design); `unknown` quebraria todos os callbacks `render` existentes.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: (value: any, record: T, index: number) => ReactNode;
};

export type TableColumnsType<T extends object> = AppDataColumn<T>[];

type AppDataTableProps<T extends object> = {
  columns: TableColumnsType<T>;
  dataSource: T[];
  rowKey: keyof T | ((record: T) => string);
  pagination?: false | TablePaginationConfig;
  loading?: boolean;
  errorMessage?: string;
  emptyMessage?: string;
  onRetry?: () => void;
  onTableChange?: AppTableChange<T>;
  size?: 'small' | 'middle' | 'large';
};

const alignClass = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right'
};

function isSortableColumn<T extends object>(column: AppDataColumn<T>) {
  const key = String(column.key ?? column.dataIndex ?? '');
  return column.sorter !== false && key !== 'acoes' && key !== 'actions';
}

function readColumnValue<T extends object>(record: T, dataIndex: DataIndexKey | DataIndexPath | undefined) {
  if (!dataIndex) {
    return undefined;
  }

  if (Array.isArray(dataIndex)) {
    return dataIndex.reduce<unknown>((current, key) => {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }

      return (current as Record<DataIndexKey, unknown>)[key];
    }, record);
  }

  return (record as Record<DataIndexKey, unknown>)[dataIndex as DataIndexKey];
}

function getRowKey<T extends object>(rowKey: AppDataTableProps<T>['rowKey'], record: T) {
  if (typeof rowKey === 'function') {
    return rowKey(record);
  }

  return String(record[rowKey]);
}

function getFlatColumns<T extends object>(columns: TableColumnsType<T>): TableColumnsType<T> {
  return columns.flatMap((column) => (column.children?.length ? getFlatColumns(column.children) : [column]));
}

function isCompactViewport() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(max-width: 1023px)').matches
    : false;
}

function useCompactTableLayout() {
  const [compact, setCompact] = useState(isCompactViewport);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const handleChange = () => setCompact(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener?.('change', handleChange);
    return () => mediaQuery.removeEventListener?.('change', handleChange);
  }, []);

  return compact;
}

function getColumnKey<T extends object>(column: AppDataColumn<T>) {
  return String(column.key ?? column.dataIndex ?? '');
}

function renderHeaderTitle<T extends object>(column: AppDataColumn<T>) {
  const columnKey = getColumnKey(column);

  if (['acoes', 'actions'].includes(columnKey) && typeof column.title === 'string') {
    const title = column.title.trim();
    return <span className="normal-case tracking-normal">{title.charAt(0).toUpperCase() + title.slice(1).toLowerCase()}</span>;
  }

  return column.title;
}

function isActionColumn<T extends object>(column: AppDataColumn<T>) {
  return ['acoes', 'actions'].includes(getColumnKey(column));
}

function getSortField<T extends object>(column: AppDataColumn<T>) {
  if (column.dataIndex !== undefined && !Array.isArray(column.dataIndex)) {
    return String(column.dataIndex);
  }

  const columnKey = getColumnKey(column);
  return columnKey.length > 0 ? columnKey : undefined;
}

function nextSortOrder(current?: SortOrder): SortOrder {
  if (current === 'ascend') {
    return 'descend';
  }

  if (current === 'descend') {
    return undefined;
  }

  return 'ascend';
}

function formatRange(current: number, pageSize: number, total: number): [number, number] {
  if (total === 0) {
    return [0, 0];
  }

  const start = (current - 1) * pageSize + 1;
  const end = Math.min(current * pageSize, total);
  return [start, end];
}

function renderSortIcon(active: boolean, order?: SortOrder) {
  const iconClass = active && order ? 'text-primary' : 'text-on-surface-variant/40';
  const path =
    order === 'ascend'
      ? 'M8 3.25 3.75 7.5h8.5L8 3.25Z'
      : order === 'descend'
        ? 'M8 12.75 12.25 8.5h-8.5L8 12.75Z'
        : 'M8 2.75 4.5 6.25h7L8 2.75Zm0 10.5 3.5-3.5h-7L8 13.25Z';

  if (!active || !order) {
    return (
      <span className={`inline-flex h-3.5 w-3.5 items-center justify-center ${iconClass}`} aria-hidden>
        <svg viewBox="0 0 16 16" className="block h-3.5 w-3.5" fill="currentColor">
          <path d={path} />
        </svg>
      </span>
    );
  }

  return (
    <span className={`inline-flex h-3.5 w-3.5 items-center justify-center ${iconClass}`} aria-hidden>
      <svg viewBox="0 0 16 16" className="block h-3.5 w-3.5" fill="currentColor">
        <path d={path} />
      </svg>
    </span>
  );
}

function DropdownChevron() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="block h-3.5 w-3.5" fill="none">
      <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function renderCell<T extends object>(column: AppDataColumn<T>, record: T, index: number) {
  const value = readColumnValue(record, column.dataIndex);
  const content = column.render ? column.render(value, record, index) : value;

  if (content === null || content === undefined || content === '') {
    return <span className="text-on-surface-variant">-</span>;
  }

  return content as ReactNode;
}

function PaginationControls({
  pagination,
  onChange
}: {
  pagination: TablePaginationConfig;
  onChange?: (pagination: TablePaginationConfig) => void;
}) {
  const current = Math.max(1, pagination.current ?? 1);
  const pageSize = Math.max(1, pagination.pageSize ?? pagination.defaultPageSize ?? 20);
  const total = Math.max(0, pagination.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const range = formatRange(current, pageSize, total);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const pageSizeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pageSizeOpen) {
      return undefined;
    }

    function handleClickOutside(event: MouseEvent) {
      if (pageSizeMenuRef.current && !pageSizeMenuRef.current.contains(event.target as Node)) {
        setPageSizeOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [pageSizeOpen]);

  function changePage(page: number, nextPageSize = pageSize) {
    const normalizedPage = Math.min(Math.max(1, page), Math.max(1, Math.ceil(total / nextPageSize)));
    pagination.onChange?.(normalizedPage, nextPageSize);
    onChange?.({ ...pagination, current: normalizedPage, pageSize: nextPageSize });
  }

  return (
    <div className="flex flex-col gap-3 border-t border-white/5 bg-surface-container-low px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-xs font-semibold text-on-surface-variant">
        {pagination.showTotal ? pagination.showTotal(total, range) : `${range[0]}-${range[1]} de ${total} registros`}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {pagination.showSizeChanger !== false ? (
          <div ref={pageSizeMenuRef} className="relative">
            <button
              type="button"
              aria-label="Registros por página"
              aria-expanded={pageSizeOpen}
              onClick={() => setPageSizeOpen((currentOpen) => !currentOpen)}
              className="grid h-10 min-w-32 grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-white/10 bg-surface-container px-3 text-xs font-semibold leading-none text-on-surface transition-colors hover:border-primary/40 hover:bg-surface-container-high focus:outline-none focus-visible:border-primary/60"
            >
              <span className="flex items-center leading-none">{pageSize} / página</span>
              <span className="flex h-4 w-4 items-center justify-center self-center text-on-surface-variant leading-none">
                <DropdownChevron />
              </span>
            </button>

            {pageSizeOpen ? (
              <div className="absolute bottom-full left-0 z-30 mb-1 w-full overflow-hidden rounded-2xl border border-white/10 bg-surface-container-high p-1 shadow-xl">
                {(pagination.pageSizeOptions ?? ['20', '50', '100']).map((option) => {
                  const optionValue = Number(option);
                  const active = optionValue === pageSize;
                  return (
                    <button
                      key={String(option)}
                      type="button"
                      onClick={() => {
                        setPageSizeOpen(false);
                        changePage(1, optionValue);
                      }}
                      className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors hover:bg-primary/20 hover:text-primary ${
                        active ? 'bg-primary/20 text-primary' : 'text-on-surface'
                      }`}
                    >
                      {option} / página
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          disabled={current <= 1}
          onClick={() => changePage(current - 1)}
          className="h-10 rounded-xl border border-primary/40 bg-primary/15 px-4 text-xs font-bold text-primary transition-colors hover:bg-primary/25 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ color: '#2bf58e' }}
        >
          Anterior
        </button>
        <span className="min-w-12 text-center text-xs font-bold text-on-surface">
          {current} / {totalPages}
        </span>
        <button
          type="button"
          disabled={current >= totalPages}
          onClick={() => changePage(current + 1)}
          className="h-10 rounded-xl border border-primary/40 bg-primary/15 px-4 text-xs font-bold text-primary transition-colors hover:bg-primary/25 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ color: '#2bf58e' }}
        >
          Próxima
        </button>
      </div>
    </div>
  );
}

export function AppDataTable<T extends object>({
  columns,
  dataSource,
  rowKey,
  pagination = false,
  loading = false,
  errorMessage,
  emptyMessage = 'Nenhum registro encontrado.',
  onRetry,
  onTableChange
}: AppDataTableProps<T>) {
  const flatColumns = useMemo(() => getFlatColumns(columns), [columns]);
  const compactLayout = useCompactTableLayout();
  const [sortState, setSortState] = useState<{ columnKey?: string; order?: SortOrder }>({});

  if (loading) {
    return <PageState state="loading" title="Carregando tabela..." />;
  }

  if (errorMessage) {
    return (
      <div className="data-table-error flex flex-col gap-4 p-5">
        <PageState state="error" title="Falha ao carregar dados" subtitle={errorMessage} />
        {onRetry ? (
          <Button onClick={onRetry} type="button" className="self-start">
            Tentar novamente
          </Button>
        ) : null}
      </div>
    );
  }

  if (dataSource.length === 0) {
    return (
      <div className="data-table-empty px-6 py-16 text-center" data-testid="data-table-empty">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-surface-container text-primary">
          <span className="material-symbols-outlined text-2xl">database</span>
        </div>
        <p className="text-sm font-semibold text-on-surface">{emptyMessage}</p>
      </div>
    );
  }

  function emitChange(nextPagination: TablePaginationConfig, sorter: AppTableSorter<T>) {
    onTableChange?.(nextPagination, {}, sorter);
  }

  function handleSort(column: AppDataColumn<T>) {
    if (!isSortableColumn(column)) {
      return;
    }

    const columnKey = getColumnKey(column);
    const order = nextSortOrder(sortState.columnKey === columnKey ? sortState.order : undefined);
    const nextSort = { columnKey: order ? columnKey : undefined, order };
    setSortState(nextSort);

    emitChange(
      pagination === false ? {} : { ...pagination, current: 1 },
      {
        field: order ? getSortField(column) : undefined,
        columnKey: order ? columnKey : undefined,
        order,
        column
      }
    );
  }

  function handlePaginationChange(nextPagination: TablePaginationConfig) {
    const column = flatColumns.find((item) => getColumnKey(item) === sortState.columnKey);
    emitChange(nextPagination, {
      field: sortState.order && column ? getSortField(column) : undefined,
      columnKey: sortState.order ? sortState.columnKey : undefined,
      order: sortState.order,
      column
    });
  }

  return (
    <div className="listing-table overflow-hidden rounded-3xl border border-white/5 bg-surface-container-low">
      {compactLayout ? (
        <div className="grid gap-3 p-3">
          {dataSource.map((record, rowIndex) => {
            const actionColumns = flatColumns.filter((column) => ['acoes', 'actions'].includes(getColumnKey(column)));
            const dataColumns = flatColumns.filter((column) => !['acoes', 'actions'].includes(getColumnKey(column)));
            return (
              <article key={getRowKey(rowKey, record)} className="rounded-2xl border border-white/5 bg-surface-container p-4">
                <div className="space-y-3">
                  {dataColumns.map((column) => (
                    <div key={getColumnKey(column)} className="grid gap-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                        {column.title}
                      </span>
                      <div className="text-sm font-semibold text-on-surface">{renderCell(column, record, rowIndex)}</div>
                    </div>
                  ))}
                </div>

                {actionColumns.length ? (
                  <div className="mt-4 flex flex-wrap justify-end gap-1 border-t border-white/5 pt-3">
                    {actionColumns.map((column) => (
                      <div key={getColumnKey(column)} className="flex min-h-[44px] min-w-[44px] items-center justify-center">
                        {renderCell(column, record, rowIndex)}
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse" role="table">
            <thead className="bg-surface-container">
              <tr>
                {flatColumns.map((column) => {
                  const columnKey = getColumnKey(column);
                  const sortable = isSortableColumn(column);
                  const active = sortState.columnKey === columnKey;
                  const width = typeof column.width === 'number' ? `${column.width}px` : column.width;
                  return (
                    <th
                      key={columnKey}
                      scope="col"
                      style={width ? { width } : undefined}
                      onClick={sortable ? () => handleSort(column) : undefined}
                      className={`border-b border-white/5 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant ${
                        alignClass[isActionColumn(column) ? 'center' : column.align ?? 'left']
                      } ${sortable ? 'cursor-pointer' : ''} ${isActionColumn(column) ? 'tracking-normal' : ''} ${
                        column.fixed === 'right' ? 'sticky right-0 z-10 bg-surface-container' : ''
                      }`}
                      {...(isActionColumn(column) ? { style: { ...(width ? { width } : undefined), textTransform: 'none', letterSpacing: '0' } } : {})}
                    >
                      {sortable ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleSort(column);
                          }}
                          className={`inline-flex w-full items-center gap-2 ${
                            isActionColumn(column)
                              ? 'justify-center'
                              : column.align === 'right'
                                ? 'justify-end'
                                : column.align === 'center'
                                  ? 'justify-center'
                                  : 'justify-start'
                          } transition-colors hover:text-primary`}
                        >
                          <span>{renderHeaderTitle(column)}</span>
                          {renderSortIcon(active, sortState.order)}
                        </button>
                      ) : (
                        renderHeaderTitle(column)
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {dataSource.map((record, rowIndex) => (
        <tr key={getRowKey(rowKey, record)} className="group border-b border-white/5 last:border-b-0 hover:bg-primary/5">
                  {flatColumns.map((column) => (
                    <td
                      key={getColumnKey(column)}
                      className={`px-4 py-4 text-sm text-on-surface ${alignClass[column.align ?? 'left']} ${
                        column.fixed === 'right' ? 'sticky right-0 z-10 bg-transparent' : ''
                      } ${column.className ?? ''}`}
                    >
                      {renderCell(column, record, rowIndex)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination !== false ? <PaginationControls pagination={pagination} onChange={handlePaginationChange} /> : null}
    </div>
  );
}

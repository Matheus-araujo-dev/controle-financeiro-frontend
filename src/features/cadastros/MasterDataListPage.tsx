import { useDeferredValue, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircleOutlined,
  EditOutlined,
  EyeOutlined,
  FileAddOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { AppDataTable, type TableColumnsType } from '../../components/data/AppDataTable';
import { ExportButton } from '../../components/data/ExportButton';
import { IconActionButton } from '../../components/data/IconActionButton';
import { ListSummaryCards } from '../../components/data/ListSummaryCards';
import { estimateActionsColumnWidth } from './master-data-list-helpers';
import { Button } from '../../components/ui/Button';
import {
  FilterCard,
  FilterField,
  FilterInputWrapper,
  filterInputClass,
  ListPageShell,
  MultiSelectFilter
} from '../../components/layout';
import type { MasterDataModuleConfig, RowAction, SelectOption } from './module-config';

type KeyedValue<T> = {
  configKey: string;
  value: T;
};

function asMultiValue(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string | boolean | number => ['string', 'boolean', 'number'].includes(typeof item))
      .map(String);
  }

  if (typeof value === 'string' && value.length > 0) {
    return [value];
  }

  if (typeof value === 'boolean' || typeof value === 'number') {
    return [String(value)];
  }

  return [];
}

function resolveFilterValue(filter: { kind: 'text' | 'select' | 'multiselect'; options?: SelectOption[] }, selected: string[]) {
  if (selected.length === 0) {
    return undefined;
  }

  const values = selected.map((value) => filter.options?.find((option) => String(option.value) === value)?.value ?? value);

  if (values.every((value) => typeof value === 'boolean')) {
    return values.length === 1 ? values[0] : undefined;
  }

  if (filter.kind === 'select') {
    return values[0];
  }

  return values;
}

function resolveActionIcon<TSummary>(action: RowAction<TSummary>, record: TSummary) {
  if (typeof action.icon === 'function') {
    return action.icon(record);
  }

  if (action.icon) {
    return action.icon;
  }

  if (action.key === 'editar') {
    return <EditOutlined />;
  }

  if (action.key === 'toggle-status') {
    const label = typeof action.label === 'function' ? action.label(record) : action.label;
    return label === 'Ativar' ? <PlayCircleOutlined /> : <PauseCircleOutlined />;
  }

  if (action.key === 'gerar-conta-pagar') {
    return <FileAddOutlined />;
  }

  if (action.key === 'ver-conta-pagar') {
    return <EyeOutlined />;
  }

  return action.danger ? <PauseCircleOutlined /> : <CheckCircleOutlined />;
}

function buildColumns<TSummary extends { id: string }>(
  baseColumns: TableColumnsType<TSummary>,
  rowActions: RowAction<TSummary>[] | undefined,
  reload: () => Promise<void>,
  actionsColumnWidth?: number
) {
  if (!rowActions?.length) {
    return baseColumns;
  }

  return [
    ...baseColumns,
    {
      title: 'Ações',
      key: 'acoes',
      fixed: 'right' as const,
      width: actionsColumnWidth ?? estimateActionsColumnWidth(rowActions),
      render: (_value: unknown, record: TSummary) => (
        <div className="flex flex-wrap items-center justify-end gap-1">
          {rowActions
            .filter((action) => action.isVisible?.(record) ?? true)
            .map((action) => {
              const label = typeof action.label === 'function' ? action.label(record) : action.label;
              const disabled = action.disabled?.(record) ?? false;
              const icon = resolveActionIcon(action, record);

              if (action.href && !disabled) {
                return <IconActionButton key={action.key} label={label} icon={icon} href={action.href(record)} />;
              }

              return (
                <IconActionButton
                  key={action.key}
                  label={label}
                  icon={icon}
                  danger={action.danger}
                  disabled={disabled}
                  onClick={async () => {
                    await action.onClick?.(record);
                    await reload();
                  }}
                />
              );
            })}
        </div>
      )
    }
  ] satisfies TableColumnsType<TSummary>;
}

export function MasterDataListPage({
  config
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: MasterDataModuleConfig<any, any, any, any>;
}) {
  const navigate = useNavigate();
  const [filtersState, setFiltersState] = useState<KeyedValue<Record<string, unknown>>>({
    configKey: config.key,
    value: config.defaultFilters
  });
  const filters = filtersState.configKey === config.key ? filtersState.value : config.defaultFilters;
  const deferredFilters = useDeferredValue(filters);

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: [config.key, 'list', deferredFilters],
    queryFn: () => config.list(deferredFilters),
    staleTime: 30_000,
    placeholderData: (prev) => prev
  });

  const errorMessage = error instanceof Error ? error.message : error ? 'Falha ao carregar os dados.' : undefined;

  const reload = async () => { await refetch(); };

  const columns = buildColumns(
    config.columns,
    config.rowActions,
    reload,
    config.actionsColumnWidth
  );

  return (
    <ListPageShell
      actions={
        <>
          {config.exportColumns && config.exportColumns.length > 0 && (
            <ExportButton
              fetchPage={config.list}
              filters={filters}
              columns={config.exportColumns}
              filename={config.key}
            />
          )}
          <Button onClick={() => navigate(`${config.routeBase}/novo`)} icon={<PlusOutlined aria-hidden />}>
            {config.createLabel ?? `Nova ${config.singularTitle.toLowerCase()}`}
          </Button>
        </>
      }
      filters={
        config.filters.length > 0 ? (
        <FilterCard>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {config.filters.map((filter) => (
              <FilterField key={filter.name} label={filter.label}>
                {filter.kind === 'text' ? (
                  <FilterInputWrapper icon={<SearchOutlined />}>
                    <input
                      placeholder={filter.placeholder ?? filter.label}
                      value={String((filters as Record<string, unknown>)[filter.name] ?? '')}
                      onChange={(event) =>
                        setFiltersState({
                          configKey: config.key,
                          value: { ...filters, page: 1, [filter.name]: event.target.value }
                        })
                      }
                      className={filterInputClass}
                    />
                  </FilterInputWrapper>
                ) : filter.kind === 'multiselect' || filter.kind === 'select' ? (
                  <MultiSelectFilter
                    ariaLabel={filter.label}
                    placeholder={filter.placeholder ?? 'Todos'}
                    options={(filter.options as SelectOption[]).map((opt) => ({
                      label: opt.label,
                      value: String(opt.value ?? '')
                    }))}
                    value={asMultiValue((filters as Record<string, unknown>)[filter.name])}
                    onChange={(next) =>
                      setFiltersState({
                        configKey: config.key,
                        value: { ...filters, page: 1, [filter.name]: resolveFilterValue(filter, next) }
                      })
                    }
                  />
                ) : null}
              </FilterField>
            ))}
          </div>
        </FilterCard>
        ) : undefined
      }
    >
      {config.buildSummaryItems && data?.summary ? <ListSummaryCards items={config.buildSummaryItems(data.summary)} /> : null}

      <div className="bg-surface-container-low rounded-3xl overflow-hidden border border-white/5">
        <AppDataTable
          columns={columns}
          dataSource={data?.items ?? []}
          rowKey="id"
          loading={isFetching}
          errorMessage={errorMessage}
          emptyMessage={config.emptyMessage}
          onRetry={reload}
          onTableChange={(pagination, _f, sorter) => {
            const s = Array.isArray(sorter) ? sorter[0] : sorter;
            setFiltersState({
              configKey: config.key,
              value: {
                ...filters,
                page: pagination.current ?? filters.page,
                pageSize: pagination.pageSize ?? filters.pageSize,
                sortBy: s?.field ?? undefined,
                sortDirection: s?.order === 'ascend' ? 'Asc' : s?.order === 'descend' ? 'Desc' : undefined
              }
            });
          }}
          pagination={{
            current: data?.page ?? filters.page,
            pageSize: data?.pageSize ?? filters.pageSize,
            total: data?.totalItems ?? 0,
            showSizeChanger: true
          }}
        />
      </div>
    </ListPageShell>
  );
}

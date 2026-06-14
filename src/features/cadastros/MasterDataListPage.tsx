import { useDeferredValue, useEffect, useState } from 'react';
import { Input, Select, Space } from 'antd';
import type { TableColumnsType } from 'antd';
import {
  CheckCircleOutlined,
  EditOutlined,
  EyeOutlined,
  FileAddOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { AppDataTable } from '../../components/data/AppDataTable';
import { IconActionButton } from '../../components/data/IconActionButton';
import { ListSummaryCards } from '../../components/data/ListSummaryCards';
import type { MasterDataModuleConfig, RowAction, SelectOption } from './module-config';

type KeyedValue<T> = {
  configKey: string;
  value: T;
};

function normalizeSelectValue(value: string | boolean | undefined) {
  if (value === '' || value === undefined) {
    return undefined;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return value;
}

export function estimateActionsColumnWidth<TSummary>(rowActions: RowAction<TSummary>[] | undefined) {
  if (!rowActions?.length) {
    return 96;
  }

  return Math.max(96, Math.min(220, rowActions.length * 44 + 20));
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
        <Space size={4} wrap>
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
        </Space>
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
  const [dataState, setDataState] = useState<KeyedValue<Awaited<ReturnType<typeof config.list>>> | undefined>();
  const data = dataState?.configKey === config.key ? dataState.value : undefined;
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState<KeyedValue<string> | undefined>();
  const errorMessage = errorState?.configKey === config.key ? errorState.value : undefined;

  async function loadData() {
    setLoading(true);
    setErrorState(undefined);

    try {
      const response = await config.list(deferredFilters);
      setDataState({
        configKey: config.key,
        value: response
      });
    } catch (error) {
      setErrorState({
        configKey: config.key,
        value: error instanceof Error ? error.message : 'Falha ao carregar os dados.'
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setFiltersState({
      configKey: config.key,
      value: config.defaultFilters
    });
    setDataState(undefined);
    setErrorState(undefined);
    setLoading(false);
  }, [config.key]);

  useEffect(() => {
    void loadData();
  }, [config.key, deferredFilters.page, deferredFilters.pageSize, JSON.stringify(deferredFilters)]);

  const columns = buildColumns(
    config.columns,
    config.rowActions as RowAction<any>[] | undefined,
    loadData,
    config.actionsColumnWidth
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <h2 className="text-on-surface-variant font-label text-xs uppercase tracking-[0.2em] mb-2">Cadastros</h2>
          <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tighter text-white mb-2 neon-glow">
            {config.title}
          </h1>
          <p className="text-on-surface-variant font-medium">{config.listDescription}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`${config.routeBase}/novo`)}
          className="bg-primary hover:bg-primary-container text-on-primary font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_4px_20px_rgba(63,255,139,0.2)] self-start md:self-auto"
        >
          <PlusOutlined aria-hidden className="text-lg" />
          Nova {config.singularTitle.toLowerCase()}
        </button>
      </div>

      {/* Filters */}
      {config.filters.length > 0 ? (
        <div className="bg-surface-container-low p-5 rounded-3xl border border-white/5 flex flex-wrap items-end gap-4">
          {config.filters.map((filter) => (
            <div key={filter.name} className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">
                {filter.label}
              </label>
              {filter.kind === 'text' ? (
                <Input
                  placeholder={filter.placeholder ?? filter.label}
                  value={String((filters as Record<string, unknown>)[filter.name] ?? '')}
                  onChange={(event) =>
                    setFiltersState({
                      configKey: config.key,
                      value: {
                        ...filters,
                        page: 1,
                        [filter.name]: event.target.value
                      }
                    })
                  }
                  style={{ width: 240 }}
                />
              ) : (
                <Select
                  placeholder={filter.label}
                  options={filter.options as SelectOption[]}
                  value={
                    typeof (filters as Record<string, unknown>)[filter.name] === 'boolean'
                      ? String((filters as Record<string, unknown>)[filter.name])
                      : ((filters as Record<string, unknown>)[filter.name] as string | undefined)
                  }
                  onChange={(value) =>
                    setFiltersState({
                      configKey: config.key,
                      value: {
                        ...filters,
                        page: 1,
                        [filter.name]: normalizeSelectValue(value)
                      }
                    })
                  }
                  style={{ minWidth: 180 }}
                />
              )}
            </div>
          ))}
        </div>
      ) : null}

      {config.buildSummaryItems && data?.summary ? <ListSummaryCards items={config.buildSummaryItems(data.summary)} /> : null}

      <div className="bg-surface-container-low rounded-3xl overflow-hidden border border-white/5">
        <AppDataTable
          columns={columns}
          dataSource={data?.items ?? []}
          rowKey="id"
          loading={loading}
          errorMessage={errorMessage}
          emptyMessage={config.emptyMessage}
          onRetry={loadData}
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
    </div>
  );
}

import { useDeferredValue, useEffect, useState } from 'react';
import { Button, Input, Select, Space, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import {
  CheckCircleOutlined,
  EditOutlined,
  EyeOutlined,
  FileAddOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
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
    <Space orientation="vertical" size={24} style={{ width: '100%' }} className="master-data-list-page">
      <div className="master-data-list-page__header">
        <div className="master-data-list-page__copy">
          <Typography.Title level={4}>{config.title}</Typography.Title>
          <Typography.Paragraph>{config.listDescription}</Typography.Paragraph>
        </div>
        <Button type="primary" size="large" className="master-data-list-page__cta">
          <Link to={`${config.routeBase}/novo`}>Nova {config.singularTitle.toLowerCase()}</Link>
        </Button>
      </div>

      <div className="master-data-list-page__filters">
        {config.filters.map((filter) =>
          filter.kind === 'text' ? (
            <Input
              key={filter.name}
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
              key={filter.name}
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
          )
        )}
      </div>

      {config.buildSummaryItems && data?.summary ? <ListSummaryCards items={config.buildSummaryItems(data.summary)} /> : null}

      <div className="master-data-list-page__table">
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
    </Space>
  );
}

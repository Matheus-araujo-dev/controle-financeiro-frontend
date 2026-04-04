import { useDeferredValue, useEffect, useState } from 'react';
import { Button, Input, Select, Space, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { Link } from 'react-router-dom';
import { AppDataTable } from '../../components/data/AppDataTable';
import type { MasterDataModuleConfig, RowAction, SelectOption } from './module-config';

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

function buildColumns<TSummary extends { id: string }>(
  baseColumns: TableColumnsType<TSummary>,
  rowActions: RowAction<TSummary>[] | undefined,
  reload: () => Promise<void>
) {
  if (!rowActions?.length) {
    return baseColumns;
  }

  return [
    ...baseColumns,
    {
      title: 'Acoes',
      key: 'acoes',
      render: (_value: unknown, record: TSummary) => (
        <Space>
          {rowActions.map((action) => {
            const label = typeof action.label === 'function' ? action.label(record) : action.label;

            if (action.href) {
              return (
                <Button key={action.key} size="small">
                  <Link to={action.href(record)}>{label}</Link>
                </Button>
              );
            }

            return (
              <Button
                key={action.key}
                size="small"
                danger={action.danger}
                onClick={async () => {
                  await action.onClick?.(record);
                  await reload();
                }}
              >
                {label}
              </Button>
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
  config: MasterDataModuleConfig<any, any, any, any>;
}) {
  const [filters, setFilters] = useState<Record<string, any>>(config.defaultFilters);
  const deferredFilters = useDeferredValue(filters);
  const [data, setData] = useState<Awaited<ReturnType<typeof config.list>>>();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  async function loadData() {
    setLoading(true);
    setErrorMessage(undefined);

    try {
      const response = await config.list(deferredFilters);
      setData(response);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar os dados.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [deferredFilters.page, deferredFilters.pageSize, JSON.stringify(deferredFilters)]);

  const columns = buildColumns(config.columns, config.rowActions as RowAction<any>[] | undefined, loadData);

  return (
    <Space orientation="vertical" size={24} style={{ width: '100%' }}>
      <Space align="baseline" style={{ width: '100%', justifyContent: 'space-between' }}>
        <div>
          <Typography.Title level={4}>{config.title}</Typography.Title>
          <Typography.Paragraph>{config.listDescription}</Typography.Paragraph>
        </div>
        <Button type="primary">
          <Link to={`${config.routeBase}/novo`}>Nova {config.singularTitle.toLowerCase()}</Link>
        </Button>
      </Space>

      <Space wrap>
        {config.filters.map((filter) =>
          filter.kind === 'text' ? (
            <Input
              key={filter.name}
              placeholder={filter.placeholder ?? filter.label}
              value={String((filters as Record<string, unknown>)[filter.name] ?? '')}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  page: 1,
                  [filter.name]: event.target.value
                }))
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
                setFilters((current) => ({
                  ...current,
                  page: 1,
                  [filter.name]: normalizeSelectValue(value)
                }))
              }
              style={{ minWidth: 180 }}
            />
          )
        )}
      </Space>

      <AppDataTable
        columns={columns}
        dataSource={data?.items ?? []}
        rowKey="id"
        loading={loading}
        errorMessage={errorMessage}
        emptyMessage={config.emptyMessage}
        onRetry={loadData}
        pagination={{
          current: data?.page ?? filters.page,
          pageSize: data?.pageSize ?? filters.pageSize,
          total: data?.totalItems ?? 0,
          showSizeChanger: true,
          onChange: (page, pageSize) =>
            setFilters((current) => ({
              ...current,
              page,
              pageSize
            }))
        }}
      />
    </Space>
  );
}

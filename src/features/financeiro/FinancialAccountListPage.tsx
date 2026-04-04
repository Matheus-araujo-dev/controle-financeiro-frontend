import { useDeferredValue, useEffect, useState } from 'react';
import { Button, Input, Select, Space, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { AppDataTable } from '../../components/data/AppDataTable';
import type { StatusContaCodigo } from '../../types/financeiro';
import { statusOptions } from './module-config';
import type { FinanceiroModuleConfig } from './module-config';

export function FinancialAccountListPage({
  config
}: {
  config: FinanceiroModuleConfig<any, any, any>;
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
      const response = await config.list(deferredFilters as never);
      setData(response);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar os lancamentos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [deferredFilters.page, deferredFilters.pageSize, JSON.stringify(deferredFilters)]);

  const columns = [
    ...config.columns,
    {
      title: 'Acoes',
      key: 'acoes',
      render: (_value: unknown, record: { id: string }) => (
        <Button size="small">
          <Link to={`${config.routeBase}/${record.id}`}>Editar</Link>
        </Button>
      )
    }
  ];

  return (
    <Space orientation="vertical" size={24} style={{ width: '100%' }}>
      <Space align="baseline" style={{ width: '100%', justifyContent: 'space-between' }}>
        <div>
          <Typography.Title level={4}>{config.title}</Typography.Title>
          <Typography.Paragraph>{config.listDescription}</Typography.Paragraph>
        </div>
        <Button type="primary">
          <Link to={`${config.routeBase}/nova`}>Nova {config.singularTitle.toLowerCase()}</Link>
        </Button>
      </Space>

      <Space wrap>
        <Input
          placeholder="Buscar por descricao, documento ou pessoa"
          value={String(filters.search ?? '')}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              page: 1,
              search: event.target.value
            }))
          }
          style={{ width: 280 }}
        />
        <Select
          placeholder="Status"
          options={statusOptions}
          value={(filters.statusCodigo as StatusContaCodigo | undefined) ?? ''}
          onChange={(value) =>
            setFilters((current) => ({
              ...current,
              page: 1,
              statusCodigo: value || undefined
            }))
          }
          style={{ minWidth: 180 }}
        />
      </Space>

      <AppDataTable
        columns={columns}
        dataSource={data?.items ?? []}
        rowKey="id"
        loading={loading}
        errorMessage={errorMessage}
        emptyMessage="Nenhum lancamento encontrado."
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

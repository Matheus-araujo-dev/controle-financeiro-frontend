import { useDeferredValue, useEffect, useState } from 'react';
import { Input, Select, Space, Typography } from 'antd';
import { AppDataTable } from '../../components/data/AppDataTable';
import { financeiroApi } from '../../services/http/financeiro-api';
import type { MovimentacaoFilters, NaturezaMovimentacao, TipoMovimentacao } from '../../types/financeiro';

const tipoOptions: Array<{ label: string; value: TipoMovimentacao | '' }> = [
  { label: 'Todos os tipos', value: '' },
  { label: 'Entrada', value: 'Entrada' },
  { label: 'Saida', value: 'Saida' }
];

const naturezaOptions: Array<{ label: string; value: NaturezaMovimentacao | '' }> = [
  { label: 'Todas as naturezas', value: '' },
  { label: 'Prevista', value: 'Prevista' },
  { label: 'Realizada', value: 'Realizada' },
  { label: 'Economica', value: 'Economica' }
];

export function MovimentacoesPage() {
  const [filters, setFilters] = useState<MovimentacaoFilters>({
    page: 1,
    pageSize: 20,
    search: ''
  });
  const deferredFilters = useDeferredValue(filters);
  const [data, setData] = useState<Awaited<ReturnType<typeof financeiroApi.movimentacoes.listar>>>();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  async function loadData() {
    setLoading(true);
    setErrorMessage(undefined);

    try {
      setData(await financeiroApi.movimentacoes.listar(deferredFilters));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar as movimentacoes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [deferredFilters.page, deferredFilters.pageSize, JSON.stringify(deferredFilters)]);

  return (
    <Space orientation="vertical" size={24} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={4}>Movimentacoes</Typography.Title>
        <Typography.Paragraph>Visualizacao consolidada das entradas e saidas geradas pelas liquidacoes financeiras.</Typography.Paragraph>
      </div>

      <Space wrap>
        <Input
          placeholder="Buscar por observacao"
          value={filters.search ?? ''}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              page: 1,
              search: event.target.value
            }))
          }
          style={{ width: 240 }}
        />
        <Select
          options={tipoOptions}
          value={filters.tipo ?? ''}
          onChange={(value: TipoMovimentacao | '') =>
            setFilters((current) => ({
              ...current,
              page: 1,
              tipo: value || undefined
            }))
          }
          style={{ width: 180 }}
        />
        <Select
          options={naturezaOptions}
          value={filters.natureza ?? ''}
          onChange={(value: NaturezaMovimentacao | '') =>
            setFilters((current) => ({
              ...current,
              page: 1,
              natureza: value || undefined
            }))
          }
          style={{ width: 180 }}
        />
      </Space>

      <AppDataTable
        rowKey="id"
        loading={loading}
        errorMessage={errorMessage}
        emptyMessage="Nenhuma movimentacao encontrada."
        onRetry={loadData}
        dataSource={data?.items ?? []}
        columns={[
          { title: 'Data', dataIndex: 'dataMovimentacao', key: 'dataMovimentacao' },
          { title: 'Tipo', dataIndex: 'tipo', key: 'tipo' },
          { title: 'Natureza', dataIndex: 'natureza', key: 'natureza' },
          {
            title: 'Valor',
            dataIndex: 'valor',
            key: 'valor',
            render: (value) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          },
          { title: 'Status', dataIndex: 'statusCodigo', key: 'statusCodigo' },
          { title: 'Observacao', dataIndex: 'observacao', key: 'observacao', render: (value) => value ?? '-' }
        ]}
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

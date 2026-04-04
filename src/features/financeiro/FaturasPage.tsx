import { useDeferredValue, useEffect, useState } from 'react';
import { Button, Input, Space, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { AppDataTable } from '../../components/data/AppDataTable';
import { financeiroApi } from '../../services/http/financeiro-api';
import type { FaturaFilters } from '../../types/financeiro';

const defaultFilters: FaturaFilters = {
  page: 1,
  pageSize: 10,
  search: '',
  competencia: ''
};

export function FaturasPage() {
  const [filters, setFilters] = useState<FaturaFilters>(defaultFilters);
  const deferredFilters = useDeferredValue(filters);
  const [data, setData] = useState<Awaited<ReturnType<typeof financeiroApi.faturas.listar>>>();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  async function loadData() {
    setLoading(true);
    setErrorMessage(undefined);

    try {
      setData(await financeiroApi.faturas.listar(deferredFilters));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar faturas.');
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
        <Typography.Title level={4}>Faturas</Typography.Title>
        <Typography.Paragraph>Acompanhe a competencia dos cartoes, os itens agrupados e o pagamento das faturas.</Typography.Paragraph>
      </div>

      <Space wrap>
        <Input
          placeholder="Buscar por cartao ou competencia"
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
      </Space>

      <AppDataTable
        rowKey="id"
        loading={loading}
        errorMessage={errorMessage}
        emptyMessage="Nenhuma fatura encontrada."
        onRetry={loadData}
        dataSource={data?.items ?? []}
        columns={[
          { title: 'Cartao', dataIndex: 'cartaoNome', key: 'cartaoNome' },
          { title: 'Competencia', dataIndex: 'competencia', key: 'competencia' },
          { title: 'Fechamento', dataIndex: 'dataFechamento', key: 'dataFechamento' },
          { title: 'Vencimento', dataIndex: 'dataVencimento', key: 'dataVencimento' },
          {
            title: 'Valor total',
            dataIndex: 'valorTotal',
            key: 'valorTotal',
            render: (value) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          },
          { title: 'Status', dataIndex: 'statusCodigo', key: 'statusCodigo' },
          { title: 'Itens', dataIndex: 'quantidadeItens', key: 'quantidadeItens' },
          {
            title: 'Acoes',
            key: 'acoes',
            render: (_value, record: { id: string }) => (
              <Button size="small">
                <Link to={`/faturas/${record.id}`}>Detalhar</Link>
              </Button>
            )
          }
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

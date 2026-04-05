import { useDeferredValue, useEffect, useState } from 'react';
import { Button, Input, Select, Space, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { AppDataTable } from '../../components/data/AppDataTable';
import { conciliacaoApi } from '../../services/http/conciliacao-api';
import type {
  ConciliacaoFilters,
  ConciliacaoItem,
  ConciliacaoMovimentacaoCandidata,
  StatusConciliacaoCodigo
} from '../../types/conciliacao';

const defaultFilters: ConciliacaoFilters = {
  page: 1,
  pageSize: 10,
  search: '',
  statusConciliacaoCodigo: ''
};

const statusOptions: Array<{ label: string; value: StatusConciliacaoCodigo | '' }> = [
  { label: 'Todos os status', value: '' },
  { label: 'Pendentes', value: 'PENDENTE' },
  { label: 'Conciliados', value: 'CONCILIADO' }
];

export function ConciliacaoPage() {
  const [filters, setFilters] = useState<ConciliacaoFilters>(defaultFilters);
  const deferredFilters = useDeferredValue(filters);
  const [data, setData] = useState<Awaited<ReturnType<typeof conciliacaoApi.listar>>>();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [actionErrorMessage, setActionErrorMessage] = useState<string>();
  const [lastActionMessage, setLastActionMessage] = useState<string>();
  const [loadingActionId, setLoadingActionId] = useState<string>();

  const columns: TableColumnsType<ConciliacaoItem> = [
    { title: 'Remetente', dataIndex: 'remetente', key: 'remetente' },
    {
      title: 'Extrato',
      key: 'extrato',
      render: (_value, record) => (
        <Space orientation="vertical" size={4}>
          <Typography.Text strong>{record.descricaoExtrato ?? 'Sem descricao identificada'}</Typography.Text>
          <Typography.Text type="secondary">
            {record.dataSugerida ?? 'Sem data'} | {formatarMoeda(record.valorSugerido)}
          </Typography.Text>
        </Space>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (_value, record) => (
        <Tag color={record.statusConciliacaoCodigo === 'CONCILIADO' ? 'green' : 'gold'}>{record.statusConciliacaoNome}</Tag>
      )
    },
    {
      title: 'Sugestoes',
      key: 'candidatas',
      render: (_value, record) =>
        record.candidatas.length === 0 ? (
          <Typography.Text type="secondary">Sem sugestoes pendentes.</Typography.Text>
        ) : (
          <Space orientation="vertical" size={4}>
            {record.candidatas.map((candidata) => (
              <Typography.Text key={candidata.movimentacaoFinanceiraId}>
                {formatarCandidata(candidata)}
              </Typography.Text>
            ))}
          </Space>
        )
    },
    {
      title: 'Vinculo',
      key: 'vinculo',
      render: (_value, record) => record.movimentacaoConciliadaDescricao ?? '-'
    },
    {
      title: 'Acoes',
      key: 'acoes',
      render: (_value, record) =>
        record.statusConciliacaoCodigo === 'CONCILIADO' || record.candidatas.length === 0 ? (
          <Typography.Text type="secondary">Sem acao pendente</Typography.Text>
        ) : (
          <Space orientation="vertical" size={8}>
            {record.candidatas.slice(0, 3).map((candidata) => (
              <Button
                key={candidata.movimentacaoFinanceiraId}
                size="small"
                type="primary"
                loading={loadingActionId === record.itemImportadoWhatsappId}
                onClick={() => void handleConfirm(record, candidata)}
              >
                {`Conciliar ${candidata.observacao ?? candidata.tipo}`}
              </Button>
            ))}
          </Space>
        )
    }
  ];

  async function loadData() {
    setLoading(true);
    setErrorMessage(undefined);

    try {
      setData(await conciliacaoApi.listar(deferredFilters));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar conciliacao.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(item: ConciliacaoItem, candidata: ConciliacaoMovimentacaoCandidata) {
    setLoadingActionId(item.itemImportadoWhatsappId);
    setActionErrorMessage(undefined);
    setLastActionMessage(undefined);

    try {
      const conciliado = await conciliacaoApi.confirmarVinculo(item.itemImportadoWhatsappId, {
        movimentacaoFinanceiraId: candidata.movimentacaoFinanceiraId,
        observacao: 'Conciliacao manual assistida via tela'
      });

      setData((current) =>
        current
          ? {
              ...current,
              items: current.items.map((entry) =>
                entry.itemImportadoWhatsappId === conciliado.itemImportadoWhatsappId ? conciliado : entry
              )
            }
          : current
      );
      setLastActionMessage(`Ultimo vinculo confirmado para o item ${conciliado.itemImportadoWhatsappId}.`);
    } catch (error) {
      setActionErrorMessage(error instanceof Error ? error.message : 'Falha ao confirmar vinculacao.');
    } finally {
      setLoadingActionId(undefined);
    }
  }

  useEffect(() => {
    void loadData();
  }, [deferredFilters.page, deferredFilters.pageSize, JSON.stringify(deferredFilters)]);

  return (
    <Space orientation="vertical" size={24} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={4}>Conciliacao</Typography.Title>
        <Typography.Paragraph>
          Associe manualmente itens de extrato importados com movimentacoes bancarias sugeridas pelo sistema.
        </Typography.Paragraph>
      </div>

      <Space wrap>
        <Input
          placeholder="Buscar por remetente ou descricao do extrato"
          value={filters.search ?? ''}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              page: 1,
              search: event.target.value
            }))
          }
          style={{ width: 300 }}
        />
        <Select
          options={statusOptions}
          value={filters.statusConciliacaoCodigo ?? ''}
          onChange={(value: StatusConciliacaoCodigo | '') =>
            setFilters((current) => ({
              ...current,
              page: 1,
              statusConciliacaoCodigo: value || ''
            }))
          }
          style={{ width: 220 }}
        />
      </Space>

      {lastActionMessage ? <Typography.Text type="success">{lastActionMessage}</Typography.Text> : null}
      {actionErrorMessage ? <Typography.Text type="danger">{actionErrorMessage}</Typography.Text> : null}

      <AppDataTable<ConciliacaoItem>
        rowKey="itemImportadoWhatsappId"
        loading={loading}
        errorMessage={errorMessage}
        emptyMessage="Nenhum item de extrato pronto para conciliacao."
        onRetry={loadData}
        dataSource={data?.items ?? []}
        columns={columns}
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

function formatarMoeda(value: number | null) {
  if (value === null) {
    return 'Sem valor';
  }

  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function formatarCandidata(candidata: ConciliacaoMovimentacaoCandidata) {
  return `${candidata.observacao ?? candidata.tipo} | ${candidata.dataMovimentacao} | ${formatarMoeda(candidata.valor)} | score ${candidata.score}`;
}

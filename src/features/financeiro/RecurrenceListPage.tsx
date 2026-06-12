import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Input, Select, Space, Tag, Typography } from 'antd';
import { CheckCircleFilled, EyeOutlined, SyncOutlined } from '@ant-design/icons';
import { AppDataTable } from '../../components/data/AppDataTable';
import { IconActionButton } from '../../components/data/IconActionButton';
import { financeiroApi } from '../../services/http/financeiro-api';
import { formatCurrencyBRL } from '../../shared/currency';
import { formatDateBR } from '../../shared/date';
import type { RecorrenciaFilters, RecorrenciaListItem, RecorrenciaListSummary } from '../../types/financeiro';

const defaultFilters: RecorrenciaFilters = {
  page: 1,
  pageSize: 20,
  search: '',
  ativa: undefined,
  tipo: undefined,
  dataReferenciaInicial: undefined,
  dataReferenciaFinal: undefined
};

const statusOptions = [
  { label: 'Todos os status', value: '' },
  { label: 'Ativa', value: 'true' },
  { label: 'Pausada', value: 'false' }
];

const tipoOptions = [
  { label: 'Todos os tipos', value: '' },
  { label: 'Receita', value: 'Receber' },
  { label: 'Despesa', value: 'Pagar' }
];

type RecorrenciaDisplayItem = RecorrenciaListItem & {
  tipoFormatted: 'receita' | 'despesa';
  dataProximaOcorrencia?: string | null;
};

function renderStatusBadge(ativa: boolean, statusNome?: string) {
  if (ativa) {
    return (
      <span className="recorrencias-status-badge recurrencias-status-badge--active">
        <CheckCircleFilled />
        {statusNome || 'Ativa'}
      </span>
    );
  }

  return (
    <span className="recorrencias-status-badge recurrencias-status-badge--paused">
      {statusNome || 'Pausada'}
    </span>
  );
}

export function RecurrenceListPage() {
  const [filters, setFilters] = useState<RecorrenciaFilters>(defaultFilters);
  const deferredFilters = useDeferredValue(filters);
  const [data, setData] = useState<Awaited<ReturnType<typeof financeiroApi.recorrencias.listar>>>();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    void loadData();
  }, [deferredFilters.page, deferredFilters.pageSize, JSON.stringify(deferredFilters)]);

  async function loadData() {
    setLoading(true);
    setErrorMessage(undefined);

    try {
      setData(await financeiroApi.recorrencias.listar(deferredFilters));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar recorrências.');
    } finally {
      setLoading(false);
    }
  }

  const recorrencias = useMemo(
    () =>
      (data?.items ?? []).map((item) => ({
        ...item,
        tipoFormatted: item.contaOrigemTipo === 'ContaReceber' ? 'receita' : 'despesa',
        dataProximaOcorrencia: item.ativa ? item.dataInicio : null
      })) satisfies RecorrenciaDisplayItem[],
    [data]
  );

  const resumoGeral = useMemo(() => {
    const totalRegistros = (data?.summary as RecorrenciaListSummary)?.totalRegistros ?? data?.totalItems ?? 0;
    const valorTotal = (data?.summary as RecorrenciaListSummary)?.valorTotal ?? 0;
    const valorReceitas = recorrencias
      .filter((item) => item.contaOrigemTipo === 'ContaReceber')
      .reduce((sum, item) => sum + item.valorLiquido, 0);
    const valorDespesas = recorrencias
      .filter((item) => item.contaOrigemTipo === 'ContaPagar')
      .reduce((sum, item) => sum + item.valorLiquido, 0);
    const countAtivas = recorrencias.filter((item) => item.ativa).length;
    const countPausadas = recorrencias.filter((item) => !item.ativa).length;

    return {
      totalRegistros,
      valorTotal,
      valorReceitas,
      valorDespesas,
      countAtivas,
      countPausadas
    };
  }, [data, recorrencias]);

  return (
    <Space className="recorrencias-page" orientation="vertical" size={28} style={{ width: '100%' }}>
      <section className="recorrencias-page__header">
        <div className="faturas-page__copy">
          <Typography.Text className="faturas-page__eyebrow">Automações</Typography.Text>
          <Typography.Title level={2} className="faturas-page__title">
            Recorrências
          </Typography.Title>
          <Typography.Paragraph className="faturas-page__description">
            Gerencie suas transações automáticas e acompanhe o fluxo previsto.
          </Typography.Paragraph>
        </div>

        <div className="faturas-page__pills">
          <Tag color="green">{resumoGeral.totalRegistros} recorrência(s)</Tag>
          <Tag color="gold">{recorrencias.length} item(ns) na página</Tag>
        </div>
      </section>

      <section className="recorrencias-summary-grid">
        <article className="recorrencias-summary-card recurrencias-summary-card--receita">
          <div className="recorrencias-summary-card__icon">
            <SyncOutlined />
          </div>
          <div>
            <Typography.Text className="recorrencias-summary-card__label">
              Receitas Mensais Previstas
            </Typography.Text>
            <Typography.Title level={2} className="recorrencias-summary-card__value">
              {formatCurrencyBRL(resumoGeral.valorReceitas)}
            </Typography.Title>
          </div>
        </article>

        <article className="recorrencias-summary-card recurrencias-summary-card--despesa">
          <div className="recorrencias-summary-card__icon">
            <SyncOutlined />
          </div>
          <div>
            <Typography.Text className="recorrencias-summary-card__label">
              Despesas Mensais Previstas
            </Typography.Text>
            <Typography.Title level={2} className="recorrencias-summary-card__value">
              {formatCurrencyBRL(resumoGeral.valorDespesas)}
            </Typography.Title>
          </div>
        </article>

        <article className="recorrencias-summary-card recurrencias-summary-card--status">
          <div className="recorrencias-summary-card__status-grid">
            <div className="recorrencias-summary-card__status-item">
              <Typography.Text className="recorrencias-summary-card__status-label">Ativas</Typography.Text>
              <Typography.Title level={2} className="recorrencias-summary-card__status-value">
                {resumoGeral.countAtivas}
              </Typography.Title>
            </div>
            <div className="recorrencias-summary-card__status-divider" />
            <div className="recorrencias-summary-card__status-item">
              <Typography.Text className="recorrencias-summary-card__status-label">Pausadas</Typography.Text>
              <Typography.Title level={2} className="recorrencias-summary-card__status-value">
                {resumoGeral.countPausadas}
              </Typography.Title>
            </div>
            <div className="recorrencias-summary-card__status-divider" />
            <div className="recorrencias-summary-card__status-item">
              <Typography.Text className="recorrencias-summary-card__status-label">Total</Typography.Text>
              <Typography.Title level={2} className="recorrencias-summary-card__status-value">
                {resumoGeral.totalRegistros}
              </Typography.Title>
            </div>
          </div>
        </article>
      </section>

      <section className="faturas-history-shell">
        <div className="faturas-history-shell__header">
          <div>
            <Typography.Title level={3} className="faturas-history-shell__title">
              Transações Recorrentes
            </Typography.Title>
            <Typography.Paragraph className="faturas-history-shell__description">
              Liste e filtre suas automações financeiras cadastradas no sistema.
            </Typography.Paragraph>
          </div>

          <div className="faturas-history-shell__summary">
            <Tag color="green">Receitas {formatCurrencyBRL(resumoGeral.valorReceitas)}</Tag>
            <Tag color="red">Despesas {formatCurrencyBRL(resumoGeral.valorDespesas)}</Tag>
          </div>
        </div>

        <div className="faturas-filter-grid">
          <Input
            aria-label="Busca de recorrências"
            className="faturas-filter-grid__search"
            placeholder="Buscar por descrição ou pessoa"
            value={filters.search ?? ''}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                page: 1,
                search: event.target.value
              }))
            }
          />

          <Select
            aria-label="Tipo"
            placeholder="Tipo"
            allowClear
            value={filters.tipo}
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                page: 1,
                tipo: value || undefined
              }))
            }
            options={tipoOptions.map((option) => ({ label: option.label, value: option.value }))}
          />

          <Select
            aria-label="Status"
            placeholder="Status"
            allowClear
            value={filters.ativa}
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                page: 1,
                ativa: value
              }))
            }
            options={statusOptions.map((option) => ({ label: option.label, value: option.value === 'true' ? true : option.value === 'false' ? false : undefined }))}
          />
        </div>

        <div className="faturas-history-shell__table">
          <AppDataTable
            rowKey="id"
            loading={loading}
            errorMessage={errorMessage}
            emptyMessage="Nenhuma recorrência encontrada."
            onRetry={loadData}
            dataSource={recorrencias}
            columns={[
              {
                title: 'Descrição',
                dataIndex: 'descricao',
                key: 'descricao',
                sorter: true,
                render: (value: string, record: RecorrenciaDisplayItem) => (
                  <div className="faturas-table-cell">
                    <Typography.Text className="faturas-table-cell__primary">{String(value)}</Typography.Text>
                    <Typography.Text className="faturas-table-cell__secondary">
                      {record.contaOrigemTipo === 'ContaReceber' ? 'Receita' : 'Despesa'}
                    </Typography.Text>
                  </div>
                )
              },
              {
                title: 'Pessoa',
                dataIndex: 'pessoaNome',
                key: 'pessoaNome',
                sorter: true,
                render: (value: string) => (
                  <span className="faturas-table-cell__muted">{String(value)}</span>
                )
              },
              {
                title: 'Valor',
                dataIndex: 'valorLiquido',
                key: 'valorLiquido',
                sorter: true,
                render: (value: number, record: RecorrenciaDisplayItem) => (
                  <span
                    className={`faturas-table-value ${record.tipoFormatted === 'receita' ? 'faturas-table-value--receita' : 'faturas-table-value--despesa'}`}
                  >
                    {record.tipoFormatted === 'despesa' ? '- ' : '+ '}
                    {formatCurrencyBRL(Number(value))}
                  </span>
                )
              },
              {
                title: 'Dia',
                dataIndex: 'diaOrdemMensal',
                key: 'diaOrdemMensal',
                align: 'center',
                render: (value: number) => <span>{value}º dia</span>
              },
              {
                title: 'Início',
                dataIndex: 'dataInicio',
                key: 'dataInicio',
                sorter: true,
                render: (value: string) => <span className="faturas-table-cell__muted">{formatDateBR(String(value))}</span>
              },
              {
                title: 'Status',
                dataIndex: 'ativa',
                key: 'ativa',
                sorter: true,
                render: (value: boolean, record: RecorrenciaDisplayItem) => renderStatusBadge(value, record.ativa ? 'Ativa' : 'Pausada')
              },
              {
                title: 'Ações',
                key: 'acoes',
                width: 116,
                align: 'right',
                render: (_value, record: RecorrenciaDisplayItem) => (
                  <div className="faturas-table-action">
                    <IconActionButton
                      label="Detalhar"
                      icon={<EyeOutlined />}
                      href={`/recorrencias/${record.id}`}
                      type="text"
                    />
                  </div>
                )
              }
            ]}
            onTableChange={(pagination, _f, sorter) => {
              const s = Array.isArray(sorter) ? sorter[0] : sorter;
              const sortKey =
                typeof s?.columnKey === 'string'
                  ? s.columnKey
                  : typeof s?.field === 'string'
                    ? s.field
                    : undefined;
              setFilters((current) => ({
                ...current,
                page: pagination.current ?? current.page,
                pageSize: pagination.pageSize ?? current.pageSize,
                sortBy: sortKey,
                sortDirection: s?.order === 'ascend' ? 'Asc' : s?.order === 'descend' ? 'Desc' : undefined
              }));
            }}
            pagination={{
              current: data?.page ?? filters.page,
              pageSize: data?.pageSize ?? filters.pageSize,
              total: data?.totalItems ?? 0
            }}
          />
        </div>
      </section>
    </Space>
  );
}

export default RecurrenceListPage;
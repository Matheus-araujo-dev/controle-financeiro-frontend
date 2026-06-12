import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Alert, Input, Select, Space, Tag, Typography } from 'antd';
import { CheckCircleFilled, CreditCardOutlined, EyeOutlined, WalletOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { AppDataTable } from '../../components/data/AppDataTable';
import { IconActionButton } from '../../components/data/IconActionButton';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { financeiroApi } from '../../services/http/financeiro-api';
import { formatCurrencyBRL } from '../../shared/currency';
import { formatDateBR, formatMonthYearBR } from '../../shared/date';
import type { CartaoResumo } from '../../types/cadastros';
import type { FaturaFilters, FaturaResumo, StatusFaturaCodigo } from '../../types/financeiro';

const defaultFilters: FaturaFilters = {
  page: 1,
  pageSize: 20,
  search: '',
  competencia: '',
  cartaoId: undefined,
  statusCodigo: undefined,
  dataVencimentoInicial: undefined,
  dataVencimentoFinal: undefined,
  dataFechamentoInicial: undefined,
  dataFechamentoFinal: undefined
};

const statusOptions = [
  { label: 'Todos os status', value: '' },
  { label: 'Aberta', value: 'ABERTA' },
  { label: 'Paga', value: 'PAGA' }
] as const;

type CardHighlight = {
  cartaoId: string;
  cartaoNome: string;
  bandeira?: string;
  numeroFinal?: string;
  valorAtual: number;
  quantidadeFaturas: number;
  dataFechamento?: string;
  dataVencimento?: string;
  competencia?: string;
  statusCodigo?: StatusFaturaCodigo;
  statusNome?: string;
  limiteDisponivel?: number | null;
  limiteBase?: number | null;
  percentualComprometido: number;
};

function normalizeCompetenciaInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 6);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function competenciaInputToApi(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 6) {
    return undefined;
  }

  return `${digits.slice(2, 6)}-${digits.slice(0, 2)}`;
}

function competenciaApiToInput(value?: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(value ?? '');
  if (!match) {
    return '';
  }

  return `${match[2]}/${match[1]}`;
}

function buildInitialFilters(searchParams: URLSearchParams): FaturaFilters {
  return {
    ...defaultFilters,
    cartaoId: searchParams.get('cartaoId') || undefined,
    competencia: searchParams.get('competencia') || ''
  };
}

function getLimitBase(cartao?: CartaoResumo) {
  return cartao?.limiteEfetivo ?? cartao?.limiteCredito ?? null;
}

function getLimitAvailable(cartao?: CartaoResumo) {
  const limiteBase = getLimitBase(cartao);

  if (!cartao) {
    return null;
  }

  if (cartao.limiteDisponivel !== null) {
    return cartao.limiteDisponivel;
  }

  if (limiteBase === null) {
    return null;
  }

  return Math.max(0, limiteBase - cartao.limiteComprometido);
}

function getCommittedPercent(cartao?: CartaoResumo) {
  const limiteBase = getLimitBase(cartao);
  const limiteDisponivel = getLimitAvailable(cartao);

  if (!limiteBase || limiteBase <= 0 || limiteDisponivel === null) {
    return 0;
  }

  return Math.min(100, Math.max(0, ((limiteBase - limiteDisponivel) / limiteBase) * 100));
}

function getPreferredInvoice(invoices: FaturaResumo[]) {
  return [...invoices].sort((left, right) => {
    const leftPriority = left.statusCodigo === 'ABERTA' ? 0 : 1;
    const rightPriority = right.statusCodigo === 'ABERTA' ? 0 : 1;

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    return left.dataVencimento.localeCompare(right.dataVencimento);
  })[0];
}

function getStatusTone(statusCodigo?: StatusFaturaCodigo) {
  return statusCodigo === 'ABERTA' ? 'faturas-status-badge--open' : 'faturas-status-badge--paid';
}

function renderStatusBadge(statusCodigo: StatusFaturaCodigo, statusNome: string) {
  if (statusCodigo === 'PAGA') {
    return (
      <span className={`faturas-status-badge ${getStatusTone(statusCodigo)}`}>
        <CheckCircleFilled />
        {statusNome}
      </span>
    );
  }

  return <span className={`faturas-status-badge ${getStatusTone(statusCodigo)}`}>{statusNome}</span>;
}

export function FaturasPage() {
  const [searchParams] = useSearchParams();
  const initialFilters = useMemo(() => buildInitialFilters(searchParams), [searchParams]);
  const [filters, setFilters] = useState<FaturaFilters>(initialFilters);
  const deferredFilters = useDeferredValue(filters);
  const [competenciaInput, setCompetenciaInput] = useState(() => competenciaApiToInput(initialFilters.competencia));
  const [data, setData] = useState<Awaited<ReturnType<typeof financeiroApi.faturas.listar>>>();
  const [cartoes, setCartoes] = useState<CartaoResumo[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const origemContaCartao = searchParams.get('origem') === 'conta-cartao';

  useEffect(() => {
    setFilters(initialFilters);
    setCompetenciaInput(competenciaApiToInput(initialFilters.competencia));
  }, [initialFilters]);

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

  useEffect(() => {
    void (async () => {
      const response = await cadastrosApi.cartoes.listar({
        page: 1,
        pageSize: 200,
        search: '',
        ativo: true
      });
      setCartoes(response.items);
    })();
  }, []);

  const cartoesById = useMemo(
    () => new Map(cartoes.map((cartao) => [cartao.id, cartao])),
    [cartoes]
  );

  const resumoGeral = useMemo(() => {
    const totalRegistros = data?.summary?.totalRegistros ?? data?.totalItems ?? 0;
    const valorTotal = data?.summary?.valorTotal ?? 0;
    const valorMedio = totalRegistros > 0 ? valorTotal / totalRegistros : 0;
    const proximaFatura =
      [...(data?.items ?? [])]
        .filter((item) => item.statusCodigo === 'ABERTA')
        .sort((left, right) => left.dataVencimento.localeCompare(right.dataVencimento))[0] ??
      [...(data?.items ?? [])].sort((left, right) => left.dataVencimento.localeCompare(right.dataVencimento))[0];
    const limiteTotalDisponivel = cartoes.reduce((total, cartao) => total + (getLimitAvailable(cartao) ?? 0), 0);

    return {
      totalRegistros,
      valorTotal,
      valorMedio,
      itensPagina: data?.items.length ?? 0,
      proximaFatura,
      limiteTotalDisponivel
    };
  }, [cartoes, data]);

  const destaqueCartoes = useMemo(() => {
    const invoicesByCard = new Map<string, FaturaResumo[]>();

    for (const item of data?.items ?? []) {
      const current = invoicesByCard.get(item.cartaoId) ?? [];
      current.push(item);
      invoicesByCard.set(item.cartaoId, current);
    }

    return (data?.summary?.porCartao ?? [])
      .map((group) => {
        const cartao = cartoesById.get(group.chave);
        const preferredInvoice = getPreferredInvoice(invoicesByCard.get(group.chave) ?? []);

        return {
          cartaoId: group.chave,
          cartaoNome: group.label,
          bandeira: cartao?.bandeira,
          numeroFinal: cartao?.numeroFinal,
          valorAtual: preferredInvoice?.valorTotal ?? group.valorTotal,
          quantidadeFaturas: group.quantidadeFaturas,
          dataFechamento: preferredInvoice?.dataFechamento,
          dataVencimento: preferredInvoice?.dataVencimento,
          competencia: preferredInvoice?.competencia,
          statusCodigo: preferredInvoice?.statusCodigo,
          statusNome: preferredInvoice?.statusNome,
          limiteDisponivel: getLimitAvailable(cartao),
          limiteBase: getLimitBase(cartao),
          percentualComprometido: getCommittedPercent(cartao)
        } satisfies CardHighlight;
      })
      .slice(0, 2);
  }, [cartoesById, data]);

  return (
    <Space className="faturas-page" orientation="vertical" size={28} style={{ width: '100%' }}>
      <section className="faturas-page__header">
        <div className="faturas-page__copy">
          <Typography.Text className="faturas-page__eyebrow">Controle de crédito</Typography.Text>
          <Typography.Title level={2} className="faturas-page__title">
            Faturas de cartão
          </Typography.Title>
          <Typography.Paragraph className="faturas-page__description">
            Gerencie competências, acompanhe a pressão por cartão e navegue pelo histórico consolidado das faturas.
          </Typography.Paragraph>
        </div>

        <div className="faturas-page__pills">
          <Tag color="green">{resumoGeral.totalRegistros} fatura(s)</Tag>
          <Tag color="gold">{resumoGeral.itensPagina} item(ns) na página</Tag>
          <Tag color="gold">{formatCurrencyBRL(resumoGeral.valorMedio)} ticket médio</Tag>
        </div>
      </section>

      {origemContaCartao ? (
        <Alert
          type="success"
          showIcon
          message="Compra no cartão localizada na fatura filtrada"
          description="O filtro já foi ajustado para o cartão e a competência previstos no lançamento salvo."
        />
      ) : null}

      <section className="faturas-highlight-grid">
        {destaqueCartoes.map((card, index) => (
          <article
            key={card.cartaoId}
            className={`faturas-highlight-card ${index === 0 ? 'faturas-highlight-card--accent' : ''}`}
          >
            <div className="faturas-highlight-card__halo" aria-hidden="true" />

            <div className="faturas-highlight-card__top">
              <div>
                <Typography.Text className="faturas-highlight-card__eyebrow">
                  {card.bandeira ? `${card.bandeira} • ${card.quantidadeFaturas} fatura(s)` : `${card.quantidadeFaturas} fatura(s)`}
                </Typography.Text>
                <Typography.Title level={3} className="faturas-highlight-card__title">
                  {card.cartaoNome}
                </Typography.Title>
              </div>
              <span className="faturas-highlight-card__icon">
                <CreditCardOutlined />
              </span>
            </div>

            <div className="faturas-highlight-card__value-row">
              <div>
                <Typography.Text className="faturas-highlight-card__label">
                  {card.statusCodigo === 'ABERTA' ? 'Fatura atual' : 'Valor no recorte'}
                </Typography.Text>
                <Typography.Title level={2} className="faturas-highlight-card__value">
                  {formatCurrencyBRL(card.valorAtual)}
                </Typography.Title>
              </div>
              {card.numeroFinal ? (
                <Typography.Text className="faturas-highlight-card__final">
                  •••• {card.numeroFinal}
                </Typography.Text>
              ) : null}
            </div>

            <div className="faturas-highlight-card__meta-grid">
              <div>
                <Typography.Text className="faturas-highlight-card__meta-label">Competência</Typography.Text>
                <Typography.Text className="faturas-highlight-card__meta-value">
                  {card.competencia ? formatMonthYearBR(card.competencia) : 'Sem fatura visível'}
                </Typography.Text>
              </div>
              <div>
                <Typography.Text className="faturas-highlight-card__meta-label">Vencimento</Typography.Text>
                <Typography.Text className="faturas-highlight-card__meta-value">
                  {card.dataVencimento ? formatDateBR(card.dataVencimento) : 'Não informado'}
                </Typography.Text>
              </div>
            </div>

            <div className="faturas-highlight-card__limit-shell">
              <div className="faturas-highlight-card__limit-header">
                <Typography.Text className="faturas-highlight-card__meta-label">Limite disponível</Typography.Text>
                <Typography.Text className="faturas-highlight-card__limit-value">
                  {card.limiteDisponivel !== null && card.limiteDisponivel !== undefined
                    ? formatCurrencyBRL(card.limiteDisponivel)
                    : 'Indisponível'}
                </Typography.Text>
              </div>
              <div className="faturas-highlight-card__track" aria-hidden="true">
                <span style={{ width: `${Math.max(8, card.percentualComprometido)}%` }} />
              </div>
              <div className="faturas-highlight-card__meta-grid">
                <div>
                  <Typography.Text className="faturas-highlight-card__meta-label">Fechamento</Typography.Text>
                  <Typography.Text className="faturas-highlight-card__meta-value">
                    {card.dataFechamento ? formatDateBR(card.dataFechamento) : 'Não informado'}
                  </Typography.Text>
                </div>
                <div>
                  <Typography.Text className="faturas-highlight-card__meta-label">Status</Typography.Text>
                  <div>
                    {card.statusCodigo && card.statusNome
                      ? renderStatusBadge(card.statusCodigo, card.statusNome)
                      : <span className="faturas-status-badge faturas-status-badge--muted">Sem leitura</span>}
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}

        {!destaqueCartoes.length ? (
          <article className="faturas-highlight-card faturas-highlight-card--empty">
            <div className="faturas-highlight-card__top">
              <div>
                <Typography.Text className="faturas-highlight-card__eyebrow">Sem destaque</Typography.Text>
                <Typography.Title level={3} className="faturas-highlight-card__title">
                  Nenhuma fatura encontrada
                </Typography.Title>
              </div>
              <span className="faturas-highlight-card__icon">
                <CreditCardOutlined />
              </span>
            </div>
            <Typography.Paragraph className="faturas-highlight-card__empty-copy">
              Ajuste os filtros para visualizar cartões com faturas abertas ou histórico no recorte atual.
            </Typography.Paragraph>
          </article>
        ) : null}

        <article className="faturas-total-card">
          <Typography.Text className="faturas-total-card__eyebrow">Total consolidado</Typography.Text>
          <Typography.Title level={1} className="faturas-total-card__value">
            {formatCurrencyBRL(resumoGeral.valorTotal)}
          </Typography.Title>

          <div className="faturas-total-card__stats">
            <div className="faturas-total-card__stat">
              <Typography.Text className="faturas-total-card__stat-label">Vencimento próximo</Typography.Text>
              <Typography.Text className="faturas-total-card__stat-value">
                {resumoGeral.proximaFatura ? formatDateBR(resumoGeral.proximaFatura.dataVencimento) : 'Sem fatura'}
              </Typography.Text>
            </div>
            <div className="faturas-total-card__stat">
              <Typography.Text className="faturas-total-card__stat-label">Limite total disponível</Typography.Text>
              <Typography.Text className="faturas-total-card__stat-value">
                {formatCurrencyBRL(resumoGeral.limiteTotalDisponivel)}
              </Typography.Text>
            </div>
          </div>

          <div className="faturas-total-card__footer">
            <div className="faturas-total-card__footer-item">
              <WalletOutlined />
              <span>{resumoGeral.totalRegistros} competência(s) filtradas</span>
            </div>
            <div className="faturas-total-card__footer-item">
              <CreditCardOutlined />
              <span>{destaqueCartoes.length || cartoes.length} cartão(ões) monitorados</span>
            </div>
          </div>
        </article>
      </section>

      <section className="faturas-history-shell">
        <div className="faturas-history-shell__header">
          <div>
            <Typography.Title level={3} className="faturas-history-shell__title">
              Histórico de faturas
            </Typography.Title>
            <Typography.Paragraph className="faturas-history-shell__description">
              Navegue pelas competências, refine o recorte por cartão e acompanhe o comportamento financeiro por ciclo.
            </Typography.Paragraph>
          </div>

          <div className="faturas-history-shell__summary">
            <Tag color="green">Valor total {formatCurrencyBRL(resumoGeral.valorTotal)}</Tag>
            <Tag color="success">{data?.summary?.porCompetencia.length ?? 0} competência(s)</Tag>
          </div>
        </div>

        <div className="faturas-filter-grid">
          <Input
            aria-label="Busca de faturas"
            className="faturas-filter-grid__search"
            placeholder="Buscar por cartão ou competência"
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
            aria-label="Cartão"
            placeholder="Cartão"
            allowClear
            value={filters.cartaoId}
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                page: 1,
                cartaoId: value || undefined
              }))
            }
            options={cartoes.map((cartao) => ({ label: cartao.nome, value: cartao.id }))}
          />

          <Select
            aria-label="Status da fatura"
            value={filters.statusCodigo ?? ''}
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                page: 1,
                statusCodigo: (value || undefined) as StatusFaturaCodigo | undefined
              }))
            }
            options={statusOptions.map((option) => ({ label: option.label, value: option.value }))}
          />

          <Input
            aria-label="Competência"
            placeholder="Competência (mm/aaaa)"
            value={competenciaInput}
            onChange={(event) => {
              const nextInput = normalizeCompetenciaInput(event.target.value);
              setCompetenciaInput(nextInput);
              setFilters((current) => ({
                ...current,
                page: 1,
                competencia: competenciaInputToApi(nextInput)
              }));
            }}
          />

          <Input
            aria-label="Vencimento inicial"
            type="date"
            value={filters.dataVencimentoInicial ?? ''}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                page: 1,
                dataVencimentoInicial: event.target.value || undefined
              }))
            }
          />

          <Input
            aria-label="Vencimento final"
            type="date"
            value={filters.dataVencimentoFinal ?? ''}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                page: 1,
                dataVencimentoFinal: event.target.value || undefined
              }))
            }
          />

          <Input
            aria-label="Fechamento inicial"
            type="date"
            value={filters.dataFechamentoInicial ?? ''}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                page: 1,
                dataFechamentoInicial: event.target.value || undefined
              }))
            }
          />

          <Input
            aria-label="Fechamento final"
            type="date"
            value={filters.dataFechamentoFinal ?? ''}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                page: 1,
                dataFechamentoFinal: event.target.value || undefined
              }))
            }
          />
        </div>

        <div className="faturas-history-shell__table">
          <AppDataTable
            rowKey="id"
            loading={loading}
            errorMessage={errorMessage}
            emptyMessage="Nenhuma fatura encontrada."
            onRetry={loadData}
            dataSource={data?.items ?? []}
            columns={[
              {
                title: 'Mês/Ano',
                dataIndex: 'competencia',
                key: 'competencia',
                render: (value, record: FaturaResumo) => (
                  <div className="faturas-table-cell">
                    <Typography.Text className="faturas-table-cell__primary">
                      {formatMonthYearBR(String(value))}
                    </Typography.Text>
                    <Typography.Text className="faturas-table-cell__secondary">
                      Fechamento {formatDateBR(record.dataFechamento)}
                    </Typography.Text>
                  </div>
                )
              },
              {
                title: 'Vencimento',
                dataIndex: 'dataVencimento',
                key: 'dataVencimento',
                render: (value) => <span className="faturas-table-cell__muted">{formatDateBR(String(value))}</span>
              },
              {
                title: 'Cartão Principal',
                dataIndex: 'cartaoNome',
                key: 'cartaoNome',
                render: (value, record: FaturaResumo) => {
                  const cartao = cartoesById.get(record.cartaoId);

                  return (
                    <div className="faturas-table-cell">
                      <Typography.Text className="faturas-table-cell__primary">
                        {String(value)}
                        {cartao?.numeroFinal ? ` •••• ${cartao.numeroFinal}` : ''}
                      </Typography.Text>
                      <Typography.Text className="faturas-table-cell__secondary">
                        {record.quantidadeItens} item(ns)
                      </Typography.Text>
                    </div>
                  );
                }
              },
              {
                title: 'Valor Total',
                dataIndex: 'valorTotal',
                key: 'valorTotal',
                render: (value, record: FaturaResumo) => (
                  <span
                    className={`faturas-table-value ${record.statusCodigo === 'ABERTA' ? 'faturas-table-value--accent' : ''}`}
                  >
                    {formatCurrencyBRL(Number(value))}
                  </span>
                )
              },
              {
                title: 'Status',
                dataIndex: 'statusCodigo',
                key: 'statusCodigo',
                render: (_value, record: FaturaResumo) => renderStatusBadge(record.statusCodigo, record.statusNome)
              },
              {
                title: 'Ações',
                key: 'acoes',
                width: 116,
                align: 'right',
                render: (_value, record: FaturaResumo) => (
                  <div className="faturas-table-action">
                    <IconActionButton
                      label="Detalhar"
                      icon={<EyeOutlined />}
                      href={`/faturas/${record.id}`}
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

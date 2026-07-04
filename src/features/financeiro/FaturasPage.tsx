import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { AppDataTable } from '../../components/data/AppDataTable';
import { ExportButton } from '../../components/data/ExportButton';
import { ImportarFaturaModal } from './ImportarFaturaModal';
import { IconActionButton } from '../../components/data/IconActionButton';
import { DateInput } from '../../components/forms/DateInput';
import {
  FilterCard,
  FilterField,
  FilterInputWrapper,
  filterInputClass,
  ListPageShell,
  MultiSelectFilter,
  SummaryCard
} from '../../components/layout';
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

const statusOptions: Array<{ label: string; value: StatusFaturaCodigo }> = [
  { label: 'Aberta', value: 'ABERTA' },
  { label: 'Paga', value: 'PAGA' }
];

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

function toArrayFilter<T>(value?: T | T[]) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
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

function StatusBadge({ codigo, nome }: { codigo: StatusFaturaCodigo; nome: string }) {
  const paga = codigo === 'PAGA';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${
        paga ? 'bg-primary/15 text-primary' : 'bg-amber-400/15 text-amber-400'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${paga ? 'bg-primary' : 'bg-amber-400'}`} />
      {nome}
    </span>
  );
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
  const [importarModalOpen, setImportarModalOpen] = useState(false);
  const origemContaCartao = searchParams.get('origem') === 'conta-cartao';

  useEffect(() => {
    setFilters(initialFilters);
    setCompetenciaInput(competenciaApiToInput(initialFilters.competencia));
  }, [initialFilters]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(undefined);

    try {
      setData(await financeiroApi.faturas.listar(deferredFilters));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar faturas.');
    } finally {
      setLoading(false);
    }
  }, [deferredFilters]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

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

  const cartoesById = useMemo(() => new Map(cartoes.map((cartao) => [cartao.id, cartao])), [cartoes]);

  const resumoGeral = useMemo(() => {
    const totalRegistros = data?.summary?.totalRegistros ?? data?.totalItems ?? 0;
    const valorTotal = data?.summary?.valorTotal ?? 0;
    const proximaFatura =
      [...(data?.items ?? [])]
        .filter((item) => item.statusCodigo === 'ABERTA')
        .sort((left, right) => left.dataVencimento.localeCompare(right.dataVencimento))[0] ??
      [...(data?.items ?? [])].sort((left, right) => left.dataVencimento.localeCompare(right.dataVencimento))[0];
    const limiteTotalDisponivel = cartoes.reduce((total, cartao) => total + (getLimitAvailable(cartao) ?? 0), 0);
    const cartoesMonitorados = data?.summary?.porCartao.length ?? 0;

    return {
      totalRegistros,
      valorTotal,
      proximaFatura,
      limiteTotalDisponivel,
      cartoesMonitorados
    };
  }, [cartoes, data]);

  // Cartão selecionado no filtro (para pré-selecionar no modal de importação)
  const cartaoIdFiltrado = useMemo((): string | undefined => {
    const rawId = filters.cartaoId;
    const rawIds = filters.cartaoIds;
    const ids: string[] = Array.isArray(rawIds) ? rawIds : Array.isArray(rawId) ? rawId : rawId ? [rawId] : [];
    return ids.length === 1 ? ids[0] : undefined;
  }, [filters.cartaoId, filters.cartaoIds]);

  return (
    <>
    <ImportarFaturaModal
      open={importarModalOpen}
      onClose={() => setImportarModalOpen(false)}
      onSuccess={() => { void loadData(); }}
      initialCartaoId={cartaoIdFiltrado}
    />
    <ListPageShell
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setImportarModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary/15 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/25"
          >
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>upload_file</span>
            Importar PDF
          </button>
          <ExportButton
            fetchPage={financeiroApi.faturas.listar}
            filters={filters}
            filename="faturas"
            columns={[
              { header: 'Competência', value: (f: FaturaResumo) => formatMonthYearBR(f.competencia) },
              { header: 'Vencimento', value: (f: FaturaResumo) => formatDateBR(f.dataVencimento) },
              { header: 'Fechamento', value: (f: FaturaResumo) => formatDateBR(f.dataFechamento) },
              { header: 'Cartão', value: (f: FaturaResumo) => f.cartaoNome },
              { header: 'Itens', value: (f: FaturaResumo) => f.quantidadeItens },
              { header: 'Valor total', value: (f: FaturaResumo) => f.valorTotal },
              { header: 'Status', value: (f: FaturaResumo) => f.statusNome }
            ]}
          />
        </div>
      }
      summaryColumns={4}
      summary={
        <>
          <SummaryCard
            label="Total consolidado"
            value={formatCurrencyBRL(resumoGeral.valorTotal)}
            accent="primary"
            highlight
          />
          <SummaryCard
            label="Próximo vencimento"
            value={resumoGeral.proximaFatura ? formatDateBR(resumoGeral.proximaFatura.dataVencimento) : '—'}
          />
          <SummaryCard
            label="Limite disponível"
            value={formatCurrencyBRL(resumoGeral.limiteTotalDisponivel)}
            accent="primary"
          />
          <SummaryCard
            label="Faturas filtradas"
            value={resumoGeral.totalRegistros}
            footer={`${resumoGeral.cartoesMonitorados || cartoes.length} cartão(ões) monitorados`}
          />
        </>
      }
      filters={
        <FilterCard>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FilterField label="Busca">
              <FilterInputWrapper icon={<SearchOutlined />}>
                <input
                  aria-label="Busca de faturas"
                  placeholder="Buscar por cartão ou competência..."
                  value={filters.search ?? ''}
                  onChange={(e) => setFilters((f) => ({ ...f, page: 1, search: e.target.value }))}
                  className={filterInputClass}
                />
              </FilterInputWrapper>
            </FilterField>
            <FilterField label="Cartão">
              <MultiSelectFilter
                ariaLabel="Cartão"
                options={[
                  ...cartoes.map((cartao) => ({ label: cartao.nome, value: cartao.id }))
                ]}
                value={toArrayFilter(filters.cartaoIds ?? filters.cartaoId)}
                onChange={(next) =>
                  setFilters((f) => ({
                    ...f,
                    page: 1,
                    cartaoId: undefined,
                    cartaoIds: next.length ? next : undefined
                  }))
                }
              />
            </FilterField>
            <FilterField label="Status">
              <MultiSelectFilter
                ariaLabel="Status da fatura"
                options={statusOptions}
                value={toArrayFilter(filters.statusCodigos ?? filters.statusCodigo)}
                onChange={(next) =>
                  setFilters((f) => ({
                    ...f,
                    page: 1,
                    statusCodigo: undefined,
                    statusCodigos: next.length ? (next as StatusFaturaCodigo[]) : undefined
                  }))
                }
              />
            </FilterField>
            <FilterField label="Competência">
              <FilterInputWrapper>
                <input
                  aria-label="Competência"
                  placeholder="mm/aaaa"
                  value={competenciaInput}
                  onChange={(e) => {
                    const next = normalizeCompetenciaInput(e.target.value);
                    setCompetenciaInput(next);
                    setFilters((f) => ({ ...f, page: 1, competencia: competenciaInputToApi(next) }));
                  }}
                  className={filterInputClass}
                />
              </FilterInputWrapper>
            </FilterField>
            <FilterField label="Vencimento de">
              <DateInput
                compact
                ariaLabel="Vencimento inicial"
                value={filters.dataVencimentoInicial ?? ''}
                onChange={(value) => setFilters((f) => ({ ...f, page: 1, dataVencimentoInicial: value || undefined }))}
              />
            </FilterField>
            <FilterField label="Vencimento até">
              <DateInput
                compact
                ariaLabel="Vencimento final"
                value={filters.dataVencimentoFinal ?? ''}
                onChange={(value) => setFilters((f) => ({ ...f, page: 1, dataVencimentoFinal: value || undefined }))}
              />
            </FilterField>
            <FilterField label="Fechamento de">
              <DateInput
                compact
                ariaLabel="Fechamento inicial"
                value={filters.dataFechamentoInicial ?? ''}
                onChange={(value) => setFilters((f) => ({ ...f, page: 1, dataFechamentoInicial: value || undefined }))}
              />
            </FilterField>
            <FilterField label="Fechamento até">
              <DateInput
                compact
                ariaLabel="Fechamento final"
                value={filters.dataFechamentoFinal ?? ''}
                onChange={(value) => setFilters((f) => ({ ...f, page: 1, dataFechamentoFinal: value || undefined }))}
              />
            </FilterField>
          </div>
        </FilterCard>
      }
    >
      {origemContaCartao ? (
        <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-primary">
          <p className="text-sm font-semibold">Compra no cartão localizada na fatura filtrada</p>
          <p className="mt-0.5 text-xs text-on-surface-variant">
            O filtro já foi ajustado para o cartão e a competência previstos no lançamento salvo.
          </p>
        </div>
      ) : null}

      <div className="bg-surface-container-low rounded-3xl overflow-hidden border border-white/5">
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
              sorter: true,
              render: (value, record: FaturaResumo) => (
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-white">{formatMonthYearBR(String(value))}</span>
                  <span className="text-xs text-on-surface-variant">Fechamento {formatDateBR(record.dataFechamento)}</span>
                </div>
              )
            },
            {
              title: 'Vencimento',
              dataIndex: 'dataVencimento',
              key: 'dataVencimento',
              sorter: true,
              render: (value) => <span className="text-sm text-on-surface-variant">{formatDateBR(String(value))}</span>
            },
            {
              title: 'Cartão Principal',
              dataIndex: 'cartaoNome',
              key: 'cartaoNome',
              sorter: true,
              render: (value, record: FaturaResumo) => {
                const cartao = cartoesById.get(record.cartaoId);

                return (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-white">
                      {String(value)}
                      {cartao?.numeroFinal ? ` •••• ${cartao.numeroFinal}` : ''}
                    </span>
                    <span className="text-xs text-on-surface-variant">{record.quantidadeItens} item(ns)</span>
                  </div>
                );
              }
            },
            {
              title: 'Valor Total',
              dataIndex: 'valorTotal',
              key: 'valorTotal',
              align: 'right',
              sorter: true,
              render: (value, record: FaturaResumo) => (
                <span
                  className={`text-sm font-headline font-bold ${
                    record.statusCodigo === 'ABERTA' ? 'text-primary' : 'text-white'
                  }`}
                >
                  {formatCurrencyBRL(Number(value))}
                </span>
              )
            },
            {
              title: 'Status',
              dataIndex: 'statusCodigo',
              key: 'statusCodigo',
              sorter: true,
              render: (_value, record: FaturaResumo) => (
                <StatusBadge codigo={record.statusCodigo} nome={record.statusNome} />
              )
            },
            {
              title: 'Ações',
              key: 'acoes',
              width: 116,
              align: 'right',
              render: (_value, record: FaturaResumo) => (
                <IconActionButton label="Detalhar" icon={<EyeOutlined />} href={`/faturas/${record.id}`} type="text" />
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
    </ListPageShell>
    </>
  );
}

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { usePersistedFilters } from '../../hooks/usePersistedFilters';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { AppDataTable } from '../../components/data/AppDataTable';
import { Button } from '../../components/ui/Button';
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
  cartaoId: undefined,
  competencias: undefined,
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

function generateCompetenciaOptions() {
  const options: Array<{ value: string; label: string }> = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    options.push({ value: `${year}-${month}`, label: `${month}/${year}` });
  }
  return options;
}

const competenciaOptions = generateCompetenciaOptions();

function buildInitialFilters(searchParams: URLSearchParams): FaturaFilters {
  const competencia = searchParams.get('competencia');
  return {
    ...defaultFilters,
    cartaoId: searchParams.get('cartaoId') || undefined,
    competencias: competencia ? [competencia] : undefined
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
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [importarModalOpen, setImportarModalOpen] = useState(false);
  const origemContaCartao = searchParams.get('origem') === 'conta-cartao';

  const urlOverrides = useMemo(() => {
    const competencia = searchParams.get('competencia');
    const cartaoId = searchParams.get('cartaoId');
    return (competencia || cartaoId)
      ? { cartaoId: cartaoId || undefined, competencias: competencia ? [competencia] : undefined }
      : undefined;
  }, [searchParams]);

  const { filters, setFilters, clearFilters, isModified } = usePersistedFilters(
    'filters:faturas',
    defaultFilters,
    urlOverrides
  );
  const deferredFilters = useDeferredValue(filters);

  // Atualiza filtros quando URL muda (deep-link vindo do dashboard)
  useEffect(() => {
    if (!urlOverrides) return;
    setFilters((prev) => ({ ...prev, ...urlOverrides }));
  }, [urlOverrides]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data, isFetching, error } = useQuery({
    queryKey: ['faturas', 'list', deferredFilters],
    queryFn: () => financeiroApi.faturas.listar(deferredFilters),
    staleTime: 30_000,
    placeholderData: (prev) => prev
  });

  const { data: cartoesData } = useQuery({
    queryKey: ['cartoes', 'options'],
    queryFn: () => cadastrosApi.cartoes.listar({ page: 1, pageSize: 200, search: '', ativo: true }),
    staleTime: 5 * 60_000
  });

  const cartoes = cartoesData?.items ?? [];
  const errorMessage = error instanceof Error ? error.message : error ? 'Falha ao carregar faturas.' : undefined;

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
      onSuccess={() => { void queryClient.invalidateQueries({ queryKey: ['faturas', 'list'] }); }}
      initialCartaoId={cartaoIdFiltrado}
    />
    <ListPageShell
      actions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={<span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>upload_file</span>}
            onClick={() => setImportarModalOpen(true)}
          >
            Importar PDF
          </Button>
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
        <FilterCard onClear={isModified ? clearFilters : undefined}>
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
              <MultiSelectFilter
                ariaLabel="Competência"
                options={competenciaOptions}
                value={filters.competencias ?? []}
                onChange={(next) =>
                  setFilters((f) => ({
                    ...f,
                    page: 1,
                    competencias: next.length ? next : undefined
                  }))
                }
              />
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
          loading={isFetching}
          errorMessage={errorMessage}
          emptyMessage="Nenhuma fatura encontrada."
          onRetry={() => void queryClient.invalidateQueries({ queryKey: ['faturas', 'list'] })}
          dataSource={data?.items ?? []}
          columns={[
            {
              title: 'Mês/Ano',
              dataIndex: 'competencia',
              key: 'competencia',
              sorter: true,
              mobileRole: 'title',
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
              mobileRole: 'date',
              render: (value) => <span className="text-sm text-on-surface-variant">{formatDateBR(String(value))}</span>
            },
            {
              title: 'Cartão Principal',
              dataIndex: 'cartaoNome',
              key: 'cartaoNome',
              sorter: true,
              mobileRole: 'subtitle',
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
              mobileRole: 'value',
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
              mobileRole: 'status',
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

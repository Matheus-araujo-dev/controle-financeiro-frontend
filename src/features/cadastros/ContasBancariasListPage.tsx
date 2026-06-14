import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { BankOutlined, EditOutlined, HistoryOutlined, PlusOutlined, SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { PageState } from '../../components/states/PageState';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { formatCurrencyBRL } from '../../shared/currency';
import type { ContaBancariaFilters, ContaBancariaResumo } from '../../types/cadastros';
import { contasBancariasModuleConfig } from './module-config';

type ContasBancariasListFilters = ContaBancariaFilters;
type QuickTypeFilter = '' | 'Corrente' | 'Poupanca' | 'Investimento';

const defaultFilters: ContasBancariasListFilters = {
  ...contasBancariasModuleConfig.defaultFilters
};

const quickTypeOptions: Array<{ label: string; value: QuickTypeFilter }> = [
  { label: 'Todas', value: '' },
  { label: 'Corrente', value: 'Corrente' },
  { label: 'Poupanca', value: 'Poupanca' },
  { label: 'Investimento', value: 'Investimento' }
];

function normalizeStatusValue(value: string) {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
}

function normalizeTipoConta(value?: string | null) {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return '';
  }

  if (normalized.includes('corr')) {
    return 'Corrente';
  }

  if (normalized.includes('poup')) {
    return 'Poupanca';
  }

  if (normalized.includes('invest')) {
    return 'Investimento';
  }

  return value?.trim() ?? '';
}

function getBankMonogram(bank?: string | null) {
  if (!bank) {
    return 'BK';
  }

  const parts = bank
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return 'BK';
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
}

function getAccountIdentification(record: ContaBancariaResumo) {
  if (record.agencia && record.numeroConta) {
    return `${record.agencia} / ${record.numeroConta}`;
  }

  return record.numeroConta ?? record.agencia ?? 'Sem numeracao';
}

function getSharedLimit(record: ContaBancariaResumo) {
  return record.limiteCartoesCompartilhado ?? 0;
}

function getAvailableLimit(record: ContaBancariaResumo) {
  if (record.limiteCartoesDisponivel !== null) {
    return record.limiteCartoesDisponivel;
  }

  return getSharedLimit(record) - record.limiteCartoesComprometido;
}

function getStatusTone(record: ContaBancariaResumo) {
  if (!record.ativo) {
    return 'inactive';
  }

  if (getAvailableLimit(record) < 0) {
    return 'alert';
  }

  return 'active';
}

function getStatusLabel(record: ContaBancariaResumo) {
  const tone = getStatusTone(record);

  if (tone === 'inactive') {
    return 'Inativa';
  }

  if (tone === 'alert') {
    return 'Alerta';
  }

  return 'Ativa';
}

function getStatusBadgeClass(record: ContaBancariaResumo) {
  const tone = getStatusTone(record);

  if (tone === 'active') {
    return 'border border-primary/20 bg-primary/10 text-primary';
  }

  if (tone === 'alert') {
    return 'border border-red-400/20 bg-red-500/10 text-red-300';
  }

  return 'border border-white/8 bg-white/[0.04] text-on-surface-variant';
}

function getAvailableValueClass(record: ContaBancariaResumo) {
  return getAvailableLimit(record) < 0 ? 'text-red-300' : 'text-primary';
}

function buildVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = Math.max(1, currentPage - 1);
  const end = Math.min(totalPages, start + 2);
  const normalizedStart = Math.max(1, end - 2);

  return Array.from({ length: end - normalizedStart + 1 }, (_, index) => normalizedStart + index);
}

export function ContasBancariasListPage() {
  const [filters, setFilters] = useState<ContasBancariasListFilters>(defaultFilters);
  const [quickTypeFilter, setQuickTypeFilter] = useState<QuickTypeFilter>('');
  const deferredFilters = useDeferredValue(filters);
  const [data, setData] = useState<Awaited<ReturnType<typeof cadastrosApi.contasBancarias.listar>>>();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  async function loadData() {
    setLoading(true);
    setErrorMessage(undefined);

    try {
      setData(await cadastrosApi.contasBancarias.listar(deferredFilters));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar contas bancarias.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [deferredFilters.page, deferredFilters.pageSize, JSON.stringify(deferredFilters)]);

  const items = useMemo(() => {
    const currentItems = data?.items ?? [];

    if (!quickTypeFilter) {
      return currentItems;
    }

    return currentItems.filter((item) => normalizeTipoConta(item.tipoConta) === quickTypeFilter);
  }, [data?.items, quickTypeFilter]);

  const summary = useMemo(() => {
    const saldoTotal = items.reduce((total, record) => total + record.saldoAtual, 0);
    const creditoDisponivel = items.reduce((total, record) => total + getAvailableLimit(record), 0);
    const contasAtivas = items.filter((record) => record.ativo).length;

    return {
      saldoTotal,
      creditoDisponivel,
      contasAtivas
    };
  }, [items]);

  const currentPage = data?.page ?? filters.page;
  const pageSize = data?.pageSize ?? filters.pageSize;
  const totalItems = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const visiblePages = useMemo(() => buildVisiblePages(currentPage, totalPages), [currentPage, totalPages]);

  return (
    <div className="flex w-full min-w-0 flex-col gap-10 2xl:gap-12">
      <section className="flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary/80">Cadastros</p>
            <h1 className="text-4xl font-black tracking-tight text-on-surface sm:text-5xl">Contas Bancarias</h1>
            <p className="max-w-4xl text-sm leading-6 text-on-surface-variant sm:text-base">
              Gerencie suas conexoes bancarias e acompanhe saldo inicial, limite compartilhado e disponibilidade operacional
              em um unico painel.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void loadData()}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-5 py-3 text-sm font-bold text-on-surface transition hover:border-primary/25 hover:text-white"
          >
            <SyncOutlined />
            Sincronizar Tudo
          </button>
          <Link
            to={`${contasBancariasModuleConfig.routeBase}/novo`}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-[#062412] shadow-[0_18px_40px_rgba(63,255,139,0.18)] transition hover:scale-[1.02]"
          >
            <PlusOutlined />
            Adicionar Conta
          </Link>
        </div>
      </section>

      <section className="grid w-full gap-5 md:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-[30px] border border-white/6 bg-surface-container-low px-7 py-6 xl:px-8 xl:py-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Saldo total consolidado</p>
          <p className="mt-5 text-3xl font-black tracking-tight text-primary 2xl:text-[2.5rem]">{formatCurrencyBRL(summary.saldoTotal)}</p>
        </article>

        <article className="rounded-[30px] border border-white/6 bg-surface-container-low px-7 py-6 xl:px-8 xl:py-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Credito disponivel</p>
          <p className="mt-5 text-3xl font-black tracking-tight text-on-surface 2xl:text-[2.5rem]">
            {formatCurrencyBRL(summary.creditoDisponivel)}
          </p>
        </article>

        <article className="rounded-[30px] border border-white/6 bg-surface-container-low px-7 py-6 xl:px-8 xl:py-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Contas ativas</p>
          <p className="mt-5 text-3xl font-black tracking-tight text-on-surface 2xl:text-[2.5rem]">{summary.contasAtivas}</p>
        </article>
      </section>

      <section className="overflow-hidden rounded-[32px] border border-white/6 bg-surface-container-low shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        <div className="border-b border-white/6 bg-surface-container-high/40 px-6 py-6 sm:px-8">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(260px,0.8fr)_220px]">
            <div className="space-y-2">
              <label className="px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Busca</label>
              <div className="relative">
                <SearchOutlined className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  value={filters.search ?? ''}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      page: 1,
                      search: event.target.value
                    }))
                  }
                  placeholder="Buscar por banco, conta ou status..."
                  className="h-14 w-full rounded-2xl border border-white/8 bg-surface-container-highest pl-11 pr-4 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/50 focus:border-primary/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Banco</label>
              <input
                value={filters.banco ?? ''}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    page: 1,
                    banco: event.target.value || undefined
                  }))
                }
                placeholder="Banco"
                className="h-14 w-full rounded-2xl border border-white/8 bg-surface-container-highest px-4 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/50 focus:border-primary/30"
              />
            </div>

            <div className="space-y-2">
              <label className="px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Status</label>
              <select
                aria-label="Status"
                value={filters.ativo === undefined ? '' : String(filters.ativo)}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    page: 1,
                    ativo: normalizeStatusValue(event.target.value)
                  }))
                }
                className="h-14 w-full rounded-2xl border border-white/8 bg-surface-container-highest px-4 text-sm text-on-surface outline-none transition focus:border-primary/30"
              >
                <option value="">Todos os status</option>
                <option value="true">Ativas</option>
                <option value="false">Inativas</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="pr-2 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Filtrar por</span>
            {quickTypeOptions.map((option) => {
              const active = quickTypeFilter === option.value;

              return (
                <button
                  key={option.value || 'all'}
                  type="button"
                  onClick={() => setQuickTypeFilter(option.value)}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                    active ? 'bg-primary text-[#062412]' : 'bg-surface-container-highest text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="px-8 py-16">
            <PageState state="loading" title="Carregando contas bancarias..." />
          </div>
        ) : null}

        {!loading && errorMessage ? (
          <div className="space-y-4 px-8 py-16">
            <PageState state="error" title="Falha ao carregar contas bancarias" subtitle={errorMessage} />
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => void loadData()}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-black text-[#062412]"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        ) : null}

        {!loading && !errorMessage ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-[1120px] w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/6 bg-surface-container-high/20">
                    <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Banco</th>
                    <th className="px-4 py-5 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Conta</th>
                    <th className="px-4 py-5 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Saldo atual</th>
                    <th className="px-4 py-5 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Limite</th>
                    <th className="px-4 py-5 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Disponivel</th>
                    <th className="px-4 py-5 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Status</th>
                    <th className="px-8 py-5 text-right text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-8 py-16">
                        <PageState
                          state="empty"
                          title="Nenhuma conta bancaria encontrada"
                          subtitle="Ajuste os filtros ou cadastre uma nova conta para iniciar o monitoramento."
                        />
                      </td>
                    </tr>
                  ) : (
                    items.map((record) => (
                      <tr key={record.id} className="group transition hover:bg-white/[0.02]">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/8 bg-white/[0.04] text-xs font-black uppercase tracking-[0.16em] text-on-surface shadow-[0_10px_24px_rgba(0,0,0,0.2)]">
                              {getBankMonogram(record.banco)}
                            </div>
                            <div className="min-w-0">
                              <div className="text-base font-black leading-5 text-on-surface">{record.banco}</div>
                              <div className="mt-1 text-xs text-on-surface-variant">{record.tipoConta ?? 'Conta sem classificacao'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-6">
                          <div className="text-sm font-bold text-on-surface">{record.nome}</div>
                          <div className="mt-1 text-xs text-on-surface-variant">{getAccountIdentification(record)}</div>
                        </td>
                        <td className="px-4 py-6">
                          <div className="text-sm font-black text-primary">{formatCurrencyBRL(record.saldoAtual)}</div>
                          <div className="mt-1 text-[10px] uppercase tracking-wider text-on-surface-variant">inicial {formatCurrencyBRL(record.saldoInicial)}</div>
                        </td>
                        <td className="px-4 py-6 text-sm font-bold text-on-surface">{formatCurrencyBRL(getSharedLimit(record))}</td>
                        <td className={`px-4 py-6 text-sm font-black ${getAvailableValueClass(record)}`}>
                          {formatCurrencyBRL(getAvailableLimit(record))}
                        </td>
                        <td className="px-4 py-6 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getStatusBadgeClass(record)}`}
                          >
                            {getStatusLabel(record)}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex justify-end">
                            <Link
                              to={`/movimentacoes?contaBancariaId=${record.id}`}
                              aria-label="Extrato"
                              title="Ver extrato"
                              className="mr-2 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-white/[0.04] text-on-surface-variant transition hover:border-primary/25 hover:bg-primary/10 hover:text-primary"
                            >
                              <HistoryOutlined />
                            </Link>
                            <Link
                              to={`${contasBancariasModuleConfig.routeBase}/${record.id}`}
                              aria-label="Editar"
                              title="Editar"
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-white/[0.04] text-on-surface-variant transition hover:border-primary/25 hover:bg-primary/10 hover:text-primary"
                            >
                              <EditOutlined />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4 border-t border-white/6 bg-surface-container px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <div className="text-sm text-on-surface-variant">Exibindo {items.length} de {totalItems} contas</div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        page: Math.max(1, currentPage - 1)
                      }))
                    }
                    disabled={currentPage <= 1}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-surface-container-highest text-on-surface transition hover:border-primary/25 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ‹
                  </button>

                  {visiblePages.map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() =>
                        setFilters((current) => ({
                          ...current,
                          page
                        }))
                      }
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black transition ${
                        page === currentPage
                          ? 'bg-primary text-[#062412]'
                          : 'border border-white/8 bg-surface-container-highest text-on-surface hover:border-primary/25 hover:text-primary'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        page: Math.min(totalPages, currentPage + 1)
                      }))
                    }
                    disabled={currentPage >= totalPages}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-surface-container-highest text-on-surface transition hover:border-primary/25 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ›
                  </button>
                </div>

                <select
                  aria-label="Itens por pagina"
                  value={String(pageSize)}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      page: 1,
                      pageSize: Number(event.target.value)
                    }))
                  }
                  className="h-10 rounded-xl border border-white/8 bg-surface-container-highest px-3 text-sm text-on-surface outline-none transition focus:border-primary/30"
                >
                  <option value="20">20 / pagina</option>
                  <option value="50">50 / pagina</option>
                  <option value="100">100 / pagina</option>
                </select>
              </div>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}

export default ContasBancariasListPage;

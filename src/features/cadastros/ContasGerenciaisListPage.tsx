import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  ApartmentOutlined,
  BarsOutlined,
  DownOutlined,
  DownloadOutlined,
  EditOutlined,
  FilterOutlined,
  PlusOutlined,
  RightOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { IconActionButton } from '../../components/data/IconActionButton';
import { PageState } from '../../components/states/PageState';
import { contasGerenciaisModuleConfig } from './module-config';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { sortContasGerenciaisByCodigo } from '../../shared/conta-gerencial';
import type { ContaGerencialFilters, ContaGerencialResumo } from '../../types/cadastros';

type ContasGerenciaisListFilters = ContaGerencialFilters;
type ViewMode = 'tree' | 'list';

const defaultFilters: ContasGerenciaisListFilters = {
  ...contasGerenciaisModuleConfig.defaultFilters
};

function normalizeStatusValue(value: string) {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
}

function getDepth(record: ContaGerencialResumo, viewMode: ViewMode) {
  if (viewMode === 'list') {
    return 0;
  }

  const code = record.codigo?.trim();
  if (!code) {
    return 0;
  }

  return Math.max(0, code.split('.').filter(Boolean).length - 1);
}

function hasChildren(record: ContaGerencialResumo, items: ContaGerencialResumo[]) {
  return items.some((item) => item.contaPaiId === record.id);
}

function getResponsavelInitials(name?: string | null) {
  if (!name) {
    return '--';
  }

  const parts = name
    .split(/\s+/)
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return '--';
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
}

function getTipoBadgeClass(tipo: ContaGerencialResumo['tipo']) {
  return tipo === 'Receita' ? 'text-primary' : 'text-[#ff8a7a]';
}

function getUsageBadgeClass(aceitaLancamentos: boolean) {
  return aceitaLancamentos
    ? 'border border-primary/20 bg-primary/10 text-primary'
    : 'border border-white/10 bg-white/[0.04] text-on-surface-variant';
}

function getStatusBadgeClass(ativo: boolean) {
  return ativo
    ? 'border border-primary/20 bg-primary/10 text-primary'
    : 'border border-white/10 bg-white/[0.04] text-on-surface-variant';
}

function getRangeStart(page: number, pageSize: number, totalItems: number) {
  if (totalItems === 0) {
    return 0;
  }

  return (page - 1) * pageSize + 1;
}

function getRangeEnd(page: number, pageSize: number, totalItems: number) {
  if (totalItems === 0) {
    return 0;
  }

  return Math.min(totalItems, page * pageSize);
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

function downloadCsv(items: ContaGerencialResumo[]) {
  const lines = [
    ['codigo', 'descricao', 'contaPai', 'tipo', 'responsavel', 'uso', 'status'].join(';'),
    ...items.map((record) =>
      [
        record.codigo ?? '',
        record.descricao,
        record.contaPaiDescricao ?? '',
        record.tipo,
        record.responsavelPadraoNome ?? '',
        record.aceitaLancamentos ? 'Analitica' : 'Sintetica',
        record.ativo ? 'Ativo' : 'Inativo'
      ].join(';')
    )
  ];

  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = 'contas-gerenciais.csv';
  link.click();
  window.URL.revokeObjectURL(objectUrl);
}

export function ContasGerenciaisListPage() {
  const [filters, setFilters] = useState<ContasGerenciaisListFilters>(defaultFilters);
  const deferredFilters = useDeferredValue(filters);
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true);
  const [data, setData] = useState<Awaited<ReturnType<typeof cadastrosApi.contasGerenciais.listar>>>();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  async function loadData() {
    setLoading(true);
    setErrorMessage(undefined);

    try {
      setData(await cadastrosApi.contasGerenciais.listar(deferredFilters));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar contas gerenciais.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [deferredFilters.page, deferredFilters.pageSize, JSON.stringify(deferredFilters)]);

  const items = useMemo(() => sortContasGerenciaisByCodigo(data?.items ?? []), [data?.items]);

  const summary = useMemo(() => {
    const activeItems = items.filter((item) => item.ativo);
    const uniqueResponsaveis = new Set(
      items
        .map((item) => item.responsavelPadraoId)
        .filter((value): value is string => Boolean(value))
    );

    return {
      totalItems: data?.totalItems ?? items.length,
      estruturaAtiva: items.length ? Math.round((activeItems.length / items.length) * 100) : 0,
      responsaveis: uniqueResponsaveis.size
    };
  }, [data?.totalItems, items]);

  const visiblePages = useMemo(
    () => buildVisiblePages(data?.page ?? filters.page, data?.totalPages ?? 1),
    [data?.page, data?.totalPages, filters.page]
  );

  const page = data?.page ?? filters.page;
  const pageSize = data?.pageSize ?? filters.pageSize;
  const totalItems = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="flex w-full min-w-0 flex-col gap-8 2xl:gap-10">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-3">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-on-surface sm:text-5xl">Contas Gerenciais</h1>
            <p className="max-w-3xl text-sm leading-6 text-on-surface-variant sm:text-base">
              Gerencie a estrutura hierarquica do seu plano de contas com leitura rapida, visao em arvore e acesso direto a
              edicao.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => downloadCsv(items)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-5 py-3 text-sm font-bold text-on-surface transition hover:border-white/15 hover:text-white"
          >
            <DownloadOutlined />
            Exportar
          </button>
          <Link
            to={`${contasGerenciaisModuleConfig.routeBase}/novo`}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-[#062412] shadow-[0_18px_40px_rgba(63,255,139,0.18)] transition hover:scale-[1.02]"
          >
            <PlusOutlined />
            Criar Nova Conta
          </Link>
        </div>
      </section>

      <section className="grid w-full gap-5 md:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-[28px] border border-white/6 bg-surface-container-low px-7 py-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Total de contas</p>
          <p className="mt-4 text-3xl font-black tracking-tight text-primary">{summary.totalItems}</p>
        </article>
        <article className="rounded-[28px] border border-white/6 bg-surface-container-low px-7 py-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Estrutura ativa</p>
          <p className="mt-4 text-3xl font-black tracking-tight text-on-surface">{summary.estruturaAtiva}%</p>
        </article>
        <article className="rounded-[28px] border border-white/6 bg-surface-container-low px-7 py-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Responsaveis</p>
          <p className="mt-4 text-3xl font-black tracking-tight text-tertiary">{summary.responsaveis}</p>
        </article>
      </section>

      <section className="w-full rounded-[28px] border border-white/6 bg-surface-container p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-4 xl:flex-row xl:items-center">
            <div className="relative w-full xl:max-w-[44rem]">
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
                placeholder="Buscar por codigo ou descricao..."
                className="h-12 w-full rounded-2xl border border-white/8 bg-surface-container-highest pl-11 pr-4 text-sm font-medium text-on-surface outline-none transition placeholder:text-on-surface-variant/50 focus:border-primary/25"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowAdvancedFilters((current) => !current)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/8 bg-surface-container-highest px-4 py-3 text-sm font-bold text-on-surface transition hover:border-white/15 hover:text-white"
            >
              <FilterOutlined />
              Filtros
            </button>
          </div>

          <div className="flex items-center gap-2 self-end xl:self-auto">
            <span className="pr-2 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
              Visualizacao
            </span>
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              aria-label="Visualizacao em arvore"
              className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border transition ${
                viewMode === 'tree'
                  ? 'border-primary/20 bg-primary/10 text-primary'
                  : 'border-white/8 bg-transparent text-on-surface-variant hover:text-white'
              }`}
            >
              <ApartmentOutlined />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="Visualizacao em lista"
              className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border transition ${
                viewMode === 'list'
                  ? 'border-primary/20 bg-primary/10 text-primary'
                  : 'border-white/8 bg-transparent text-on-surface-variant hover:text-white'
              }`}
            >
              <BarsOutlined />
            </button>
          </div>
        </div>

        {showAdvancedFilters ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-[260px_260px_180px]">
            <div className="space-y-2">
              <label className="px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Tipo</label>
              <select
                aria-label="Tipo"
                value={filters.tipo ?? ''}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    page: 1,
                    tipo: (event.target.value || undefined) as ContaGerencialFilters['tipo']
                  }))
                }
                className="h-12 w-full rounded-2xl border border-white/8 bg-surface-container-highest px-4 text-sm font-medium text-on-surface outline-none transition focus:border-primary/25"
              >
                <option value="">Todos os tipos</option>
                <option value="Receita">Receita</option>
                <option value="Despesa">Despesa</option>
              </select>
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
                className="h-12 w-full rounded-2xl border border-white/8 bg-surface-container-highest px-4 text-sm font-medium text-on-surface outline-none transition focus:border-primary/25"
              >
                <option value="">Todos os status</option>
                <option value="true">Ativos</option>
                <option value="false">Inativos</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Pagina</label>
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
                className="h-12 w-full rounded-2xl border border-white/8 bg-surface-container-highest px-4 text-sm font-medium text-on-surface outline-none transition focus:border-primary/25"
              >
                <option value="20">20 por pagina</option>
                <option value="50">50 por pagina</option>
                <option value="100">100 por pagina</option>
              </select>
            </div>
          </div>
        ) : null}
      </section>

      {loading ? <PageState state="loading" title="Carregando contas gerenciais..." /> : null}

      {!loading && errorMessage ? (
        <div className="space-y-4 rounded-[32px] border border-white/6 bg-surface-container-low p-8">
          <PageState state="error" title="Falha ao carregar contas gerenciais" subtitle={errorMessage} />
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
        <section className="w-full overflow-hidden rounded-[32px] border border-white/6 bg-surface-container-low shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
          <div className="overflow-x-auto">
            <div className="min-w-[1180px]">
              <div className="grid grid-cols-[minmax(320px,1.7fr)_minmax(220px,1fr)_140px_minmax(220px,1.1fr)_120px_120px_90px] items-center gap-4 border-b border-white/6 px-8 py-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Codigo & descricao</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Conta pai</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Tipo</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Responsavel</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Uso</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Status</span>
                <span className="text-right text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Acoes</span>
              </div>

              {items.length === 0 ? (
                <div className="px-8 py-16">
                  <PageState state="empty" title="Nenhuma conta gerencial encontrada" subtitle="Ajuste os filtros ou crie uma nova conta para iniciar a estrutura." />
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {items.map((record) => {
                    const depth = getDepth(record, viewMode);
                    const childNode = hasChildren(record, items);
                    const usageLabel = record.aceitaLancamentos ? 'Analitica' : 'Sintetica';

                    return (
                      <div
                        key={record.id}
                        className="grid grid-cols-[minmax(320px,1.7fr)_minmax(220px,1fr)_140px_minmax(220px,1.1fr)_120px_120px_90px] items-center gap-4 px-8 py-5 transition hover:bg-white/[0.02]"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex min-w-0 items-start gap-3" style={{ paddingLeft: `${depth * 24}px` }}>
                            {viewMode === 'tree' ? (
                              childNode ? (
                                <span className="mt-1 text-primary">
                                  <DownOutlined />
                                </span>
                              ) : depth > 0 ? (
                                <span className="mt-1 text-on-surface-variant">
                                  <RightOutlined />
                                </span>
                              ) : (
                                <span className="mt-1 h-4 w-4" aria-hidden="true" />
                              )
                            ) : null}

                            <div className="min-w-0">
                              <div className="text-[11px] font-mono text-on-surface-variant">{record.codigo ?? 'Sem codigo'}</div>
                              <div className="mt-1 text-lg font-black leading-6 text-on-surface">{record.descricao}</div>
                            </div>
                          </div>
                        </div>

                        <div className="text-sm text-on-surface-variant">{record.contaPaiDescricao ?? '---'}</div>

                        <div className={`flex items-center gap-2 text-sm font-bold ${getTipoBadgeClass(record.tipo)}`}>
                          <span className={`h-2 w-2 rounded-full ${record.tipo === 'Receita' ? 'bg-primary' : 'bg-[#ff8a7a]'}`} />
                          {record.tipo}
                        </div>

                        <div className="flex items-center gap-3">
                          {record.responsavelPadraoNome ? (
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[10px] font-black uppercase text-on-surface">
                              {getResponsavelInitials(record.responsavelPadraoNome)}
                            </span>
                          ) : null}
                          <span className="text-sm text-on-surface">{record.responsavelPadraoNome ?? '---'}</span>
                        </div>

                        <span
                          className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${getUsageBadgeClass(record.aceitaLancamentos)}`}
                        >
                          {usageLabel}
                        </span>

                        <span
                          className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${getStatusBadgeClass(record.ativo)}`}
                        >
                          {record.ativo ? 'Ativo' : 'Inativo'}
                        </span>

                        <div className="flex justify-end">
                          <IconActionButton
                            label="Editar"
                            icon={<EditOutlined />}
                            href={`${contasGerenciaisModuleConfig.routeBase}/${record.id}`}
                            type="text"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-white/6 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <span className="text-xs text-on-surface-variant">
              Mostrando <span className="font-bold text-on-surface">{getRangeStart(page, pageSize, totalItems)}-{getRangeEnd(page, pageSize, totalItems)}</span> de{' '}
              <span className="font-bold text-on-surface">{totalItems}</span> contas gerenciais
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: Math.max(1, page - 1)
                  }))
                }
                className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-white/8 bg-transparent px-3 text-sm font-bold text-on-surface transition disabled:cursor-not-allowed disabled:opacity-40"
              >
                {'<'}
              </button>

              {visiblePages.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() =>
                    setFilters((current) => ({
                      ...current,
                      page: pageNumber
                    }))
                  }
                  className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-black transition ${
                    pageNumber === page
                      ? 'bg-primary text-[#062412]'
                      : 'border border-white/8 bg-transparent text-on-surface'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: Math.min(totalPages, page + 1)
                  }))
                }
                className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-white/8 bg-transparent px-3 text-sm font-bold text-on-surface transition disabled:cursor-not-allowed disabled:opacity-40"
              >
                {'>'}
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

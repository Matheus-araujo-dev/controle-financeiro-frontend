import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import type { TableColumnsType } from 'antd';
import { BankOutlined, CreditCardOutlined, EditOutlined, FilterOutlined, PlusOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { AppDataTable } from '../../components/data/AppDataTable';
import { IconActionButton } from '../../components/data/IconActionButton';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { formatCurrencyBRL } from '../../shared/currency';
import type { CartaoFilters, CartaoResumo } from '../../types/cadastros';
import { cartoesModuleConfig } from './module-config';

type CartoesListFilters = CartaoFilters & {
  sortBy?: string;
  sortDirection?: 'Asc' | 'Desc';
};

const defaultFilters: CartoesListFilters = {
  ...cartoesModuleConfig.defaultFilters
};

function getEffectiveLimit(record: CartaoResumo) {
  return record.limiteEfetivo ?? record.limiteCredito ?? 0;
}

function getAvailableLimit(record: CartaoResumo) {
  if (record.limiteDisponivel !== null) {
    return record.limiteDisponivel;
  }

  const effectiveLimit = record.limiteEfetivo ?? record.limiteCredito;
  if (effectiveLimit === null) {
    return null;
  }

  return Math.max(0, effectiveLimit - record.limiteComprometido);
}

function formatCardDay(day?: number | null) {
  if (!day || Number.isNaN(day)) {
    return 'Sem leitura';
  }

  return `Dia ${String(day).padStart(2, '0')}`;
}

function formatCardFinal(finalNumber: string) {
  return `•••• ${finalNumber}`;
}

function getLimitOriginLabel(record: CartaoResumo) {
  return record.usaLimiteCompartilhado ? 'Compartilhado' : 'Individual';
}

function getStatusBadgeClass(active: boolean) {
  return active
    ? 'bg-primary/12 text-primary border border-primary/20'
    : 'bg-white/6 text-on-surface-variant border border-white/8';
}

function getBrandMonogram(brand: string) {
  const sanitized = brand.trim().toUpperCase();
  if (!sanitized) {
    return 'CARD';
  }

  return sanitized.slice(0, Math.min(4, sanitized.length));
}

function normalizeStatusValue(value: string) {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
}

export function CartoesListPage() {
  const [filters, setFilters] = useState<CartoesListFilters>(defaultFilters);
  const deferredFilters = useDeferredValue(filters);
  const [data, setData] = useState<Awaited<ReturnType<typeof cadastrosApi.cartoes.listar>>>();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  async function loadData() {
    setLoading(true);
    setErrorMessage(undefined);

    try {
      setData(await cadastrosApi.cartoes.listar(deferredFilters));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar cartões.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [deferredFilters.page, deferredFilters.pageSize, JSON.stringify(deferredFilters)]);

  const cards = data?.items ?? [];

  const summary = useMemo(() => {
    const totalLimit = cards.reduce((total, record) => total + getEffectiveLimit(record), 0);
    const usedLimit = cards.reduce((total, record) => total + record.limiteComprometido, 0);
    const availableLimit = cards.reduce((total, record) => total + (getAvailableLimit(record) ?? 0), 0);
    const nextDueCard =
      [...cards]
        .filter((record) => record.ativo)
        .sort((left, right) => left.diaVencimentoFatura - right.diaVencimentoFatura)[0] ??
      [...cards].sort((left, right) => left.diaVencimentoFatura - right.diaVencimentoFatura)[0];

    return {
      totalLimit,
      usedLimit,
      availableLimit,
      nextDueCard,
      activeCards: cards.filter((record) => record.ativo).length,
      sharedLimitCards: cards.filter((record) => record.usaLimiteCompartilhado).length
    };
  }, [cards]);

  const columns = useMemo<TableColumnsType<CartaoResumo>>(
    () => [
      {
        title: 'Cartão',
        dataIndex: 'nome',
        key: 'nome',
        render: (value, record) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-12 items-center justify-center rounded-xl border border-white/8 bg-white/[0.04] text-[10px] font-black uppercase tracking-[0.16em] text-white/90">
              {getBrandMonogram(record.bandeira)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-on-surface">{String(value)}</div>
              <div className="truncate text-[11px] text-on-surface-variant">
                {record.bandeira} • {getLimitOriginLabel(record)}
              </div>
            </div>
          </div>
        )
      },
      {
        title: 'Final',
        dataIndex: 'numeroFinal',
        key: 'numeroFinal',
        render: (value) => <span className="font-mono text-sm text-on-surface-variant">{formatCardFinal(String(value))}</span>
      },
      {
        title: 'Fechamento',
        dataIndex: 'diaFechamentoFatura',
        key: 'diaFechamentoFatura',
        render: (value) => <span className="text-sm text-on-surface">{formatCardDay(Number(value))}</span>
      },
      {
        title: 'Vencimento',
        dataIndex: 'diaVencimentoFatura',
        key: 'diaVencimentoFatura',
        render: (value) => <span className="text-sm text-on-surface">{formatCardDay(Number(value))}</span>
      },
      {
        title: 'Origem',
        dataIndex: 'usaLimiteCompartilhado',
        key: 'usaLimiteCompartilhado',
        render: (_value, record) => <span className="text-sm italic text-on-surface-variant">{getLimitOriginLabel(record)}</span>
      },
      {
        title: 'Limite efetivo',
        dataIndex: 'limiteEfetivo',
        key: 'limiteEfetivo',
        align: 'right',
        render: (_value, record) => <span className="text-sm font-bold text-on-surface">{formatCurrencyBRL(getEffectiveLimit(record))}</span>
      },
      {
        title: 'Saldo disponível',
        dataIndex: 'limiteDisponivel',
        key: 'limiteDisponivel',
        align: 'right',
        render: (_value, record) => (
          <span className="text-sm font-bold text-primary">
            {getAvailableLimit(record) === null ? 'Indisponível' : formatCurrencyBRL(getAvailableLimit(record))}
          </span>
        )
      },
      {
        title: 'Status',
        dataIndex: 'ativo',
        key: 'ativo',
        align: 'center',
        render: (_value, record) => (
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${getStatusBadgeClass(record.ativo)}`}
          >
            {record.ativo ? 'Ativo' : 'Inativo'}
          </span>
        )
      },
      {
        title: 'Ações',
        key: 'acoes',
        width: 112,
        align: 'right',
        render: (_value, record) => (
          <div className="flex justify-end">
            <IconActionButton
              label="Editar"
              icon={<EditOutlined />}
              href={`${cartoesModuleConfig.routeBase}/${record.id}`}
              type="text"
            />
          </div>
        )
      }
    ],
    []
  );

  return (
    <div className="mx-auto flex w-full max-w-none flex-col gap-10 2xl:gap-12">
      <section className="overflow-hidden rounded-[36px] border border-white/6 bg-[radial-gradient(circle_at_top_right,rgba(63,255,139,0.12),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))] px-8 py-8 sm:px-10 xl:px-12 2xl:px-14 2xl:py-11">
        <div className="flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-5xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary/80">Cadastros</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-on-surface sm:text-5xl">Gestão de Cartões</h1>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-on-surface-variant sm:text-base">
              Visualize e gerencie limites, fechamento e vencimento dos seus cartões em tempo real, com leitura rápida do
              consumo e acesso direto à edição.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => searchInputRef.current?.focus()}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-5 py-3 text-sm font-bold text-on-surface transition hover:border-primary/25 hover:text-white"
            >
              <FilterOutlined />
              Filtros
            </button>
            <Link
              to={`${cartoesModuleConfig.routeBase}/novo`}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-[#062412] shadow-[0_18px_40px_rgba(63,255,139,0.18)] transition hover:scale-[1.02]"
            >
              <PlusOutlined />
              Adicionar Cartão
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <article className="relative overflow-hidden rounded-[30px] border border-white/6 bg-surface-container-low px-7 py-6 xl:px-8 xl:py-7">
          <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Limite Total</p>
          <p className="mt-5 text-3xl font-black tracking-tight text-primary 2xl:text-[2.5rem]">{formatCurrencyBRL(summary.totalLimit)}</p>
        </article>

        <article className="relative overflow-hidden rounded-[30px] border border-white/6 bg-surface-container-low px-7 py-6 xl:px-8 xl:py-7">
          <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-error/10 blur-3xl" aria-hidden="true" />
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Utilizado</p>
          <p className="mt-5 text-3xl font-black tracking-tight text-error 2xl:text-[2.5rem]">{formatCurrencyBRL(summary.usedLimit)}</p>
        </article>

        <article className="relative overflow-hidden rounded-[28px] border border-white/6 bg-surface-container-low px-7 py-6">
          <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Disponível</p>
          <p className="mt-4 text-3xl font-black tracking-tight text-on-surface">{formatCurrencyBRL(summary.availableLimit)}</p>
        </article>

        <article className="relative overflow-hidden rounded-[28px] border border-primary/18 bg-surface-container-low px-7 py-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Próximo Vencimento</p>
          <p className="mt-4 text-3xl font-black tracking-tight text-on-surface">
            {summary.nextDueCard ? formatCardDay(summary.nextDueCard.diaVencimentoFatura) : 'Sem leitura'}
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-on-surface-variant">
            <BankOutlined />
            <span>{summary.activeCards} cartão(ões) ativos no recorte</span>
          </div>
        </article>
      </section>

      <section className="rounded-[32px] border border-white/6 bg-surface-container-low p-7 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8 xl:p-10">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-on-surface">Histórico de cartões</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">
              Refiltre por nome, bandeira e status para acompanhar rapidamente limites disponíveis, origem do saldo e
              fechamento de cada cartão.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
            <span className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2">
              {data?.totalItems ?? 0} cartão(ões)
            </span>
            <span className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2">
              {summary.sharedLimitCards} compartilhado(s)
            </span>
          </div>
        </div>

        <div id="cartoes-filtros" className="mt-6 grid gap-4 xl:grid-cols-[minmax(420px,1.7fr)_minmax(300px,1.1fr)_320px] 2xl:grid-cols-[minmax(520px,1.9fr)_minmax(360px,1.2fr)_340px]">
          <div className="space-y-2">
            <label className="px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
              Busca
            </label>
            <input
              ref={searchInputRef}
              value={filters.search ?? ''}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  page: 1,
                  search: event.target.value
                }))
              }
              placeholder="Buscar por nome, bandeira ou final"
              className="h-14 w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/50 focus:border-primary/30"
            />
          </div>

          <div className="space-y-2">
            <label className="px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
              Bandeira
            </label>
            <input
              value={filters.bandeira ?? ''}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  page: 1,
                  bandeira: event.target.value || undefined
                }))
              }
              placeholder="Ex: Visa, Mastercard, Elo"
              className="h-14 w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/50 focus:border-primary/30"
            />
          </div>

          <div className="space-y-2">
            <label className="px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
              Status
            </label>
            <select
              value={filters.ativo === undefined ? '' : String(filters.ativo)}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  page: 1,
                  ativo: normalizeStatusValue(event.target.value)
                }))
              }
              className="h-14 w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 text-sm text-on-surface outline-none transition focus:border-primary/30"
            >
              <option value="">Todos os status</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
            </select>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-[28px] border border-white/5 bg-[#111111]">
          <AppDataTable
            rowKey="id"
            loading={loading}
            errorMessage={errorMessage}
            emptyMessage="Nenhum cartão cadastrado."
            onRetry={loadData}
            dataSource={cards}
            columns={columns}
            onTableChange={(pagination, _filters, sorter) => {
              const currentSorter = Array.isArray(sorter) ? sorter[0] : sorter;
              const sortKey =
                typeof currentSorter?.columnKey === 'string'
                  ? currentSorter.columnKey
                  : typeof currentSorter?.field === 'string'
                    ? currentSorter.field
                    : undefined;

              setFilters((current) => ({
                ...current,
                page: pagination.current ?? current.page,
                pageSize: pagination.pageSize ?? current.pageSize,
                sortBy: sortKey,
                sortDirection:
                  currentSorter?.order === 'ascend' ? 'Asc' : currentSorter?.order === 'descend' ? 'Desc' : undefined
              }));
            }}
            pagination={{
              current: data?.page ?? filters.page,
              pageSize: data?.pageSize ?? filters.pageSize,
              total: data?.totalItems ?? 0,
              showTotal: (total, range) => `Exibindo ${range[0]}-${range[1]} de ${total} cartões cadastrados`
            }}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-on-surface-variant">
          <div className="flex items-center gap-2">
            <CreditCardOutlined />
            <span>{cards.length} cartão(ões) visíveis na página atual</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1">
              Fechamentos monitorados em tempo real
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default CartoesListPage;

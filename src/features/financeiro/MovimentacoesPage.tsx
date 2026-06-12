import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CreditCardOutlined,
  DollarCircleOutlined,
  HistoryOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  WalletOutlined,
  DownloadOutlined,
  PrinterOutlined,
  CalendarOutlined,
  FilterOutlined,
  SafetyCertificateOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Select, Tooltip } from 'antd';
import type { MovimentacaoFilters, MovimentacaoResumo, NaturezaMovimentacao, TipoMovimentacao } from '../../types/financeiro';
import { AppDataTable } from '../../components/data/AppDataTable';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { financeiroApi } from '../../services/http/financeiro-api';
import { formatCurrencyBRL } from '../../shared/currency';
import { formatDateBR } from '../../shared/date';

const tipoOptions: Array<{ label: string; value: TipoMovimentacao | '' }> = [
  { label: 'Todos os tipos', value: '' },
  { label: 'Entrada', value: 'Entrada' },
  { label: 'Saída', value: 'Saida' }
];

const naturezaOptions: Array<{ label: string; value: NaturezaMovimentacao | '' }> = [
  { label: 'Todas as naturezas', value: '' },
  { label: 'Prevista', value: 'Prevista' },
  { label: 'Realizada', value: 'Realizada' },
  { label: 'Econômica', value: 'Economica' }
];

const allAccountsValue = '__ALL_ACCOUNTS__';
const allResponsiblesValue = '__ALL_RESPONSIBLES__';

type Tone = 'positive' | 'negative' | 'neutral';
type FilterOption = { label: string; value: string };

function getMovementTone(item: MovimentacaoResumo): Tone {
  if (item.tipo === 'Entrada') return 'positive';
  if (item.tipo === 'Saida') return 'negative';
  return 'neutral';
}

function getMovementDescriptor(item: MovimentacaoResumo) {
  if (item.faturaCartaoId) {
    return {
      icon: <CreditCardOutlined />,
      label: 'Fatura do cartão',
      tone: 'positive' as const
    };
  }

  if (item.contaReceberId) {
    return {
      icon: <DollarCircleOutlined />,
      label: 'Conta a receber',
      tone: 'positive' as const
    };
  }

  if (item.contaPagarId) {
    return {
      icon: <ShoppingCartOutlined />,
      label: 'Conta a pagar',
      tone: 'negative' as const
    };
  }

  if (item.tipo === 'Entrada') {
    return {
      icon: <ArrowDownOutlined />,
      label: 'Entrada avulsa',
      tone: 'positive' as const
    };
  }

  return {
    icon: <ArrowUpOutlined />,
    label: 'Saída avulsa',
    tone: 'negative' as const
  };
}

function normalizeMultiSelectSelection(values: string[], options: FilterOption[], selectAllValue: string) {
  if (!values.length) return undefined;
  if (values.includes(selectAllValue)) return options.map((option) => option.value);
  const sanitizedValues = values.filter((value) => value !== selectAllValue);
  return sanitizedValues.length ? sanitizedValues : undefined;
}

export function MovimentacoesPage() {
  // Link "ver extrato" das contas bancárias abre a página já filtrada pela conta.
  const contaBancariaInicial = new URLSearchParams(window.location.search).get('contaBancariaId');

  const [filters, setFilters] = useState<MovimentacaoFilters>({
    page: 1,
    pageSize: 20,
    search: '',
    dataInicial: undefined,
    dataFinal: undefined,
    contaBancariaIds: contaBancariaInicial ? [contaBancariaInicial] : undefined,
    responsavelIds: undefined,
    tipo: undefined,
    natureza: undefined
  });
  const deferredFilters = useDeferredValue(filters);
  const [data, setData] = useState<Awaited<ReturnType<typeof financeiroApi.movimentacoes.listar>>>();
  const [contaBancariaOptions, setContaBancariaOptions] = useState<FilterOption[]>([]);
  const [responsavelOptions, setResponsavelOptions] = useState<FilterOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  async function loadData(targetFilters: MovimentacaoFilters = deferredFilters) {
    setLoading(true);
    setErrorMessage(undefined);

    try {
      setData(await financeiroApi.movimentacoes.listar(targetFilters));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar as movimentações.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [deferredFilters.page, deferredFilters.pageSize, JSON.stringify(deferredFilters)]);

  useEffect(() => {
    async function loadContaBancariaOptions() {
      try {
        const response = await cadastrosApi.contasBancarias.listar({
          page: 1,
          pageSize: 100,
          search: '',
          ativo: true
        });

        setContaBancariaOptions(
          response.items.map((item) => ({
            label: `${item.nome} - ${item.banco}`,
            value: item.id
          }))
        );
      } catch {
        setContaBancariaOptions([]);
      }
    }

    async function loadResponsavelOptions() {
      try {
        const response = await cadastrosApi.pessoas.listar({
          page: 1,
          pageSize: 100,
          search: '',
          ativo: true
        });

        setResponsavelOptions(
          response.items.map((item) => ({
            label: item.nome,
            value: item.id
          }))
        );
      } catch {
        setResponsavelOptions([]);
      }
    }

    void loadContaBancariaOptions();
    void loadResponsavelOptions();
  }, []);

  const resumo = useMemo(() => {
    const totalEntradas = data?.summary?.totalEntradas ?? 0;
    const totalSaidas = data?.summary?.totalSaidas ?? 0;
    const saldoLiquido = data?.summary?.saldoLiquido ?? 0;
    const totalRegistros = data?.summary?.totalRegistros ?? 0;
    const ultimoEvento = data?.items[0]?.dataMovimentacao;

    return {
      totalEntradas,
      totalSaidas,
      saldoLiquido,
      totalRegistros,
      ultimoEvento
    };
  }, [data]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header & Metrics Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h2 className="text-on-surface-variant font-label text-xs uppercase tracking-[0.2em] mb-2">Controle em Tempo Real</h2>
          <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tighter text-white mb-2 neon-glow">
            Extrato de Movimentações
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-surface-container p-4 rounded-2xl border border-white/5 min-w-[160px]">
            <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest block mb-1">Entradas</span>
            <div className="flex items-center gap-2">
              <ArrowDownOutlined className="text-primary text-sm" />
              <span className="text-white text-xl font-headline font-extrabold">{formatCurrencyBRL(resumo.totalEntradas)}</span>
            </div>
          </div>
          <div className="bg-surface-container p-4 rounded-2xl border border-white/5 min-w-[160px]">
            <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest block mb-1">Saídas</span>
            <div className="flex items-center gap-2">
              <ArrowUpOutlined className="text-error text-sm" />
              <span className="text-white text-xl font-headline font-extrabold">{formatCurrencyBRL(resumo.totalSaidas)}</span>
            </div>
          </div>
          <div className="bg-surface-container-highest p-4 rounded-2xl border border-primary/20 min-w-[180px] shadow-[0_8px_32px_rgba(63,255,139,0.1)]">
            <span className="text-primary text-[10px] font-bold uppercase tracking-widest block mb-1">Saldo Líquido</span>
            <span className="text-primary text-2xl font-headline font-extrabold">{formatCurrencyBRL(resumo.saldoLiquido)}</span>
          </div>
        </div>
      </div>

      {/* Bento Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Date Filter */}
        <div className="bg-surface-container-low p-5 rounded-3xl border border-white/5 space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Período</label>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 bg-surface-container-highest px-3 py-2 rounded-xl border border-white/5">
              <CalendarOutlined className="text-on-surface-variant text-sm" />
              <input
                type="date"
                aria-label="Data inicial"
                className="bg-transparent border-none text-xs font-bold uppercase tracking-wider focus:ring-0 text-white w-full"
                value={filters.dataInicial ?? ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, dataInicial: e.target.value || undefined, page: 1 }))}
              />
            </div>
            <div className="flex items-center gap-2 bg-surface-container-highest px-3 py-2 rounded-xl border border-white/5">
              <CalendarOutlined className="text-on-surface-variant text-sm" />
              <input
                type="date"
                aria-label="Data final"
                className="bg-transparent border-none text-xs font-bold uppercase tracking-wider focus:ring-0 text-white w-full"
                value={filters.dataFinal ?? ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, dataFinal: e.target.value || undefined, page: 1 }))}
              />
            </div>
          </div>
        </div>

        <div className="bg-surface-container-low p-5 rounded-3xl border border-white/5 space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Contas e Responsáveis</label>
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-surface-container-highest px-3 py-1 rounded-xl border border-white/5 min-h-[42px]">
              <WalletOutlined className="text-on-surface-variant text-sm shrink-0" />
              <Select
                mode="multiple"
                allowClear
                aria-label="Filtro de conta bancária"
                placeholder="Todas as Contas"
                className="neon-select-simple w-full"
                value={filters.contaBancariaIds}
                onChange={(vals) => setFilters((prev) => ({ ...prev, contaBancariaIds: vals, page: 1 }))}
                options={contaBancariaOptions}
                maxTagCount="responsive"
                variant="borderless"
              />
            </div>
            <div className="flex items-center gap-2 bg-surface-container-highest px-3 py-1 rounded-xl border border-white/5 min-h-[42px]">
              <UserOutlined className="text-on-surface-variant text-sm shrink-0" />
              <Select
                mode="multiple"
                allowClear
                aria-label="Filtro de responsável"
                placeholder="Todos os Responsáveis"
                className="neon-select-simple w-full"
                value={filters.responsavelIds}
                onChange={(vals) => setFilters((prev) => ({ ...prev, responsavelIds: vals, page: 1 }))}
                options={responsavelOptions}
                maxTagCount="responsive"
                variant="borderless"
              />
            </div>
          </div>
        </div>

        {/* Classification Filter */}
        <div className="bg-surface-container-low p-5 rounded-3xl border border-white/5 space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Classificação</label>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 bg-surface-container-highest px-3 py-2 rounded-xl border border-white/5">
                <FilterOutlined className="text-on-surface-variant text-sm" />
                <select
                    className="bg-transparent border-none text-xs font-bold uppercase tracking-wider focus:ring-0 text-white w-full"
                    value={filters.tipo ?? ''}
                    onChange={(e) => setFilters((prev) => ({ ...prev, tipo: (e.target.value as TipoMovimentacao) || undefined, page: 1 }))}
                >
                    {tipoOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>
            <div className="flex items-center gap-2 bg-surface-container-highest px-3 py-2 rounded-xl border border-white/5">
                <HistoryOutlined className="text-on-surface-variant text-sm" />
                <select
                    className="bg-transparent border-none text-xs font-bold uppercase tracking-wider focus:ring-0 text-white w-full"
                    value={filters.natureza ?? ''}
                    onChange={(e) => setFilters((prev) => ({ ...prev, natureza: (e.target.value as NaturezaMovimentacao) || undefined, page: 1 }))}
                >
                    {naturezaOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>
          </div>
        </div>

        {/* Search Filter */}
        <div className="bg-surface-container-low p-5 rounded-3xl border border-white/5 space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Busca</label>
            <div className="flex items-center gap-2 bg-surface-container-highest px-3 py-3 rounded-xl border border-white/5 h-[46px]">
                <SearchOutlined className="text-on-surface-variant text-sm" />
                <input
                    className="bg-transparent border-none text-xs font-bold uppercase tracking-wider focus:ring-0 text-white w-full placeholder:text-on-surface-variant"
                    placeholder="Filtrar por observação..."
                    value={filters.search}
                    onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
                />
            </div>
            <button
              onClick={() => void loadData()}
              className="w-full bg-primary hover:bg-primary-container text-on-primary font-bold py-2 rounded-xl transition-all active:scale-95 shadow-[0_4px_15px_rgba(63,255,139,0.15)] text-xs uppercase tracking-widest"
            >
              Aplicar Filtros
            </button>
        </div>
      </div>

      {/* Main Ledger Section */}
      <div className="bg-surface-container-low rounded-3xl overflow-hidden border border-white/5">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-lg font-headline font-bold text-white">Transações do Período</h3>
            <div className="flex gap-2">
                <button className="p-2 hover:bg-white/5 rounded-lg text-on-surface-variant hover:text-primary transition-all">
                    <DownloadOutlined className="text-lg" />
                </button>
                <button className="p-2 hover:bg-white/5 rounded-lg text-on-surface-variant hover:text-primary transition-all">
                    <PrinterOutlined className="text-lg" />
                </button>
            </div>
        </div>

        <AppDataTable
          rowKey="id"
          loading={loading}
          errorMessage={errorMessage}
          emptyMessage="Nenhuma movimentação encontrada."
          onRetry={() => void loadData(filters)}
          dataSource={data?.items ?? []}
          columns={[
            {
              title: 'Data',
              dataIndex: 'dataMovimentacao',
              key: 'dataMovimentacao',
              render: (value) => <span className="text-sm font-medium text-on-surface-variant">{formatDateBR(String(value))}</span>
            },
            {
              title: 'Descrição',
              dataIndex: 'observacao',
              key: 'observacao',
              render: (value, record: MovimentacaoResumo) => {
                const descriptor = getMovementDescriptor(record);
                const isPositive = record.tipo === 'Entrada';

                return (
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${isPositive ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-surface-container border-white/5 text-on-surface-variant'}`}>
                      {descriptor.icon}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white">{value ?? descriptor.label}</span>
                      <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-tighter">{descriptor.label}</span>
                    </div>
                  </div>
                );
              }
            },
            {
              title: 'Natureza',
              dataIndex: 'natureza',
              key: 'natureza',
              render: (value, record: MovimentacaoResumo) => {
                  const natureColors = {
                      Realizada: 'bg-primary/20 text-primary border-primary/20',
                      Prevista: 'bg-white/5 text-on-surface-variant border-white/10',
                      Economica: 'bg-tertiary/20 text-tertiary border-tertiary/20'
                  };
                  const activeStyle = natureColors[value as keyof typeof natureColors] || natureColors.Prevista;

                  return (
                    <div className="flex flex-col gap-1 items-start">
                        <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold border ${activeStyle}`}>{value}</span>
                        <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase ml-0.5">{record.tipo}</span>
                    </div>
                  );
              }
            },
            {
              title: 'Conta',
              dataIndex: 'contaBancariaNome',
              key: 'contaBancariaNome',
              render: (value, record: MovimentacaoResumo) => (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-on-surface-variant font-medium">
                    <WalletOutlined className="text-xs" />
                    <span className="text-sm">{value ?? '---'}</span>
                  </div>
                  {record.responsavelNome && (
                    <div className="flex items-center gap-2 text-primary/70 text-[10px] font-bold uppercase">
                      <UserOutlined className="text-[10px]" />
                      <span>{record.responsavelNome}</span>
                    </div>
                  )}
                </div>
              )
            },
            {
              title: 'Valor',
              dataIndex: 'valor',
              key: 'valor',
              align: 'right',
              render: (value, record: MovimentacaoResumo) => {
                const isPositive = record.tipo === 'Entrada';
                const prefix = isPositive ? '+' : '-';

                return (
                  <div className="flex flex-col items-end">
                      <span className={`text-sm font-headline font-extrabold ${isPositive ? 'text-primary' : 'text-white'}`}>
                        {`${prefix} ${formatCurrencyBRL(Math.abs(Number(value)))}`}
                      </span>
                      {record.statusNome && (
                        <div className="flex items-center gap-1">
                            <SafetyCertificateOutlined className="text-[9px] text-on-surface-variant" />
                            <span className="text-[9px] font-bold text-on-surface-variant uppercase">{record.statusNome}</span>
                        </div>
                      )}
                  </div>
                );
              }
            },
            {
              title: 'Responsável',
              dataIndex: 'responsavelNome',
              key: 'responsavelNome',
              render: (value) => (
                <div className="flex items-center gap-2 text-primary/70">
                  <UserOutlined className="text-[10px]" />
                  <span className="text-xs font-bold uppercase">{value ?? '---'}</span>
                </div>
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
      </div>
    </div>
  );
}

import { useDeferredValue, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CreditCardOutlined,
  DollarCircleOutlined,
  HistoryOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  WalletOutlined,
  FilterOutlined,
  UserOutlined
} from '@ant-design/icons';
import { DateInput } from '../../components/forms/DateInput';
import type { MovimentacaoFilters, MovimentacaoResumo, NaturezaMovimentacao, TipoMovimentacao } from '../../types/financeiro';
import { AppDataTable } from '../../components/data/AppDataTable';
import { ExportButton } from '../../components/data/ExportButton';
import { StatusBadge, type StatusTone } from '../../components/data/StatusBadge';
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

type FilterOption = { label: string; value: string };

function naturezaTone(value: NaturezaMovimentacao): StatusTone {
  if (value === 'Realizada') return 'success';
  if (value === 'Economica') return 'warning';
  return 'neutral';
}

function tipoTone(value: TipoMovimentacao): StatusTone {
  return value === 'Entrada' ? 'success' : 'neutral';
}

function movimentacaoStatusTone(statusCodigo: string): StatusTone {
  return statusCodigo === 'EFETIVADA' ? 'success' : 'neutral';
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

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ['movimentacoes', 'list', deferredFilters],
    queryFn: () => financeiroApi.movimentacoes.listar(deferredFilters),
    staleTime: 30_000,
    placeholderData: (prev) => prev
  });

  const { data: contasBancariasData } = useQuery({
    queryKey: ['contas-bancarias', 'options'],
    queryFn: () => cadastrosApi.contasBancarias.listar({ page: 1, pageSize: 100, search: '', ativo: true }),
    staleTime: 5 * 60_000
  });
  const contaBancariaOptions: FilterOption[] = (contasBancariasData?.items ?? []).map((item) => ({
    label: `${item.nome} - ${item.banco}`,
    value: item.id
  }));

  const { data: pessoasData } = useQuery({
    queryKey: ['pessoas', 'options'],
    queryFn: () => cadastrosApi.pessoas.listar({ page: 1, pageSize: 100, search: '', ativo: true }),
    staleTime: 5 * 60_000
  });
  const responsavelOptions: FilterOption[] = (pessoasData?.items ?? []).map((item) => ({
    label: item.nome,
    value: item.id
  }));

  const errorMessage = error instanceof Error ? error.message : error ? 'Falha ao carregar as movimentações.' : undefined;

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

  const exportColumns = [
    { header: 'Data', value: (r: MovimentacaoResumo) => r.dataMovimentacao },
    { header: 'Descrição', value: (r: MovimentacaoResumo) => r.observacao ?? '' },
    { header: 'Tipo', value: (r: MovimentacaoResumo) => r.tipo },
    { header: 'Natureza', value: (r: MovimentacaoResumo) => r.natureza },
    { header: 'Conta bancária', value: (r: MovimentacaoResumo) => r.contaBancariaNome ?? '' },
    { header: 'Responsável', value: (r: MovimentacaoResumo) => r.responsavelNome ?? '' },
    { header: 'Valor', value: (r: MovimentacaoResumo) => r.valor },
    { header: 'Status', value: (r: MovimentacaoResumo) => r.statusNome ?? '' }
  ];

  return (
    <ListPageShell
      actions={
        <ExportButton
          fetchPage={financeiroApi.movimentacoes.listar}
          filters={filters}
          columns={exportColumns}
          filename="extrato"
        />
      }
      summary={
        <>
          <SummaryCard label="Entradas" value={formatCurrencyBRL(resumo.totalEntradas)} accent="primary" />
          <SummaryCard label="Saídas" value={formatCurrencyBRL(resumo.totalSaidas)} accent="error" />
          <SummaryCard label="Saldo Líquido" value={formatCurrencyBRL(resumo.saldoLiquido)} accent={resumo.saldoLiquido >= 0 ? 'primary' : 'error'} highlight />
        </>
      }
      filters={
      <FilterCard className="space-y-4">
        {/* Linha 1: Período + Tipo + Natureza */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <FilterField label="De">
            <DateInput
              compact
              ariaLabel="Data inicial"
              value={filters.dataInicial ?? ''}
              onChange={(value) => setFilters((prev) => ({ ...prev, dataInicial: value || undefined, page: 1 }))}
            />
          </FilterField>

          <FilterField label="Até">
            <DateInput
              compact
              ariaLabel="Data final"
              value={filters.dataFinal ?? ''}
              onChange={(value) => setFilters((prev) => ({ ...prev, dataFinal: value || undefined, page: 1 }))}
            />
          </FilterField>

          <FilterField label="Tipo">
            <MultiSelectFilter
              ariaLabel="Tipo"
              icon={<FilterOutlined />}
              options={tipoOptions}
              value={filters.tipo ? [filters.tipo] : []}
              onChange={(next) => setFilters((prev) => ({ ...prev, tipo: next[0] as TipoMovimentacao | undefined, page: 1 }))}
            />
          </FilterField>

          <FilterField label="Natureza">
            <MultiSelectFilter
              ariaLabel="Natureza"
              icon={<HistoryOutlined />}
              options={naturezaOptions}
              value={filters.natureza ? [filters.natureza] : []}
              onChange={(next) => setFilters((prev) => ({ ...prev, natureza: next[0] as NaturezaMovimentacao | undefined, page: 1 }))}
            />
          </FilterField>
        </div>

        {/* Linha 2: Conta + Responsável + Busca */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_2fr] gap-3">
          <FilterField label="Conta bancária">
            <MultiSelectFilter
              ariaLabel="Filtro de conta bancária"
              icon={<WalletOutlined />}
              placeholder="Todas as contas"
              options={contaBancariaOptions}
              value={filters.contaBancariaIds ?? []}
              onChange={(next) =>
                setFilters((prev) => ({ ...prev, contaBancariaIds: next.length ? next : undefined, page: 1 }))
              }
            />
          </FilterField>

          <FilterField label="Responsável">
            <MultiSelectFilter
              ariaLabel="Filtro de responsável"
              icon={<UserOutlined />}
              placeholder="Todos os responsáveis"
              options={responsavelOptions}
              value={filters.responsavelIds ?? []}
              onChange={(next) =>
                setFilters((prev) => ({ ...prev, responsavelIds: next.length ? next : undefined, page: 1 }))
              }
            />
          </FilterField>

          <FilterField label="Buscar">
            <FilterInputWrapper icon={<SearchOutlined />}>
              <input
                className={filterInputClass}
                placeholder="Filtrar por observação..."
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
              />
              {filters.search && (
                <button
                  aria-label="Limpar busca"
                  onClick={() => setFilters(prev => ({ ...prev, search: '', page: 1 }))}
                  className="text-on-surface-variant hover:text-white text-xs shrink-0"
                >×</button>
              )}
            </FilterInputWrapper>
          </FilterField>
        </div>
      </FilterCard>
      }
    >
      {/* Main Ledger Section */}
      <div className="bg-surface-container-low rounded-3xl overflow-hidden border border-white/5">
        <AppDataTable
          rowKey="id"
          loading={isFetching}
          errorMessage={errorMessage}
          emptyMessage="Nenhuma movimentação encontrada."
          onRetry={() => void refetch()}
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
                return (
                  <div className="flex flex-col items-start gap-1">
                    <StatusBadge label={String(value)} tone={naturezaTone(value as NaturezaMovimentacao)} />
                    <StatusBadge label={record.tipo} tone={tipoTone(record.tipo)} />
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
                        <StatusBadge label={record.statusNome} tone={movimentacaoStatusTone(record.statusCodigo)} />
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
            total: data?.totalItems ?? 0,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total, range) => `${range[0]}–${range[1]} de ${total} registros`,
            onChange: (page, pageSize) =>
              setFilters((current) => ({
                ...current,
                page,
                pageSize
              }))
          }}
        />
      </div>
    </ListPageShell>
  );
}

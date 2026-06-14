import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CalendarOutlined,
  FilterOutlined,
  PlusOutlined,
  SearchOutlined,
  WalletOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  MoreOutlined,
  UndoOutlined,
  WarningOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { AppDataTable } from '../../components/data/AppDataTable';
import { PageState } from '../../components/states/PageState';
import { formatCurrencyBRL } from '../../shared/currency';
import { formatDateBR } from '../../shared/date';
import type { FinanceiroModuleConfig, FinanceiroResumo, StatusCodigoConta } from './module-config';
import { resolveStatusTone, statusFilterOptions } from './module-config';
import { Modal, Tooltip } from 'antd';

export function FinancialAccountListPage({
  config,
  embedded = false
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: FinanceiroModuleConfig<any, any, any>;
  embedded?: boolean;
}) {
  const navigate = useNavigate();
  // Permite links diretos já filtrados (ex.: alerta de vencidas no dashboard).
  const [searchParams] = useSearchParams();
  const statusInicial = searchParams.get('status');

  const [data, setData] = useState<Awaited<ReturnType<typeof config.list>>>();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 10,
    search: '',
    statusCodigo: statusInicial
      ? ([statusInicial] as StatusCodigoConta[])
      : (config.defaultFilters.statusCodigo as StatusCodigoConta[]),
    dataInicial: undefined as string | undefined,
    dataFinal: undefined as string | undefined,
    sortBy: undefined as string | undefined,
    sortDirection: undefined as 'Asc' | 'Desc' | undefined
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(undefined);

    try {
      setData(await config.list(filters));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar os lançamentos.');
    } finally {
      setLoading(false);
    }
  }, [config, filters]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const onEdit = useCallback((id: string) => navigate(`${config.routeBase}/${id}`), [navigate, config.routeBase]);
  const onCreate = useCallback(() => navigate(`${config.routeBase}/novo`), [navigate, config.routeBase]);

  const liquidarRapido = useCallback(
    async (id: string) => {
      if (!config.liquidar) return;

      Modal.confirm({
        title: 'Liquidação rápida',
        content: `Deseja liquidar este lançamento agora com a data de hoje?`,
        centered: true,
        okText: 'Sim, liquidar',
        cancelText: 'Cancelar',
        onOk: async () => {
          try {
            const contas = await config.loadContaBancariaOptions();
            if (contas.length === 0) {
              Modal.error({ title: 'Erro', content: 'Nenhuma conta bancária cadastrada para liquidar.' });
              return;
            }

            await config.liquidar!(id, { 
              dataLiquidacao: new Date().toISOString().split('T')[0],
              contaBancariaId: contas[0].value
            });
            void loadData();
          } catch (error) {
            Modal.error({
              title: 'Erro ao liquidar',
              content: error instanceof Error ? error.message : 'Falha na operação.'
            });
          }
        }
      });
    },
    [config, loadData]
  );

  const resumo = useMemo(() => data?.summary as FinanceiroResumo | undefined, [data]);

  if (!data && loading) {
    return <PageState state="loading" title={`Carregando ${config.title.toLowerCase()}...`} />;
  }

  const isPagar = config.routeBase.includes('pagar');
  const totalVencendoHoje = resumo?.totalVencendoHoje ?? 0;
  const hasAlertaHoje = totalVencendoHoje > 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className={`flex flex-col md:flex-row md:items-end gap-6 ${embedded ? 'md:justify-end' : 'justify-between'}`}>
        {!embedded && (
          <div>
            <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tighter text-white mb-2 neon-glow">
              {config.title}
            </h1>
            <p className="text-on-surface-variant font-medium">
              {isPagar ? 'Gerenciamento de obrigações e fluxo de saída.' : 'Gerenciamento de recebíveis e fluxo de entrada.'}
            </p>
          </div>
        )}
        <button
          onClick={onCreate}
          className="bg-primary hover:bg-primary-container text-on-primary font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_4px_20px_rgba(63,255,139,0.2)]"
        >
          <PlusOutlined className="text-lg" />
          Nova {config.singularTitle.toLowerCase()}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-container rounded-3xl border border-white/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ClockCircleOutlined />
            </span>
            <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">Total Pendente</span>
          </div>
          <p className="text-3xl font-headline font-extrabold text-primary">{formatCurrencyBRL(resumo?.totalPendente ?? 0)}</p>
          <p className="mt-2 text-xs text-on-surface-variant">Baseado nos filtros aplicados</p>
        </div>

        <div className="bg-surface-container rounded-3xl border border-white/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className={`flex h-9 w-9 items-center justify-center rounded-2xl ${hasAlertaHoje ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
              <CalendarOutlined />
            </span>
            <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">
              {isPagar ? 'Vencendo Hoje' : 'Recebendo Hoje'}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-headline font-extrabold text-white">{formatCurrencyBRL(totalVencendoHoje)}</p>
            {hasAlertaHoje && (
              <span className="text-on-surface-variant text-sm font-medium">{`/ ${data?.totalItems ?? 0} contas`}</span>
            )}
          </div>
          <div className="mt-3">
            {hasAlertaHoje ? (
              <span className="bg-error/15 text-error px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-tighter">Crítico</span>
            ) : (
              <span className="bg-primary/15 text-primary px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-tighter">Normal</span>
            )}
          </div>
        </div>

        <div className="bg-surface-container rounded-3xl border border-white/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CheckCircleOutlined />
            </span>
            <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">Total Liquidado</span>
          </div>
          <p className="text-3xl font-headline font-extrabold text-white">{formatCurrencyBRL(resumo?.totalLiquidado ?? 0)}</p>
          <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
            {hasAlertaHoje ? (
              <>
                <WarningOutlined className="text-sm text-error" />
                <span>Atenção requerida</span>
              </>
            ) : (
              <>
                <CheckCircleOutlined className="text-sm text-primary" />
                <span>Fluxo de caixa saudável</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-surface-container-low p-5 rounded-3xl border border-white/5 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,220px)_minmax(0,220px)_1fr]">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Vencimento</label>
          <div className="flex items-center gap-2 bg-surface-container-highest px-3 py-2.5 rounded-2xl border border-white/5">
            <CalendarOutlined className="text-on-surface-variant text-sm" />
            <select
              className="bg-transparent border-none text-sm font-medium focus:ring-0 text-white w-full"
              value={filters.dataInicial ?? ''}
              onChange={(e) => {
              const value = e.target.value;
              let dataInicial: string | undefined;
              let dataFinal: string | undefined;
              
              if (value === 'hoje') {
                dataInicial = new Date().toISOString().split('T')[0];
                dataFinal = dataInicial;
              } else if (value === 'proximos7') {
                dataInicial = new Date().toISOString().split('T')[0];
                dataFinal = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
              } else if (value === 'esteMes') {
                dataInicial = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
                dataFinal = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
              } else if (value === 'proximos30') {
                dataInicial = new Date().toISOString().split('T')[0];
                dataFinal = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
              }
              
              setFilters((prev) => ({ 
                ...prev, 
                dataInicial: dataInicial || undefined, 
                dataFinal: dataFinal || undefined, 
                page: 1 
              }));
            }}
          >
            <option value="">Vencimento: Todos</option>
            <option value="hoje">Hoje</option>
            <option value="proximos7">Próximos 7 dias</option>
            <option value="proximos30">Próximos 30 dias</option>
            <option value="esteMes">Este Mês</option>
          </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Status</label>
          <div className="flex items-center gap-2 bg-surface-container-highest px-3 py-2.5 rounded-2xl border border-white/5">
            <FilterOutlined className="text-on-surface-variant text-sm" />
            <select
              className="bg-transparent border-none text-sm font-medium focus:ring-0 text-white w-full"
              value={filters.statusCodigo?.[0] ?? ''}
              onChange={(e) => setFilters((prev) => ({
                ...prev,
                statusCodigo: e.target.value ? [e.target.value as StatusCodigoConta] : [],
                page: 1
              }))}
            >
              <option value="">Status: Todos</option>
              <option value="PENDENTE">Pendente</option>
              <option value="EM_FATURA">Em fatura</option>
              <option value="LIQUIDADA">Liquidada</option>
              <option value="VENCIDA">Vencida</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Buscar</label>
          <div className="flex items-center gap-2 bg-surface-container-highest px-3 py-2.5 rounded-2xl border border-white/5">
            <SearchOutlined className="text-on-surface-variant text-sm" />
            <input
              className="bg-transparent border-none text-sm font-medium focus:ring-0 text-white w-full placeholder:text-on-surface-variant"
              placeholder={`BUSCAR POR ${config.personLabel.toUpperCase()}...`}
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
            />
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-surface-container-low rounded-3xl overflow-hidden border border-white/5">
        <AppDataTable
          rowKey="id"
          loading={loading}
          errorMessage={errorMessage}
          emptyMessage={`Nenhuma ${config.singularTitle.toLowerCase()} encontrada.`}
          onRetry={loadData}
          dataSource={data?.items ?? []}
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
          columns={[
            {
              title: config.personLabel,
              dataIndex: 'recebedorNome',
              key: 'pessoaNome',
              render: (_value, record) => {
                const nome = record.recebedorNome ?? record.pagadorNome ?? '';
                return (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center border border-white/5">
                      <WalletOutlined className={`text-sm ${isPagar ? 'text-primary' : 'text-secondary'}`} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white">{nome}</span>
                      <span className="text-[10px] text-on-surface-variant uppercase tracking-tighter">
                        {record.descricao}
                      </span>
                    </div>
                  </div>
                );
              }
            },
            {
              title: 'Vencimento',
              dataIndex: 'dataVencimento',
              key: 'dataVencimento',
              width: 120,
              render: (value, record) => {
                const isOverdue = record.statusCodigo === 'VENCIDA';
                return (
                  <span className={`text-sm font-medium ${isOverdue ? 'text-error' : 'text-on-surface-variant'}`}>
                    {formatDateBR(String(value))}
                  </span>
                );
              }
            },
            {
              title: 'Categoria',
              dataIndex: 'descricao',
              key: 'categoriaPrincipal',
              render: (_value, record) => {
                const categoria = record.descricao?.split(' ')[0] || 'Diversos';
                return (
                  <span className="text-[10px] bg-surface-container px-2 py-1 rounded font-bold uppercase tracking-tighter text-on-surface-variant">
                    {categoria}
                  </span>
                );
              }
            },
            {
              title: 'Status',
              dataIndex: 'statusNome',
              key: 'statusNome',
              width: 140,
              render: (value, record) => {
                const tone = resolveStatusTone(record.statusCodigo);
                const colors = {
                  positive: 'text-primary',
                  negative: 'text-error',
                  warning: 'text-warning',
                  neutral: 'text-on-surface-variant'
                };

                const glowColors = {
                    positive: 'bg-primary shadow-[0_0_8px_rgba(63,255,139,0.5)]',
                    negative: 'bg-error shadow-[0_0_8px_rgba(255,113,108,0.5)]',
                    warning: 'bg-warning shadow-[0_0_8px_rgba(255,193,7,0.5)]',
                    neutral: 'bg-on-surface-variant/40'
                };

                const activeColor = colors[tone as keyof typeof colors] || colors.neutral;
                const activeGlow = glowColors[tone as keyof typeof glowColors] || glowColors.neutral;

                return (
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${activeGlow}`} />
                    <span className={`text-xs font-bold ${activeColor}`}>{value}</span>
                  </div>
                );
              }
            },
            {
              title: 'Valor',
              dataIndex: 'valorLiquido',
              key: 'valorLiquido',
              align: 'right',
              width: 130,
              render: (value, record) => (
                <span className={`text-sm font-headline font-bold ${record.statusCodigo === 'VENCIDA' ? 'text-error' : 'text-white'}`}>
                  {formatCurrencyBRL(Number(value))}
                </span>
              )
            },
            {
              title: 'Ações',
              key: 'actions',
              align: 'center',
              width: 100,
              render: (_, record) => {
                const isLiquidated = record.statusCodigo === 'LIQUIDADA';
                const isCancelled = record.statusCodigo === 'CANCELADA';
                // Compras de cartão são liquidadas pelo pagamento da fatura, não individualmente.
                const isEmFatura = record.statusCodigo === 'EM_FATURA';

                return (
                  <div className="flex justify-center gap-2">
                    {!isLiquidated && !isCancelled && !isEmFatura && (
                      <Tooltip title="Liquidar">
                        <button
                          aria-label="Liquidar"
                          onClick={() => liquidarRapido(record.id)}
                          className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
                        >
                          <DollarOutlined className="text-lg" />
                        </button>
                      </Tooltip>
                    )}

                    <Tooltip title={isLiquidated ? 'Estornar' : 'Detalhes/Editar'}>
                      <button
                        aria-label={isLiquidated ? 'Estornar' : 'Detalhes/Editar'}
                        onClick={() => {
                          if (isLiquidated && config.estornar) {
                            Modal.confirm({
                              title: 'Estornar lançamento',
                              content: 'Deseja realmente estornar esta liquidação? O lançamento voltará para o status Pendente.',
                              centered: true,
                              okText: 'Sim, estornar',
                              okType: 'danger',
                              cancelText: 'Cancelar',
                              onOk: async () => {
                                try {
                                  await config.estornar!(record.id);
                                  void loadData();
                                } catch (err: any) {
                                  Modal.error({ title: 'Erro ao estornar', content: err.message });
                                }
                              }
                            });
                          } else {
                            onEdit(record.id);
                          }
                        }}
                        className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-white transition-colors"
                      >
                        <MoreOutlined className="text-lg" />
                      </button>
                    </Tooltip>
                  </div>
                );
              }
            }
          ]}
          pagination={{
            current: data?.page ?? filters.page,
            pageSize: data?.pageSize ?? filters.pageSize,
            total: data?.totalItems ?? 0,
            showSizeChanger: true,
            onChange: (page, pageSize) => setFilters((prev) => ({ ...prev, page, pageSize }))
          }}
        />
      </div>
    </div>
  );
}

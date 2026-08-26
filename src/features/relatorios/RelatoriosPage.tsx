import { useDeferredValue, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '../../components/ui/Button';
import { ComboBox } from '../../components/forms/ComboBox';
import { DateInput } from '../../components/forms/DateInput';
import { PageState } from '../../components/states/PageState';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { comprasPlanejadasApi } from '../../services/http/compras-planejadas-api';
import { dashboardApi } from '../../services/http/dashboard-api';
import { financeiroApi } from '../../services/http/financeiro-api';
import { formatCurrencyBRL } from '../../shared/currency';
import { formatDateBR } from '../../shared/date';
import type { CompraPlanejadaPrioridade, CompraPlanejadaStatus } from '../../types/compras-planejadas';
import type {
  DashboardCentralPrevisaoOrigem,
  DashboardCentralPrevisaoStatus,
  DashboardContaGerencialTipo
} from '../../types/dashboard';
import type {
  ContaFinanceiraListSummary,
  ContaPagarResumo,
  ContaReceberResumo,
  StatusContaCodigo,
  StatusFaturaCodigo
} from '../../types/financeiro';
import { downloadReportWorkbook } from './report-export';
import {
  ativoOptions,
  comparativoMesesOptions,
  compraPrioridadeOptions,
  compraStatusOptions,
  contaTipoOptions,
  faturaStatusOptions,
  fluxoDiasOptions,
  inadimplenciaTipoOptions,
  lancamentosStatusOptions,
  lancamentosTipoOptions,
  MAX_REPORT_ROWS,
  origemLabels,
  origemOptions,
  recorrenciaTipoOptions,
  reportTabs,
  statusLabels,
  statusPrevisaoOptions,
  type ReportKey,
  type ReportState
} from './relatorios-config';
import {
  agingBucket,
  buildAlertas,
  buildExportDefinition,
  buildInadimplenciaRows,
  emptyPaged,
  exportarPdf,
  getCurrentReferenceMonth,
  getMonthRange,
  getRecorrenciaTipoLabel
} from './relatorios-helpers';
import { AlertCard, FilterCombo, FilterInput, MetricCard, ReportTable } from './relatorios-components';


export function RelatoriosPage() {
  const [activeReport, setActiveReport] = useState<ReportKey>('geral');
  const [referenceMonth, setReferenceMonth] = useState(getCurrentReferenceMonth());

  // Fluxo de caixa filters
  const [fluxoDias, setFluxoDias] = useState('30');

  // Contas gerenciais / análises
  const [contaTipo, setContaTipo] = useState<string[]>([]);
  const [contasGerenciaisSearch, setContasGerenciaisSearch] = useState('');
  const deferredContasGerenciaisSearch = useDeferredValue(contasGerenciaisSearch);

  // Responsáveis
  const [responsaveisSearch, setResponsaveisSearch] = useState('');
  const deferredResponsaveisSearch = useDeferredValue(responsaveisSearch);

  // Previsões
  const [previsaoOrigem, setPrevisaoOrigem] = useState<string[]>([]);
  const [previsaoStatus, setPrevisaoStatus] = useState<string[]>([]);

  // Inadimplência
  const [inadimplenciaTipo, setInadimplenciaTipo] = useState<string[]>([]);
  const [inadimplenciaSearch, setInadimplenciaSearch] = useState('');
  const deferredInadimplenciaSearch = useDeferredValue(inadimplenciaSearch);

  // Faturas
  const [faturaSearch, setFaturaSearch] = useState('');
  const [faturaStatus, setFaturaStatus] = useState<string[]>([]);
  const [faturaCartaoId, setFaturaCartaoId] = useState('');
  const deferredFaturaSearch = useDeferredValue(faturaSearch);

  // Recorrências
  const [recorrenciaSearch, setRecorrenciaSearch] = useState('');
  const [recorrenciaTipo, setRecorrenciaTipo] = useState<string[]>([]);
  const [recorrenciaAtiva, setRecorrenciaAtiva] = useState<string[]>([]);
  const deferredRecorrenciaSearch = useDeferredValue(recorrenciaSearch);

  // Compras planejadas
  const [compraSearch, setCompraSearch] = useState('');
  const [compraStatus, setCompraStatus] = useState<string[]>([]);
  const [compraPrioridade, setCompraPrioridade] = useState<string[]>([]);
  const deferredCompraSearch = useDeferredValue(compraSearch);

  // Comparativo
  const [comparativoMeses, setComparativoMeses] = useState('6');

  // Responsável (filtro compartilhado: DRE, Contas Gerenciais, Análises, Inadimplência, Compras, Recorrências)
  const [responsavelId, setResponsavelId] = useState('');

  // Lançamentos (a pagar/receber)
  const [lancamentosTipo, setLancamentosTipo] = useState<string[]>([]);
  const [lancamentosStatus, setLancamentosStatus] = useState<string[]>([]);
  const [lancamentosResponsavelId, setLancamentosResponsavelId] = useState('');
  const [lancamentosSearch, setLancamentosSearch] = useState('');
  const deferredLancamentosSearch = useDeferredValue(lancamentosSearch);

  const reportFilters = {
    referenceMonth,
    fluxoDias,
    contaTipo,
    responsavelId,
    deferredContasGerenciaisSearch,
    deferredResponsaveisSearch,
    previsaoOrigem,
    previsaoStatus,
    inadimplenciaTipo,
    deferredInadimplenciaSearch,
    faturaStatus,
    deferredFaturaSearch,
    recorrenciaTipo,
    recorrenciaAtiva,
    deferredRecorrenciaSearch,
    compraStatus,
    compraPrioridade,
    deferredCompraSearch,
    comparativoMeses,
    lancamentosTipo,
    lancamentosStatus,
    lancamentosResponsavelId,
    deferredLancamentosSearch
  };

  const { data: reportData, isFetching: loading, error: reportError } = useQuery({
    queryKey: ['relatorios', reportFilters],
    queryFn: async (): Promise<ReportState> => {
      const range = getMonthRange(referenceMonth);
      const [
        resumo,
        responsaveis,
        contasGerenciais,
        fluxoCaixa,
        previsoes,
        contasPagarVencidas,
        contasReceberVencidas,
        faturas,
        recorrencias,
        compras,
        comparativo,
        cartoesResult,
        contasPagarLancamentosResult,
        contasReceberLancamentosResult
      ] = await Promise.all([
        dashboardApi.obterResumo({ mesReferencia: referenceMonth }),
        dashboardApi.obterResumoPorResponsaveis({ mesReferencia: referenceMonth }),
        dashboardApi.obterResumoContasGerenciais({
          mesReferencia: referenceMonth,
          tipo: contaTipo[0] as DashboardContaGerencialTipo | undefined,
          responsavelId: responsavelId || undefined
        }),
        dashboardApi.obterFluxoCaixa({ mesReferencia: referenceMonth, dias: Number(fluxoDias) }),
        dashboardApi.obterResumoCentralPrevisao({
          mesReferencia: referenceMonth,
          origem: previsaoOrigem[0] as DashboardCentralPrevisaoOrigem | undefined,
          status: previsaoStatus[0] as DashboardCentralPrevisaoStatus | undefined
        }),
        (!inadimplenciaTipo.length || inadimplenciaTipo.includes('pagar'))
          ? financeiroApi.contasPagar.listar({
              page: 1,
              pageSize: MAX_REPORT_ROWS,
              search: deferredInadimplenciaSearch,
              statusCodigo: ['VENCIDA'],
              dataInicial: range.start,
              dataFinal: range.end,
              responsavelIds: responsavelId ? [responsavelId] : undefined,
              sortBy: 'dataVencimento',
              sortDirection: 'Asc'
            })
          : Promise.resolve(emptyPaged<ContaPagarResumo, ContaFinanceiraListSummary>()),
        (!inadimplenciaTipo.length || inadimplenciaTipo.includes('receber'))
          ? financeiroApi.contasReceber.listar({
              page: 1,
              pageSize: MAX_REPORT_ROWS,
              search: deferredInadimplenciaSearch,
              statusCodigo: ['VENCIDA'],
              dataInicial: range.start,
              dataFinal: range.end,
              responsavelIds: responsavelId ? [responsavelId] : undefined,
              sortBy: 'dataVencimento',
              sortDirection: 'Asc'
            })
          : Promise.resolve(emptyPaged<ContaReceberResumo, ContaFinanceiraListSummary>()),
        financeiroApi.faturas.listar({
          page: 1,
          pageSize: MAX_REPORT_ROWS,
          search: deferredFaturaSearch,
          competencia: referenceMonth,
          statusCodigo: faturaStatus[0] as StatusFaturaCodigo | undefined,
          sortBy: 'dataVencimento',
          sortDirection: 'Asc'
        }),
        financeiroApi.recorrencias.listar({
          page: 1,
          pageSize: MAX_REPORT_ROWS,
          search: deferredRecorrenciaSearch,
          tipo: recorrenciaTipo[0] as 'Pagar' | 'Receber' | undefined,
          ativa: recorrenciaAtiva[0] === 'true' ? true : recorrenciaAtiva[0] === 'false' ? false : undefined,
          dataReferenciaInicial: range.start,
          dataReferenciaFinal: range.end,
          sortBy: 'dataInicio',
          sortDirection: 'Asc'
        }),
        comprasPlanejadasApi.listar({
          page: 1,
          pageSize: MAX_REPORT_ROWS,
          search: deferredCompraSearch,
          status: compraStatus[0] as CompraPlanejadaStatus | undefined,
          prioridade: compraPrioridade[0] as CompraPlanejadaPrioridade | undefined,
          dataDesejadaInicial: range.start,
          dataDesejadaFinal: range.end,
          responsavelId: responsavelId || undefined,
          sortBy: 'dataDesejada',
          sortDirection: 'Asc'
        }),
        dashboardApi.obterComparativoMensal({ meses: Number(comparativoMeses) }),
        cadastrosApi.cartoes.listar({ page: 1, pageSize: 200 }),
        (!lancamentosTipo.length || lancamentosTipo.includes('pagar'))
          ? financeiroApi.contasPagar.listar({
              page: 1,
              pageSize: MAX_REPORT_ROWS,
              search: deferredLancamentosSearch,
              dataEmissaoInicial: range.start,
              dataEmissaoFinal: range.end,
              responsavelIds: lancamentosResponsavelId ? [lancamentosResponsavelId] : undefined,
              statusCodigo: lancamentosStatus[0] as StatusContaCodigo | undefined,
              sortBy: 'dataEmissao',
              sortDirection: 'Desc'
            })
          : Promise.resolve(emptyPaged<ContaPagarResumo, ContaFinanceiraListSummary>()),
        (!lancamentosTipo.length || lancamentosTipo.includes('receber'))
          ? financeiroApi.contasReceber.listar({
              page: 1,
              pageSize: MAX_REPORT_ROWS,
              search: deferredLancamentosSearch,
              dataEmissaoInicial: range.start,
              dataEmissaoFinal: range.end,
              responsavelIds: lancamentosResponsavelId ? [lancamentosResponsavelId] : undefined,
              statusCodigo: lancamentosStatus[0] as StatusContaCodigo | undefined,
              sortBy: 'dataEmissao',
              sortDirection: 'Desc'
            })
          : Promise.resolve(emptyPaged<ContaReceberResumo, ContaFinanceiraListSummary>())
      ]);
      return {
        resumo,
        responsaveis,
        contasGerenciais,
        fluxoCaixa,
        previsoes,
        contasPagarVencidas,
        contasReceberVencidas,
        faturas,
        recorrencias,
        compras,
        comparativo,
        cartoes: cartoesResult.items,
        contasPagarLancamentos: contasPagarLancamentosResult,
        contasReceberLancamentos: contasReceberLancamentosResult
      };
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev
  });

  const data: ReportState = reportData ?? {};
  const errorMessage = reportError instanceof Error ? reportError.message : reportError ? 'Falha ao carregar relatórios.' : undefined;

  const responsaveis = data.responsaveis?.itens ?? [];
  const contasGerenciais = data.contasGerenciais?.itens ?? [];
  const fluxoItens = data.fluxoCaixa?.itens ?? [];
  const previsoes = useMemo(() => data.previsoes?.itens ?? [], [data.previsoes]);
  const inadimplenciaRows = buildInadimplenciaRows(data);
  const faturas = data.faturas?.items ?? [];
  const recorrencias = data.recorrencias?.items ?? [];
  const compras = data.compras?.items ?? [];
  const cartoes = data.cartoes ?? [];

  // Client-side derived filters
  const responsaveisFiltrados = useMemo(() => {
    const q = deferredResponsaveisSearch.toLowerCase();
    return q ? responsaveis.filter((r) => r.responsavelNome.toLowerCase().includes(q)) : responsaveis;
  }, [responsaveis, deferredResponsaveisSearch]);

  const contasGerenciaisFiltradas = useMemo(() => {
    const q = deferredContasGerenciaisSearch.toLowerCase();
    return q
      ? contasGerenciais.filter(
          (c) => c.descricao.toLowerCase().includes(q) || (c.codigo ?? '').toLowerCase().includes(q)
        )
      : contasGerenciais;
  }, [contasGerenciais, deferredContasGerenciaisSearch]);

  const faturasFiltradas = useMemo(
    () => (faturaCartaoId ? faturas.filter((f) => f.cartaoId === faturaCartaoId) : faturas),
    [faturas, faturaCartaoId]
  );

  const responsavelOptions = useMemo(
    () => (data.responsaveis?.itens ?? []).map((r) => ({ value: r.responsavelId ?? '', label: r.responsavelNome })),
    [data.responsaveis]
  );

  const recorrenciasFiltradas = useMemo(() => {
    if (!responsavelId) return recorrencias;
    const option = responsavelOptions.find((o) => o.value === responsavelId);
    if (!option) return recorrencias;
    const name = option.label.toLowerCase();
    return recorrencias.filter((r) => r.responsavelNome?.toLowerCase() === name);
  }, [recorrencias, responsavelId, responsavelOptions]);

  const lancamentosRows = useMemo(() => {
    const pagar = (data.contasPagarLancamentos?.items ?? []).map((p) => ({
      tipo: 'Pagar' as const,
      id: p.id,
      grupoParcelamentoId: p.grupoParcelamentoId,
      descricao: p.descricao,
      quantidadeParcelas: p.quantidadeParcelas,
      pessoa: p.recebedorNome,
      responsavelNome: p.responsavelNome,
      dataEmissao: p.dataEmissao,
      dataVencimento: p.dataVencimento,
      dataLiquidacao: p.dataLiquidacao,
      formaPagamentoNome: p.formaPagamentoNome,
      valorLiquido: p.valorLiquido,
      statusNome: p.statusNome,
      statusCodigo: p.statusCodigo
    }));
    const receber = (data.contasReceberLancamentos?.items ?? []).map((r) => ({
      tipo: 'Receber' as const,
      id: r.id,
      grupoParcelamentoId: r.grupoParcelamentoId,
      descricao: r.descricao,
      quantidadeParcelas: r.quantidadeParcelas,
      pessoa: r.pagadorNome,
      responsavelNome: r.responsavelNome,
      dataEmissao: r.dataEmissao,
      dataVencimento: r.dataVencimento,
      dataLiquidacao: r.dataLiquidacao,
      formaPagamentoNome: r.formaPagamentoNome,
      valorLiquido: r.valorLiquido,
      statusNome: r.statusNome,
      statusCodigo: r.statusCodigo
    }));
    const seenGroups = new Set<string>();
    const grouped = [...pagar, ...receber].filter((item) => {
      if (!item.grupoParcelamentoId) return true;
      if (seenGroups.has(item.grupoParcelamentoId)) return false;
      seenGroups.add(item.grupoParcelamentoId);
      return true;
    });
    return grouped.sort((a, b) => {
      const resp = (a.responsavelNome ?? '').localeCompare(b.responsavelNome ?? '');
      if (resp !== 0) return resp;
      return b.dataEmissao.localeCompare(a.dataEmissao);
    });
  }, [data.contasPagarLancamentos, data.contasReceberLancamentos]);

  const maiorDespesaResponsavel = Math.max(1, ...responsaveisFiltrados.map((item) => item.totalDespesas));
  const maiorContaGerencial = Math.max(1, ...contasGerenciaisFiltradas.map((item) => item.valorTotal));
  const fluxosComRisco = fluxoItens.filter((item) => item.riscoSaldoNegativo).length;

  const previsaoResumo = useMemo(() => {
    return previsoes.reduce(
      (acc, item) => {
        if (item.tipoMovimentacao === 'Entrada') {
          acc.entradas += item.valorTotal;
        } else {
          acc.saidas += item.valorTotal;
        }
        acc.quantidade += item.quantidadeItens;
        return acc;
      },
      { entradas: 0, saidas: 0, quantidade: 0 }
    );
  }, [previsoes]);

  const inadimplenciaResumo = useMemo(() => {
    return inadimplenciaRows.reduce(
      (acc, item) => {
        acc.valor += item.valor;
        acc.maiorAtraso = Math.max(acc.maiorAtraso, item.dias);
        acc.faixas[agingBucket(item.dias)] = (acc.faixas[agingBucket(item.dias)] ?? 0) + item.valor;
        return acc;
      },
      { valor: 0, maiorAtraso: 0, faixas: {} as Record<string, number> }
    );
  }, [inadimplenciaRows]);

  // Cartões tab derived data
  const cartaoOptions = useMemo(
    () => cartoes.map((c) => ({ value: c.id, label: `${c.nome} (${c.numeroFinal})` })),
    [cartoes]
  );

  const faturasPorCartao = useMemo(() => {
    const map = new Map<string, typeof faturas[number]>();
    for (const f of faturas) {
      if (f.cartaoId) map.set(f.cartaoId, f);
    }
    return map;
  }, [faturas]);

  const cartoesAtivos = useMemo(() => cartoes.filter((c) => c.ativo), [cartoes]);
  const totalDisponivel = useMemo(
    () => cartoesAtivos.reduce((sum, c) => sum + (c.limiteDisponivel ?? 0), 0),
    [cartoesAtivos]
  );
  const totalFaturaMes = useMemo(
    () => faturas.reduce((sum, f) => sum + f.valorTotal, 0),
    [faturas]
  );

  function handleExportExcel() {
    downloadReportWorkbook(buildExportDefinition(activeReport, referenceMonth, data));
  }

  if (loading && !data.resumo) {
    return <PageState state="loading" title="Carregando relatórios" />;
  }

  return (
    <div className="printable-report space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <p className="max-w-2xl text-sm text-on-surface-variant">
          Leitura gerencial do período com base em lançamentos, rateios, responsáveis, previsões, faturas e compras planejadas.
        </p>

        <div className="report-actions flex flex-col gap-3">
          <DateInput
            compact
            mode="month"
            ariaLabel="Mês de referência do relatório"
            value={referenceMonth}
            onChange={(value) => setReferenceMonth(value || getCurrentReferenceMonth())}
            className="min-w-[220px]"
          />
          <div className="flex gap-3">
            <Button
              type="button"
              variant="primary"
              className="flex-1"
              onClick={handleExportExcel}
              icon={<span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>table_view</span>}
            >
              Excel
            </Button>
            <Button
              type="button"
              variant="primary"
              className="flex-1"
              onClick={exportarPdf}
              icon={<span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>picture_as_pdf</span>}
            >
              PDF
            </Button>
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-error/30 bg-error/10 p-4 text-sm font-bold text-error">{errorMessage}</div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Saldo atual" value={formatCurrencyBRL(data.resumo?.saldoAtual ?? 0)} tone="success" />
        <MetricCard label="A pagar" value={formatCurrencyBRL(data.resumo?.totalAPagar ?? 0)} tone="danger" />
        <MetricCard label="A receber" value={formatCurrencyBRL(data.resumo?.totalAReceber ?? 0)} tone="success" />
        <MetricCard
          label="Saldo projetado"
          value={formatCurrencyBRL(data.resumo?.saldoProjetado ?? 0)}
          tone={data.resumo?.riscoSaldoNegativo ? 'danger' : 'neutral'}
          hint={data.resumo?.riscoSaldoNegativo ? 'Há risco de saldo negativo.' : undefined}
        />
      </div>

      <div className="report-tabs rounded-2xl border border-white/5 bg-surface-container-low p-2">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
          {reportTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveReport(tab.key)}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition-colors ${
                activeReport === tab.key
                  ? 'bg-primary/20 text-primary shadow-[0_0_18px_rgba(43,245,142,0.12)]'
                  : 'text-on-surface-variant hover:bg-primary/10 hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="text-sm font-bold text-primary">Atualizando relatórios...</div> : null}

      {/* ── Visão geral ─────────────────────────────────────────────────────── */}
      {activeReport === 'geral' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <MetricCard
              label="Contas vencidas"
              value={data.resumo?.contasVencidas.length ?? 0}
              tone={(data.resumo?.contasVencidas.length ?? 0) > 0 ? 'danger' : 'success'}
              hint={formatCurrencyBRL(data.resumo?.contasVencidas.reduce((total, item) => total + item.valor, 0) ?? 0)}
            />
            <MetricCard label="Próximos vencimentos" value={data.resumo?.contasAVencer.length ?? 0} />
            <MetricCard label="Movimentações recentes" value={data.resumo?.movimentacoesRecentes.length ?? 0} />
          </div>

          <ReportTable headers={['Descrição', 'Pessoa', 'Vencimento', 'Status', 'Valor']} emptyText="Nenhuma conta vencida no período">
            {data.resumo?.contasVencidas.length
              ? data.resumo.contasVencidas.map((item) => (
                  <tr key={item.id} className="hover:bg-primary/5">
                    <td className="px-5 py-4 font-bold">{item.descricao}</td>
                    <td className="px-5 py-4 text-on-surface-variant">{item.pessoaNome}</td>
                    <td className="px-5 py-4 text-error">{formatDateBR(item.dataVencimento)}</td>
                    <td className="px-5 py-4">{item.statusNome}</td>
                    <td className="px-5 py-4 font-bold text-error">{formatCurrencyBRL(item.valor)}</td>
                  </tr>
                ))
              : null}
          </ReportTable>
        </div>
      ) : null}

      {/* ── Responsáveis ────────────────────────────────────────────────────── */}
      {activeReport === 'responsaveis' ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FilterInput
              label="Busca por responsável"
              value={responsaveisSearch}
              onChange={setResponsaveisSearch}
              placeholder="Nome do responsável"
            />
          </div>
          {responsaveisFiltrados.length === 0 ? (
            <PageState state="empty" title="Nenhum lançamento no período" subtitle="Ajuste o mês de referência ou registre lançamentos com responsável." />
          ) : (
            responsaveisFiltrados.map((item) => (
              <div key={item.responsavelId ?? 'sem-responsavel'} className="space-y-3 rounded-2xl border border-white/5 bg-surface-container px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 font-black text-primary">
                      {item.responsavelNome.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-base font-bold text-on-surface">{item.responsavelNome}</div>
                      <div className="text-xs text-on-surface-variant">{item.quantidadeLancamentos} lançamento(s)</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-5 text-right md:grid-cols-4">
                    <MetricInline label="Despesas" value={formatCurrencyBRL(item.totalDespesas)} tone="danger" />
                    <MetricInline label="Cartão" value={formatCurrencyBRL(item.totalDespesasCartao)} tone="warning" />
                    <MetricInline label="Receitas" value={formatCurrencyBRL(item.totalReceitas)} tone="success" />
                    <MetricInline label="Saldo" value={formatCurrencyBRL(item.saldoLiquido)} />
                  </div>
                </div>
                <div className="flex h-2 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full bg-tertiary" style={{ width: `${(item.totalDespesasCartao / maiorDespesaResponsavel) * 100}%` }} />
                  <div
                    className="h-full bg-primary/70"
                    style={{ width: `${((item.totalDespesas - item.totalDespesasCartao) / maiorDespesaResponsavel) * 100}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {/* ── Contas gerenciais ───────────────────────────────────────────────── */}
      {activeReport === 'contas-gerenciais' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricCard label="Receitas" value={formatCurrencyBRL(data.contasGerenciais?.totalReceitas ?? 0)} tone="success" />
            <MetricCard label="Despesas" value={formatCurrencyBRL(data.contasGerenciais?.totalDespesas ?? 0)} tone="danger" />
            <MetricCard label="Saldo" value={formatCurrencyBRL(data.contasGerenciais?.saldo ?? 0)} />
            <FilterCombo label="Tipo" value={contaTipo} onChange={setContaTipo} options={contaTipoOptions} ariaLabel="Tipo de conta gerencial" />
            <FilterCombo
              label="Responsável"
              value={responsavelId ? [responsavelId] : []}
              onChange={(v) => setResponsavelId(v[0] ?? '')}
              options={responsavelOptions}
              ariaLabel="Responsável (contas gerenciais)"
            />
            <div className="md:col-span-3">
              <FilterInput
                label="Busca"
                value={contasGerenciaisSearch}
                onChange={setContasGerenciaisSearch}
                placeholder="Descrição ou código da conta"
              />
            </div>
          </div>

          <div className="space-y-4">
            {contasGerenciaisFiltradas.length === 0 ? (
              <PageState
                state="empty"
                title="Nenhuma conta gerencial com movimento"
                subtitle="Ajuste o tipo ou o mês de referência para buscar lançamentos rateados."
              />
            ) : (
              contasGerenciaisFiltradas.map((item) => (
                <div key={item.contaGerencialId} className="rounded-2xl border border-white/5 bg-surface-container p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-on-surface">
                        {item.codigo ? `${item.codigo} - ` : ''}
                        {item.descricao}
                      </div>
                      <div className="text-xs text-on-surface-variant">
                        {item.quantidadeLancamentos} lançamento(s) · última movimentação em {formatDateBR(item.ultimaDataLancamento)}
                      </div>
                    </div>
                    <div className={`font-headline text-xl font-extrabold ${item.tipo === 'Receita' ? 'text-primary' : 'text-error'}`}>
                      {formatCurrencyBRL(item.valorTotal)}
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className={item.tipo === 'Receita' ? 'h-full bg-primary' : 'h-full bg-error'}
                      style={{ width: `${(item.valorTotal / maiorContaGerencial) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      {/* ── Fluxo de caixa ──────────────────────────────────────────────────── */}
      {activeReport === 'fluxo-caixa' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricCard label="Dias projetados" value={data.fluxoCaixa?.dias ?? 0} />
            <MetricCard label="Dias com risco" value={fluxosComRisco} tone={fluxosComRisco > 0 ? 'danger' : 'success'} />
            <MetricCard
              label="Saldo final do período"
              value={formatCurrencyBRL(fluxoItens.at(-1)?.saldoFinalPrevisto ?? 0)}
              tone={(fluxoItens.at(-1)?.saldoFinalPrevisto ?? 0) < 0 ? 'danger' : 'neutral'}
            />
            <div className="space-y-2">
              <label className="px-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Horizonte</label>
              <ComboBox value={fluxoDias} onChange={setFluxoDias} options={fluxoDiasOptions} aria-label="Horizonte do fluxo de caixa" />
            </div>
          </div>

          <ReportTable headers={['Data', 'Saldo inicial', 'Entradas', 'Saídas', 'Saldo final', 'Risco']} emptyText="Nenhuma projeção de fluxo encontrada">
            {fluxoItens.length
              ? fluxoItens.map((item) => (
                  <tr key={item.data} className={item.riscoSaldoNegativo ? 'bg-error/5 hover:bg-error/10' : 'hover:bg-primary/5'}>
                    <td className="px-5 py-4 font-bold">{formatDateBR(item.data)}</td>
                    <td className="px-5 py-4">{formatCurrencyBRL(item.saldoInicial)}</td>
                    <td className="px-5 py-4 text-primary">{formatCurrencyBRL(item.entradasPrevistas)}</td>
                    <td className="px-5 py-4 text-error">{formatCurrencyBRL(item.saidasPrevistas)}</td>
                    <td className="px-5 py-4 font-bold">{formatCurrencyBRL(item.saldoFinalPrevisto)}</td>
                    <td className={`px-5 py-4 font-bold ${item.riscoSaldoNegativo ? 'text-error' : 'text-primary'}`}>
                      {item.riscoSaldoNegativo ? 'Saldo negativo' : 'Normal'}
                    </td>
                  </tr>
                ))
              : null}
          </ReportTable>
        </div>
      ) : null}

      {/* ── Previsões ───────────────────────────────────────────────────────── */}
      {activeReport === 'previsoes' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <MetricCard label="Entradas previstas" value={formatCurrencyBRL(previsaoResumo.entradas)} tone="success" />
            <MetricCard label="Saídas previstas" value={formatCurrencyBRL(previsaoResumo.saidas)} tone="danger" />
            <MetricCard label="Saldo previsto" value={formatCurrencyBRL(previsaoResumo.entradas - previsaoResumo.saidas)} />
            <FilterCombo label="Origem" value={previsaoOrigem} onChange={setPrevisaoOrigem} options={origemOptions} ariaLabel="Origem da previsão" />
            <FilterCombo label="Status" value={previsaoStatus} onChange={setPrevisaoStatus} options={statusPrevisaoOptions} ariaLabel="Status da previsão" />
          </div>

          <ReportTable headers={['Data', 'Origem', 'Status', 'Tipo', 'Itens', 'Valor']} emptyText="Nenhuma previsão encontrada">
            {previsoes.length
              ? previsoes.map((item) => (
                  <tr key={`${item.data}-${item.origem}-${item.status}-${item.tipoMovimentacao}`} className="hover:bg-primary/5">
                    <td className="px-5 py-4 font-bold">{formatDateBR(item.data)}</td>
                    <td className="px-5 py-4">{origemLabels[item.origem]}</td>
                    <td className="px-5 py-4">{statusLabels[item.status]}</td>
                    <td className={`px-5 py-4 font-bold ${item.tipoMovimentacao === 'Entrada' ? 'text-primary' : 'text-error'}`}>
                      {item.tipoMovimentacao}
                    </td>
                    <td className="px-5 py-4">{item.quantidadeItens}</td>
                    <td className="px-5 py-4 font-bold">{formatCurrencyBRL(item.valorTotal)}</td>
                  </tr>
                ))
              : null}
          </ReportTable>
        </div>
      ) : null}

      {/* ── Inadimplência ───────────────────────────────────────────────────── */}
      {activeReport === 'inadimplencia' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricCard label="Total vencido" value={formatCurrencyBRL(inadimplenciaResumo.valor)} tone="danger" />
            <MetricCard label="Títulos vencidos" value={inadimplenciaRows.length} tone={inadimplenciaRows.length ? 'danger' : 'success'} />
            <MetricCard label="Maior atraso" value={`${inadimplenciaResumo.maiorAtraso} dia(s)`} />
            <FilterCombo
              label="Tipo"
              value={inadimplenciaTipo}
              onChange={setInadimplenciaTipo}
              options={inadimplenciaTipoOptions}
              ariaLabel="Tipo de inadimplência"
            />
            <FilterCombo
              label="Responsável"
              value={responsavelId ? [responsavelId] : []}
              onChange={(v) => setResponsavelId(v[0] ?? '')}
              options={responsavelOptions}
              ariaLabel="Responsável (inadimplência)"
            />
            <div className="md:col-span-3">
              <FilterInput
                label="Busca"
                value={inadimplenciaSearch}
                onChange={setInadimplenciaSearch}
                placeholder="Descrição, pessoa ou documento"
              />
            </div>
          </div>

          <ReportTable
            headers={['Tipo', 'Descrição', 'Pessoa', 'Vencimento', 'Dias em atraso', 'Faixa', 'Status', 'Valor']}
            emptyText="Nenhum título vencido no período"
          >
            {inadimplenciaRows.length
              ? inadimplenciaRows.map((item) => (
                  <tr key={`${item.tipo}-${item.id}`} className="hover:bg-primary/5">
                    <td className="px-5 py-4 font-bold">{item.tipo}</td>
                    <td className="px-5 py-4 font-bold">{item.descricao}</td>
                    <td className="px-5 py-4 text-on-surface-variant">{item.pessoa}</td>
                    <td className="px-5 py-4 text-error">{formatDateBR(item.vencimento)}</td>
                    <td className="px-5 py-4">{item.dias}</td>
                    <td className="px-5 py-4">{agingBucket(item.dias)}</td>
                    <td className="px-5 py-4">{item.status}</td>
                    <td className="px-5 py-4 font-bold text-error">{formatCurrencyBRL(item.valor)}</td>
                  </tr>
                ))
              : null}
          </ReportTable>
        </div>
      ) : null}

      {/* ── Faturas ─────────────────────────────────────────────────────────── */}
      {activeReport === 'faturas' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricCard label="Faturas" value={faturasFiltradas.length} />
            <MetricCard label="Valor total" value={formatCurrencyBRL(faturasFiltradas.reduce((t, f) => t + f.valorTotal, 0))} />
            <FilterCombo label="Status" value={faturaStatus} onChange={setFaturaStatus} options={faturaStatusOptions} ariaLabel="Status da fatura" />
            <FilterCombo
              label="Cartão"
              value={faturaCartaoId ? [faturaCartaoId] : []}
              onChange={(v) => setFaturaCartaoId(v[0] ?? '')}
              options={cartaoOptions}
              ariaLabel="Cartão da fatura"
            />
            <div className="md:col-span-4">
              <FilterInput label="Busca" value={faturaSearch} onChange={setFaturaSearch} placeholder="Cartão ou competência" />
            </div>
          </div>

          <ReportTable headers={['Cartão', 'Competência', 'Fechamento', 'Vencimento', 'Status', 'Itens', 'Valor']} emptyText="Nenhuma fatura encontrada">
            {faturasFiltradas.length
              ? faturasFiltradas.map((item) => (
                  <tr key={item.id} className="hover:bg-primary/5">
                    <td className="px-5 py-4 font-bold">{item.cartaoNome}</td>
                    <td className="px-5 py-4">{item.competencia}</td>
                    <td className="px-5 py-4">{formatDateBR(item.dataFechamento)}</td>
                    <td className="px-5 py-4">{formatDateBR(item.dataVencimento)}</td>
                    <td className="px-5 py-4">{item.statusNome}</td>
                    <td className="px-5 py-4">{item.quantidadeItens}</td>
                    <td className="px-5 py-4 font-bold">{formatCurrencyBRL(item.valorTotal)}</td>
                  </tr>
                ))
              : null}
          </ReportTable>
        </div>
      ) : null}

      {/* ── Cartões ─────────────────────────────────────────────────────────── */}
      {activeReport === 'cartoes' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <MetricCard label="Cartões ativos" value={cartoesAtivos.length} />
            <MetricCard label="Disponível total" value={formatCurrencyBRL(totalDisponivel)} tone="success" />
            <MetricCard label="Fatura do mês" value={formatCurrencyBRL(totalFaturaMes)} tone="warning" />
          </div>

          {cartoesAtivos.length === 0 ? (
            <PageState state="empty" title="Nenhum cartão ativo" subtitle="Cadastre um cartão de crédito para visualizar este relatório." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {cartoesAtivos.map((cartao) => {
                const fatura = faturasPorCartao.get(cartao.id);
                const limite = cartao.limiteEfetivo ?? cartao.limiteCredito ?? 0;
                const pct = limite > 0 ? Math.min((cartao.limiteComprometido / limite) * 100, 100) : 0;
                const statusColor =
                  fatura?.statusCodigo === 'PAGA'
                    ? 'text-primary'
                    : fatura?.statusCodigo === 'FECHADA'
                    ? 'text-error'
                    : 'text-tertiary';
                return (
                  <div key={cartao.id} className="rounded-2xl border border-white/5 bg-surface-container p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-on-surface">{cartao.nome}</div>
                        <div className="text-xs text-on-surface-variant">{cartao.bandeira} · •••• {cartao.numeroFinal}</div>
                      </div>
                      {fatura ? (
                        <div className="text-right shrink-0">
                          <div className={`font-bold ${statusColor}`}>{formatCurrencyBRL(fatura.valorTotal)}</div>
                          <div className="text-xs text-on-surface-variant">{fatura.statusNome}</div>
                        </div>
                      ) : (
                        <div className="text-xs text-on-surface-variant">Sem fatura no mês</div>
                      )}
                    </div>

                    {limite > 0 ? (
                      <>
                        <div className="flex h-2 overflow-hidden rounded-full bg-white/5">
                          <div
                            className={`h-full rounded-full transition-all ${pct > 85 ? 'bg-error' : pct > 60 ? 'bg-tertiary' : 'bg-primary'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Limite</div>
                            <div className="text-sm font-bold text-on-surface">{formatCurrencyBRL(limite)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Usado</div>
                            <div className="text-sm font-bold text-error">{formatCurrencyBRL(cartao.limiteComprometido)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Disponível</div>
                            <div className="text-sm font-bold text-primary">{formatCurrencyBRL(cartao.limiteDisponivel ?? 0)}</div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-on-surface-variant italic">Sem limite cadastrado</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {/* ── Lançamentos (a pagar / a receber) ───────────────────────────────── */}
      {activeReport === 'lancamentos' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricCard
              label="Total a pagar"
              value={formatCurrencyBRL(data.contasPagarLancamentos?.summary?.valorTotal ?? 0)}
              tone="danger"
            />
            <MetricCard
              label="Total a receber"
              value={formatCurrencyBRL(data.contasReceberLancamentos?.summary?.valorTotal ?? 0)}
              tone="success"
            />
            <MetricCard label="Lançamentos" value={(data.contasPagarLancamentos?.totalItems ?? 0) + (data.contasReceberLancamentos?.totalItems ?? 0)} />
            <FilterCombo
              label="Tipo"
              value={lancamentosTipo}
              onChange={setLancamentosTipo}
              options={lancamentosTipoOptions}
              ariaLabel="Tipo de lançamento"
            />
            <FilterCombo
              label="Status"
              value={lancamentosStatus}
              onChange={setLancamentosStatus}
              options={lancamentosStatusOptions}
              ariaLabel="Status do lançamento"
            />
            <FilterCombo
              label="Responsável"
              value={lancamentosResponsavelId ? [lancamentosResponsavelId] : []}
              onChange={(v) => setLancamentosResponsavelId(v[0] ?? '')}
              options={responsavelOptions}
              ariaLabel="Responsável (lançamentos)"
            />
            <div className="md:col-span-1">
              <FilterInput
                label="Busca"
                value={lancamentosSearch}
                onChange={setLancamentosSearch}
                placeholder="Descrição ou pessoa"
              />
            </div>
          </div>

          <ReportTable
            headers={['Tipo', 'Descrição', 'Parcela', 'Pessoa', 'Responsável', 'Emissão', 'Vencimento', 'Liquidação', 'Forma', 'Valor', 'Status']}
            emptyText="Nenhum lançamento encontrado no período"
          >
            {lancamentosRows.length
              ? lancamentosRows.map((item) => {
                  const statusClass =
                    item.statusCodigo === 'LIQUIDADA'
                      ? 'text-primary'
                      : item.statusCodigo === 'VENCIDA'
                      ? 'text-error'
                      : item.statusCodigo === 'CANCELADA'
                      ? 'text-on-surface-variant'
                      : item.statusCodigo === 'PARCIAL'
                      ? 'text-tertiary'
                      : 'text-on-surface';
                  return (
                    <tr key={`${item.tipo}-${item.id}`} className="hover:bg-primary/5">
                      <td className={`px-5 py-4 font-bold text-xs ${item.tipo === 'Pagar' ? 'text-error' : 'text-primary'}`}>{item.tipo}</td>
                      <td className="px-5 py-4 font-bold">{item.descricao}</td>
                      <td className="px-5 py-4 text-on-surface-variant text-sm">
                        {item.grupoParcelamentoId && item.quantidadeParcelas > 1 ? `${item.quantidadeParcelas}x` : '-'}
                      </td>
                      <td className="px-5 py-4 text-on-surface-variant">{item.pessoa}</td>
                      <td className="px-5 py-4 text-on-surface-variant">{item.responsavelNome ?? '-'}</td>
                      <td className="px-5 py-4">{formatDateBR(item.dataEmissao)}</td>
                      <td className="px-5 py-4">{formatDateBR(item.dataVencimento)}</td>
                      <td className="px-5 py-4">{item.dataLiquidacao ? formatDateBR(item.dataLiquidacao) : '-'}</td>
                      <td className="px-5 py-4 text-on-surface-variant">{item.formaPagamentoNome}</td>
                      <td className={`px-5 py-4 font-bold ${item.tipo === 'Pagar' ? 'text-error' : 'text-primary'}`}>
                        {formatCurrencyBRL(item.valorLiquido)}
                      </td>
                      <td className={`px-5 py-4 font-bold ${statusClass}`}>{item.statusNome}</td>
                    </tr>
                  );
                })
              : null}
          </ReportTable>
        </div>
      ) : null}

      {/* ── Recorrências ────────────────────────────────────────────────────── */}
      {activeReport === 'recorrencias' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricCard label="Recorrências" value={data.recorrencias?.totalItems ?? 0} />
            <MetricCard label="Valor mensal" value={formatCurrencyBRL(recorrenciasFiltradas.reduce((total, item) => total + item.valorLiquido, 0))} />
            <FilterCombo label="Tipo" value={recorrenciaTipo} onChange={setRecorrenciaTipo} options={recorrenciaTipoOptions} ariaLabel="Tipo de recorrência" />
            <FilterCombo label="Situação" value={recorrenciaAtiva} onChange={setRecorrenciaAtiva} options={ativoOptions} ariaLabel="Situação da recorrência" />
            <FilterCombo
              label="Responsável"
              value={responsavelId ? [responsavelId] : []}
              onChange={(v) => setResponsavelId(v[0] ?? '')}
              options={responsavelOptions}
              ariaLabel="Responsável (recorrências)"
            />
            <div className="md:col-span-3">
              <FilterInput label="Busca" value={recorrenciaSearch} onChange={setRecorrenciaSearch} placeholder="Descrição, pessoa ou responsável" />
            </div>
          </div>

          <ReportTable headers={['Tipo', 'Descrição', 'Pessoa', 'Responsável', 'Valor', 'Início', 'Fim', 'Dia', 'Situação']} emptyText="Nenhuma recorrência encontrada">
            {recorrenciasFiltradas.length
              ? recorrenciasFiltradas.map((item) => (
                  <tr key={item.id} className="hover:bg-primary/5">
                    <td className="px-5 py-4 font-bold">{getRecorrenciaTipoLabel(item.contaOrigemTipo)}</td>
                    <td className="px-5 py-4 font-bold">{item.descricao}</td>
                    <td className="px-5 py-4 text-on-surface-variant">{item.pessoaNome}</td>
                    <td className="px-5 py-4 text-on-surface-variant">{item.responsavelNome ?? '-'}</td>
                    <td className="px-5 py-4 font-bold">{formatCurrencyBRL(item.valorLiquido)}</td>
                    <td className="px-5 py-4">{formatDateBR(item.dataInicio)}</td>
                    <td className="px-5 py-4">{item.dataFim ? formatDateBR(item.dataFim) : '-'}</td>
                    <td className="px-5 py-4">{item.diaOrdemMensal}</td>
                    <td className={`px-5 py-4 font-bold ${item.ativa ? 'text-primary' : 'text-on-surface-variant'}`}>{item.ativa ? 'Ativa' : 'Pausada'}</td>
                  </tr>
                ))
              : null}

          </ReportTable>
        </div>
      ) : null}

      {/* ── Compras planejadas ──────────────────────────────────────────────── */}
      {activeReport === 'compras' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricCard label="Compras" value={data.compras?.totalItems ?? 0} />
            <MetricCard
              label="Total estimado"
              value={formatCurrencyBRL(data.compras?.summary?.valorTotalEstimado ?? compras.reduce((total, item) => total + item.valorEstimado, 0))}
              tone="warning"
            />
            <FilterCombo label="Status" value={compraStatus} onChange={setCompraStatus} options={compraStatusOptions} ariaLabel="Status da compra planejada" />
            <FilterCombo
              label="Prioridade"
              value={compraPrioridade}
              onChange={setCompraPrioridade}
              options={compraPrioridadeOptions}
              ariaLabel="Prioridade da compra planejada"
            />
            <FilterCombo
              label="Responsável"
              value={responsavelId ? [responsavelId] : []}
              onChange={(v) => setResponsavelId(v[0] ?? '')}
              options={responsavelOptions}
              ariaLabel="Responsável (compras planejadas)"
            />
            <div className="md:col-span-3">
              <FilterInput label="Busca" value={compraSearch} onChange={setCompraSearch} placeholder="Título, conta, responsável ou link" />
            </div>
          </div>

          <ReportTable
            headers={['Título', 'Responsável', 'Conta gerencial', 'Prioridade', 'Status', 'Data desejada', 'Parcelas', 'Valor', 'Link']}
            emptyText="Nenhuma compra planejada encontrada"
          >
            {compras.length
              ? compras.map((item) => (
                  <tr key={item.id} className="hover:bg-primary/5">
                    <td className="px-5 py-4 font-bold">{item.titulo}</td>
                    <td className="px-5 py-4 text-on-surface-variant">{item.responsavelNome}</td>
                    <td className="px-5 py-4 text-on-surface-variant">{item.contaGerencialDescricao}</td>
                    <td className="px-5 py-4">{item.prioridade === 'Media' ? 'Média' : item.prioridade}</td>
                    <td className="px-5 py-4">{item.status}</td>
                    <td className="px-5 py-4">{item.dataDesejada ? formatDateBR(item.dataDesejada) : '-'}</td>
                    <td className="px-5 py-4">{item.parcelavel ? `${item.quantidadeParcelasDesejada ?? 1}x` : 'Única'}</td>
                    <td className="px-5 py-4 font-bold">{formatCurrencyBRL(item.valorEstimado)}</td>
                    <td className="max-w-[220px] truncate px-5 py-4 text-on-surface-variant">{item.link ?? '-'}</td>
                  </tr>
                ))
              : null}
          </ReportTable>
        </div>
      ) : null}

      {/* ── Comparativo mensal (inclui balanço) ─────────────────────────────── */}
      {activeReport === 'comparativo' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricCard
              label="Receitas (mês atual)"
              value={formatCurrencyBRL(data.comparativo?.itens.at(-1)?.receitas ?? 0)}
              tone="success"
            />
            <MetricCard
              label="Despesas (mês atual)"
              value={formatCurrencyBRL(data.comparativo?.itens.at(-1)?.despesas ?? 0)}
              tone="danger"
            />
            <MetricCard
              label="Saldo (mês atual)"
              value={formatCurrencyBRL(data.comparativo?.itens.at(-1)?.saldo ?? 0)}
              tone={(data.comparativo?.itens.at(-1)?.saldo ?? 0) >= 0 ? 'neutral' : 'danger'}
            />
            <div className="space-y-2">
              <label className="px-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Período</label>
              <ComboBox value={comparativoMeses} onChange={setComparativoMeses} options={comparativoMesesOptions} aria-label="Quantidade de meses do comparativo" />
            </div>
          </div>

          {(data.comparativo?.itens.length ?? 0) === 0 ? (
            <PageState state="empty" title="Sem dados comparativos" subtitle="Registre lançamentos para visualizar o comparativo mensal." />
          ) : (
            <>
              {/* Gráfico: Receitas vs Despesas */}
              <div className="rounded-2xl border border-white/5 bg-surface-container-low p-5 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Receitas vs Despesas</p>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.comparativo?.itens} margin={{ top: 4, right: 8, left: 8, bottom: 4 }} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="competenciaLabel" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1f26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                      labelStyle={{ color: 'rgba(255,255,255,0.8)', fontWeight: 'bold' }}
                      formatter={(value) => formatCurrencyBRL(value as number)}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                    <Bar dataKey="receitas" name="Receitas" fill="#2bf58e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="despesas" name="Despesas" fill="#f0857f" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Tabela comparativa completa */}
              <ReportTable headers={['Mês', 'Receitas', 'Var. rec.', 'Despesas', 'Var. desp.', 'Saldo']} emptyText="">
                {(data.comparativo?.itens ?? []).map((item) => (
                  <tr key={item.competencia} className="hover:bg-primary/5">
                    <td className="px-5 py-4 font-bold text-on-surface">{item.competenciaLabel}</td>
                    <td className="px-5 py-4 text-primary font-bold">{formatCurrencyBRL(item.receitas)}</td>
                    <td className="px-5 py-4 text-xs">
                      {item.variacaoReceitas !== null ? (
                        <span className={item.variacaoReceitas >= 0 ? 'text-primary' : 'text-error'}>
                          {item.variacaoReceitas >= 0 ? '+' : ''}{item.variacaoReceitas.toFixed(1)}%
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-4 text-error font-bold">{formatCurrencyBRL(item.despesas)}</td>
                    <td className="px-5 py-4 text-xs">
                      {item.variacaoDespesas !== null ? (
                        <span className={item.variacaoDespesas <= 0 ? 'text-primary' : 'text-error'}>
                          {item.variacaoDespesas >= 0 ? '+' : ''}{item.variacaoDespesas.toFixed(1)}%
                        </span>
                      ) : '—'}
                    </td>
                    <td className={`px-5 py-4 font-extrabold ${item.saldo >= 0 ? 'text-primary' : 'text-error'}`}>
                      {formatCurrencyBRL(item.saldo)}
                    </td>
                  </tr>
                ))}
              </ReportTable>

              {/* Gráfico: Receitas / Despesas / Saldo */}
              <div className="rounded-2xl border border-white/5 bg-surface-container-low p-5 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Balanço mensal — Receitas, Despesas e Saldo</p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={(data.comparativo?.itens ?? []).map((item) => ({
                      mes: item.competenciaLabel,
                      Receitas: item.receitas,
                      Despesas: item.despesas,
                      Saldo: item.saldo
                    }))}
                    margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="mes" tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => formatCurrencyBRL(v)} tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 10 }} axisLine={false} tickLine={false} width={90} />
                    <Tooltip formatter={(v) => formatCurrencyBRL(Number(v))} contentStyle={{ background: '#1a1f2c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Receitas" fill="#2bf58e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Saldo" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      ) : null}

      {/* ── DRE Doméstica ───────────────────────────────────────────────────── */}
      {activeReport === 'dre' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricCard label="Receitas" value={formatCurrencyBRL(data.contasGerenciais?.totalReceitas ?? 0)} tone="success" />
            <MetricCard label="Despesas" value={formatCurrencyBRL(data.contasGerenciais?.totalDespesas ?? 0)} tone="danger" />
            <MetricCard
              label="Resultado"
              value={formatCurrencyBRL(data.contasGerenciais?.saldo ?? 0)}
              tone={(data.contasGerenciais?.saldo ?? 0) >= 0 ? 'success' : 'danger'}
            />
            <FilterCombo
              label="Responsável"
              value={responsavelId ? [responsavelId] : []}
              onChange={(v) => setResponsavelId(v[0] ?? '')}
              options={responsavelOptions}
              ariaLabel="Responsável (DRE)"
            />
          </div>

          <div className="space-y-1 rounded-2xl border border-white/5 bg-surface-container-low overflow-hidden">
            <div className="bg-surface-container px-6 py-3">
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#2bf58e' }}>Receitas</span>
            </div>
            {(data.contasGerenciais?.itens.filter((i) => i.tipo === 'Receita') ?? []).map((item) => (
              <div key={item.contaGerencialId} className="flex items-center justify-between px-6 py-3 hover:bg-primary/5">
                <span className="text-sm text-on-surface">
                  {item.codigo ? `${item.codigo} · ` : ''}{item.descricao}
                </span>
                <span className="font-bold text-primary">{formatCurrencyBRL(item.valorTotal)}</span>
              </div>
            ))}
            {(data.contasGerenciais?.itens.filter((i) => i.tipo === 'Receita') ?? []).length === 0 && (
              <p className="px-6 py-3 text-sm text-on-surface-variant italic">Nenhuma receita no período.</p>
            )}
            <div className="flex items-center justify-between border-t border-white/10 bg-surface-container px-6 py-3">
              <span className="text-sm font-bold text-on-surface">Total Receitas</span>
              <span className="font-headline text-lg font-extrabold text-primary">{formatCurrencyBRL(data.contasGerenciais?.totalReceitas ?? 0)}</span>
            </div>

            <div className="bg-surface-container px-6 py-3 mt-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-error">Despesas</span>
            </div>
            {(data.contasGerenciais?.itens.filter((i) => i.tipo === 'Despesa') ?? []).map((item) => (
              <div key={item.contaGerencialId} className="flex items-center justify-between px-6 py-3 hover:bg-primary/5">
                <span className="text-sm text-on-surface">
                  {item.codigo ? `${item.codigo} · ` : ''}{item.descricao}
                </span>
                <span className="font-bold text-error">{formatCurrencyBRL(item.valorTotal)}</span>
              </div>
            ))}
            {(data.contasGerenciais?.itens.filter((i) => i.tipo === 'Despesa') ?? []).length === 0 && (
              <p className="px-6 py-3 text-sm text-on-surface-variant italic">Nenhuma despesa no período.</p>
            )}
            <div className="flex items-center justify-between border-t border-white/10 bg-surface-container px-6 py-3">
              <span className="text-sm font-bold text-on-surface">Total Despesas</span>
              <span className="font-headline text-lg font-extrabold text-error">{formatCurrencyBRL(data.contasGerenciais?.totalDespesas ?? 0)}</span>
            </div>

            <div className="flex items-center justify-between border-t-2 border-primary/30 px-6 py-4">
              <span className="font-headline text-base font-black uppercase tracking-widest text-on-surface">Resultado do Período</span>
              <span className={`font-headline text-2xl font-black ${(data.contasGerenciais?.saldo ?? 0) >= 0 ? 'text-primary' : 'text-error'}`}>
                {formatCurrencyBRL(data.contasGerenciais?.saldo ?? 0)}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Alertas inteligentes ────────────────────────────────────────────── */}
      {activeReport === 'alertas' ? (
        <div className="space-y-4">
          {buildAlertas(data).length === 0 ? (
            <PageState state="empty" title="Nenhum alerta no momento" subtitle="Todos os indicadores estão dentro dos parâmetros normais." />
          ) : (
            buildAlertas(data).map((alerta) => <AlertCard key={alerta.id} alerta={alerta} />)
          )}
        </div>
      ) : null}

      {/* ── Análises ────────────────────────────────────────────────────────── */}
      {activeReport === 'analises' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricCard label="Total receitas" value={formatCurrencyBRL(data.contasGerenciais?.totalReceitas ?? 0)} tone="success" />
            <MetricCard label="Total despesas" value={formatCurrencyBRL(data.contasGerenciais?.totalDespesas ?? 0)} tone="danger" />
            <MetricCard
              label="Resultado"
              value={formatCurrencyBRL(data.contasGerenciais?.saldo ?? 0)}
              tone={(data.contasGerenciais?.saldo ?? 0) >= 0 ? 'success' : 'danger'}
            />
            <FilterCombo label="Tipo" value={contaTipo} onChange={setContaTipo} options={contaTipoOptions} ariaLabel="Tipo de conta gerencial" />
            <FilterCombo
              label="Responsável"
              value={responsavelId ? [responsavelId] : []}
              onChange={(v) => setResponsavelId(v[0] ?? '')}
              options={responsavelOptions}
              ariaLabel="Responsável (análises)"
            />
          </div>

          <div className="rounded-3xl border border-white/5 bg-surface-container-low p-6 space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Despesas por categoria</p>
            {contasGerenciais.filter((c) => c.tipo === 'Despesa').length === 0 ? (
              <PageState state="empty" title="Sem despesas no período" subtitle="Nenhuma despesa foi lançada neste mês." />
            ) : (
              <div className="space-y-3">
                {contasGerenciais
                  .filter((c) => c.tipo === 'Despesa')
                  .sort((a, b) => b.valorTotal - a.valorTotal)
                  .map((item) => {
                    const pct = data.contasGerenciais?.totalDespesas
                      ? (item.valorTotal / data.contasGerenciais.totalDespesas) * 100
                      : 0;
                    return (
                      <div key={item.contaGerencialId}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-on-surface">{item.descricao}</span>
                          <div className="text-right">
                            <span className="text-sm font-bold text-error">{formatCurrencyBRL(item.valorTotal)}</span>
                            <span className="ml-2 text-xs text-on-surface-variant">{pct.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/5">
                          <div className="h-full bg-error/70" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/5 bg-surface-container-low p-6 space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Receitas vs Despesas — gráfico</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={[
                  { name: 'Receitas', valor: data.contasGerenciais?.totalReceitas ?? 0 },
                  { name: 'Despesas', valor: data.contasGerenciais?.totalDespesas ?? 0 }
                ]}
                margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => formatCurrencyBRL(v)} tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip formatter={(v) => formatCurrencyBRL(Number(v))} contentStyle={{ background: '#1a1f2c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                <Bar dataKey="valor" radius={[6, 6, 0, 0]} fill="#2bf58e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MetricInline({
  label,
  value,
  tone = 'neutral'
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'success' | 'danger' | 'warning';
}) {
  const toneClass = {
    neutral: 'text-on-surface',
    success: 'text-primary',
    danger: 'text-error',
    warning: 'text-tertiary'
  }[tone];

  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</div>
      <div className={`font-headline text-lg font-extrabold ${toneClass}`}>{value}</div>
    </div>
  );
}

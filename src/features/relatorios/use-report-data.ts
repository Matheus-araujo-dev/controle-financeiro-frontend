import { useCurrentUser } from '../../store/auth-store';
import { useQueries } from '@tanstack/react-query';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { comprasPlanejadasApi } from '../../services/http/compras-planejadas-api';
import { dashboardApi } from '../../services/http/dashboard-api';
import { financeiroApi } from '../../services/http/financeiro-api';
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
import { MAX_REPORT_ROWS, type ReportKey, type ReportState } from './relatorios-config';
import { emptyPaged, getMonthRange } from './relatorios-helpers';
import { loadAllReportPages, reportNeedsSource } from './report-data';

type ReportFilters = {
  referenceMonth: string;
  fluxoDias: string;
  contaTipo: string[];
  responsavelId: string;
  deferredContasGerenciaisSearch: string;
  deferredResponsaveisSearch: string;
  previsaoOrigem: string[];
  previsaoStatus: string[];
  inadimplenciaTipo: string[];
  deferredInadimplenciaSearch: string;
  faturaStatus: string[];
  deferredFaturaSearch: string;
  recorrenciaTipo: string[];
  recorrenciaAtiva: string[];
  deferredRecorrenciaSearch: string;
  compraStatus: string[];
  compraPrioridade: string[];
  deferredCompraSearch: string;
  comparativoMeses: string;
  lancamentosTipo: string[];
  lancamentosStatus: string[];
  lancamentosResponsavelId: string;
  deferredLancamentosSearch: string;
};
export function useReportData(activeReport: ReportKey, filters: ReportFilters) {
  const user = useCurrentUser();
  const { referenceMonth, fluxoDias, contaTipo, responsavelId, previsaoOrigem, previsaoStatus, inadimplenciaTipo, deferredInadimplenciaSearch, faturaStatus, deferredFaturaSearch, recorrenciaTipo, recorrenciaAtiva, deferredRecorrenciaSearch, compraStatus, compraPrioridade, deferredCompraSearch, comparativoMeses, lancamentosTipo, lancamentosStatus, lancamentosResponsavelId, deferredLancamentosSearch } = filters;
  const range = getMonthRange(referenceMonth);
  const sources = [
    { source: 'resumo' as const, filters: { referenceMonth }, queryFn: async (): Promise<ReportState> => ({ resumo: await dashboardApi.obterResumo({ mesReferencia: referenceMonth }) }) },
    { source: 'responsaveis' as const, filters: { referenceMonth }, queryFn: async (): Promise<ReportState> => ({ responsaveis: await dashboardApi.obterResumoPorResponsaveis({ mesReferencia: referenceMonth }) }) },
    { source: 'contasGerenciais' as const, filters: { referenceMonth, contaTipo, responsavelId }, queryFn: async (): Promise<ReportState> => ({ contasGerenciais: await dashboardApi.obterResumoContasGerenciais({
          mesReferencia: referenceMonth,
          tipo: contaTipo[0] as DashboardContaGerencialTipo | undefined,
          responsavelId: responsavelId || undefined
        }) }) },
    { source: 'fluxoCaixa' as const, filters: { referenceMonth, fluxoDias }, queryFn: async (): Promise<ReportState> => ({ fluxoCaixa: await dashboardApi.obterFluxoCaixa({ mesReferencia: referenceMonth, dias: Number(fluxoDias) }) }) },
    { source: 'previsoes' as const, filters: { referenceMonth, previsaoOrigem, previsaoStatus }, queryFn: async (): Promise<ReportState> => ({ previsoes: await dashboardApi.obterResumoCentralPrevisao({
          mesReferencia: referenceMonth,
          origem: previsaoOrigem[0] as DashboardCentralPrevisaoOrigem | undefined,
          status: previsaoStatus[0] as DashboardCentralPrevisaoStatus | undefined
        }) }) },
    { source: 'contasPagarVencidas' as const, filters: { responsavelId, inadimplenciaTipo, deferredInadimplenciaSearch, referenceMonth }, queryFn: async (): Promise<ReportState> => ({ contasPagarVencidas: await ((!inadimplenciaTipo.length || inadimplenciaTipo.includes('pagar'))
          ? loadAllReportPages((page) => financeiroApi.contasPagar.listar({
              page,
              pageSize: MAX_REPORT_ROWS,
              search: deferredInadimplenciaSearch,
              statusCodigo: ['VENCIDA'],
              dataInicial: range.start,
              dataFinal: range.end,
              responsavelIds: responsavelId ? [responsavelId] : undefined,
              sortBy: 'dataVencimento',
              sortDirection: 'Asc'
            }))
          : Promise.resolve(emptyPaged<ContaPagarResumo, ContaFinanceiraListSummary>())) }) },
    { source: 'contasReceberVencidas' as const, filters: { responsavelId, inadimplenciaTipo, deferredInadimplenciaSearch, referenceMonth }, queryFn: async (): Promise<ReportState> => ({ contasReceberVencidas: await ((!inadimplenciaTipo.length || inadimplenciaTipo.includes('receber'))
          ? loadAllReportPages((page) => financeiroApi.contasReceber.listar({
              page,
              pageSize: MAX_REPORT_ROWS,
              search: deferredInadimplenciaSearch,
              statusCodigo: ['VENCIDA'],
              dataInicial: range.start,
              dataFinal: range.end,
              responsavelIds: responsavelId ? [responsavelId] : undefined,
              sortBy: 'dataVencimento',
              sortDirection: 'Asc'
            }))
          : Promise.resolve(emptyPaged<ContaReceberResumo, ContaFinanceiraListSummary>())) }) },
    { source: 'faturas' as const, filters: { referenceMonth, faturaStatus, deferredFaturaSearch }, queryFn: async (): Promise<ReportState> => ({ faturas: await loadAllReportPages((page) => financeiroApi.faturas.listar({
          page,
          pageSize: MAX_REPORT_ROWS,
          search: deferredFaturaSearch,
          competencia: referenceMonth,
          statusCodigo: faturaStatus[0] as StatusFaturaCodigo | undefined,
          sortBy: 'dataVencimento',
          sortDirection: 'Asc'
        })) }) },
    { source: 'recorrencias' as const, filters: { recorrenciaTipo, recorrenciaAtiva, deferredRecorrenciaSearch, referenceMonth }, queryFn: async (): Promise<ReportState> => ({ recorrencias: await loadAllReportPages((page) => financeiroApi.recorrencias.listar({
          page,
          pageSize: MAX_REPORT_ROWS,
          search: deferredRecorrenciaSearch,
          tipo: recorrenciaTipo[0] as 'Pagar' | 'Receber' | undefined,
          ativa: recorrenciaAtiva[0] === 'true' ? true : recorrenciaAtiva[0] === 'false' ? false : undefined,
          dataReferenciaInicial: range.start,
          dataReferenciaFinal: range.end,
          sortBy: 'dataInicio',
          sortDirection: 'Asc'
        })) }) },
    { source: 'compras' as const, filters: { responsavelId, compraStatus, compraPrioridade, deferredCompraSearch, referenceMonth }, queryFn: async (): Promise<ReportState> => ({ compras: await loadAllReportPages((page) => comprasPlanejadasApi.listar({
          page,
          pageSize: MAX_REPORT_ROWS,
          search: deferredCompraSearch,
          status: compraStatus[0] as CompraPlanejadaStatus | undefined,
          prioridade: compraPrioridade[0] as CompraPlanejadaPrioridade | undefined,
          dataDesejadaInicial: range.start,
          dataDesejadaFinal: range.end,
          responsavelId: responsavelId || undefined,
          sortBy: 'dataDesejada',
          sortDirection: 'Asc'
        })) }) },
    { source: 'comparativo' as const, filters: { comparativoMeses }, queryFn: async (): Promise<ReportState> => ({ comparativo: await dashboardApi.obterComparativoMensal({ meses: Number(comparativoMeses) }) }) },
    { source: 'cartoes' as const, filters: {  }, queryFn: async (): Promise<ReportState> => ({ cartoes: (await loadAllReportPages((page) => cadastrosApi.cartoes.listar({ page, pageSize: 200 }))).items }) },
    { source: 'contasPagarLancamentos' as const, filters: { lancamentosTipo, lancamentosStatus, lancamentosResponsavelId, deferredLancamentosSearch, referenceMonth }, queryFn: async (): Promise<ReportState> => ({ contasPagarLancamentos: await ((!lancamentosTipo.length || lancamentosTipo.includes('pagar'))
          ? loadAllReportPages((page) => financeiroApi.contasPagar.listar({
              page,
              pageSize: MAX_REPORT_ROWS,
              search: deferredLancamentosSearch,
              dataEmissaoInicial: range.start,
              dataEmissaoFinal: range.end,
              responsavelIds: lancamentosResponsavelId ? [lancamentosResponsavelId] : undefined,
              statusCodigo: lancamentosStatus[0] as StatusContaCodigo | undefined,
              sortBy: 'dataEmissao',
              sortDirection: 'Desc'
            }))
          : Promise.resolve(emptyPaged<ContaPagarResumo, ContaFinanceiraListSummary>())) }) },
    { source: 'contasReceberLancamentos' as const, filters: { lancamentosTipo, lancamentosStatus, lancamentosResponsavelId, deferredLancamentosSearch, referenceMonth }, queryFn: async (): Promise<ReportState> => ({ contasReceberLancamentos: await ((!lancamentosTipo.length || lancamentosTipo.includes('receber'))
          ? loadAllReportPages((page) => financeiroApi.contasReceber.listar({
              page,
              pageSize: MAX_REPORT_ROWS,
              search: deferredLancamentosSearch,
              dataEmissaoInicial: range.start,
              dataEmissaoFinal: range.end,
              responsavelIds: lancamentosResponsavelId ? [lancamentosResponsavelId] : undefined,
              statusCodigo: lancamentosStatus[0] as StatusContaCodigo | undefined,
              sortBy: 'dataEmissao',
              sortDirection: 'Desc'
            }))
          : Promise.resolve(emptyPaged<ContaReceberResumo, ContaFinanceiraListSummary>())) }) },
  ];
  const results = useQueries({ queries: sources.map(({ source, filters: sourceFilters, queryFn }) => ({
    queryKey: ['relatorios', user?.userId, user?.workspace?.id ?? user?.familia?.id, source, sourceFilters], queryFn, enabled: reportNeedsSource(activeReport, source), staleTime: 30_000
  })) });
  const active = results.filter((_, index) => reportNeedsSource(activeReport, sources[index].source));
  const data: ReportState = Object.assign({}, ...active.map(result => result.data));
  return { data, loading: active.some(result => result.isFetching), errors: active.filter(result => result.error).map(result => result.error), ready: active.every(result => result.isSuccess && !result.isFetching) };
}

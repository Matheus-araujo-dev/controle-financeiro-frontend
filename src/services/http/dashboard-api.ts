import type {
  DashboardCentralPrevisaoItens,
  DashboardCentralPrevisaoItensFilters,
  DashboardCentralPrevisaoResumo,
  DashboardCentralPrevisaoResumoFilters,
  DashboardContaGerencialLancamentos,
  DashboardContaGerencialLancamentosFilters,
  DashboardContaGerencialResumo,
  DashboardContaGerencialResumoFilters,
  DashboardContaGerencialSerie,
  DashboardContaGerencialSerieFilters,
  DashboardFluxoCaixa,
  DashboardFluxoCaixaFilters,
  DashboardResumo,
  DashboardResumoFilters,
  DashboardResponsavelFilters,
  DashboardResponsavelResumo
} from '../../types/dashboard';
import { apiClient } from './api-client';

export const dashboardApi = {
  async obterResumo(params: DashboardResumoFilters = {}) {
    const response = await apiClient.get<DashboardResumo>('/dashboard/resumo', { params });
    return response.data;
  },
  async obterFluxoCaixa(params: DashboardFluxoCaixaFilters = {}) {
    const response = await apiClient.get<DashboardFluxoCaixa>('/dashboard/fluxo-caixa', { params });
    return response.data;
  },
  async obterResumoContasGerenciais(params: DashboardContaGerencialResumoFilters = {}) {
    const response = await apiClient.get<DashboardContaGerencialResumo>('/dashboard/contas-gerenciais/resumo', {
      params
    });
    return response.data;
  },
  async obterSerieContasGerenciais(params: DashboardContaGerencialSerieFilters = {}) {
    const response = await apiClient.get<DashboardContaGerencialSerie>('/dashboard/contas-gerenciais/serie', {
      params
    });
    return response.data;
  },
  async obterLancamentosContaGerencial(params: DashboardContaGerencialLancamentosFilters) {
    const response = await apiClient.get<DashboardContaGerencialLancamentos>('/dashboard/contas-gerenciais/lancamentos', {
      params
    });
    return response.data;
  },
  async obterResumoPorResponsaveis(params: DashboardResponsavelFilters = {}) {
    const response = await apiClient.get<DashboardResponsavelResumo>('/dashboard/responsaveis/resumo', { params });
    return response.data;
  },
  async obterResumoCentralPrevisao(params: DashboardCentralPrevisaoResumoFilters = {}) {
    const response = await apiClient.get<DashboardCentralPrevisaoResumo>('/dashboard/central-previsao/resumo', {
      params
    });
    return response.data;
  },
  async obterItensCentralPrevisao(params: DashboardCentralPrevisaoItensFilters = {}) {
    const response = await apiClient.get<DashboardCentralPrevisaoItens>('/dashboard/central-previsao/itens', {
      params
    });
    return response.data;
  }
};

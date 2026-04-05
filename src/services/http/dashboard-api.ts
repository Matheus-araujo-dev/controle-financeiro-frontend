import type {
  DashboardFluxoCaixa,
  DashboardFluxoCaixaFilters,
  DashboardResumo,
  DashboardResumoFilters
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
  }
};

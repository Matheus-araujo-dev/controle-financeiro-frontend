import type { FechamentoMensal } from '../../types/fechamento';
import { apiClient } from './api-client';

export const fechamentosApi = {
  obter: async (competencia: string) => (await apiClient.get<FechamentoMensal>(`/fechamentos/${competencia}`)).data,
  fechar: async (competencia: string) => (await apiClient.post<FechamentoMensal>(`/fechamentos/${competencia}/fechar`)).data,
  reabrir: async (competencia: string, justificativa: string) => (await apiClient.post<FechamentoMensal>(`/fechamentos/${competencia}/reabrir`, { justificativa })).data,
};

import type { MetaOrcamento, OrcamentoCompetencia, UpsertMetaOrcamentoPayload } from '../../types/orcamento';
import { apiClient } from './api-client';

export const orcamentosApi = {
  async obterPorCompetencia(competencia: string) {
    const response = await apiClient.get<OrcamentoCompetencia>('/orcamentos', { params: { competencia } });
    return response.data;
  },
  async upsertMeta(payload: UpsertMetaOrcamentoPayload) {
    const response = await apiClient.put<MetaOrcamento>('/orcamentos/metas', payload);
    return response.data;
  },
  async removerMeta(id: string) {
    await apiClient.delete(`/orcamentos/metas/${id}`);
  }
};

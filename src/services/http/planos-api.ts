import { apiClient } from './api-client';
import type { PlanoListQuery, PlanoPayload, PlanoResumo, PlanoUpdatePayload } from '../../types/planos';

type PagedPlanos = {
  items: PlanoResumo[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export const planosApi = {
  listar: async (params: PlanoListQuery): Promise<PagedPlanos> => {
    const { data } = await apiClient.get<PagedPlanos>('/planos', { params });
    return data;
  },
  obterPorId: async (id: string): Promise<PlanoResumo> => {
    const { data } = await apiClient.get<PlanoResumo>(`/planos/${id}`);
    return data;
  },
  criar: async (payload: PlanoPayload): Promise<PlanoResumo> => {
    const { data } = await apiClient.post<PlanoResumo>('/planos', payload);
    return data;
  },
  atualizar: async (id: string, payload: PlanoUpdatePayload): Promise<PlanoResumo> => {
    const { data } = await apiClient.put<PlanoResumo>(`/planos/${id}`, payload);
    return data;
  },
  adiantarParcela: async (id: string): Promise<PlanoResumo> => {
    const { data } = await apiClient.post<PlanoResumo>(`/planos/${id}/adiantar-parcela`);
    return data;
  },
  retirarDinheiro: async (id: string, valor: number): Promise<PlanoResumo> => {
    const { data } = await apiClient.post<PlanoResumo>(`/planos/${id}/retirar`, { valor });
    return data;
  },
  cancelar: async (id: string): Promise<PlanoResumo> => {
    const { data } = await apiClient.delete<PlanoResumo>(`/planos/${id}`);
    return data;
  }
};

import { apiClient } from './api-client';
import type {
  ConciliacaoDetalhe,
  ConciliacaoResumo,
  ConciliarItemPayload,
  PagedConciliacoes
} from '../../types/conciliacao';

export const conciliacoesApi = {
  listar: async (params: { page: number; pageSize: number; search?: string }) => {
    const response = await apiClient.get<PagedConciliacoes>('/conciliacoes', { params });
    return response.data;
  },

  obterPorId: async (id: string) => {
    const response = await apiClient.get<ConciliacaoDetalhe>(`/conciliacoes/${id}`);
    return response.data;
  },

  criar: async (contaBancariaId: string, arquivo: File) => {
    const formData = new FormData();
    formData.append('contaBancariaId', contaBancariaId);
    formData.append('arquivo', arquivo);
    const response = await apiClient.post<ConciliacaoResumo>('/conciliacoes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  conciliarItem: async (conciliacaoId: string, itemId: string, payload: ConciliarItemPayload) => {
    const response = await apiClient.patch<void>(
      `/conciliacoes/${conciliacaoId}/itens/${itemId}/conciliar`,
      payload
    );
    return response.data;
  },

  ignorarItem: async (conciliacaoId: string, itemId: string) => {
    const response = await apiClient.patch<void>(
      `/conciliacoes/${conciliacaoId}/itens/${itemId}/ignorar`
    );
    return response.data;
  }
};
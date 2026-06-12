import { apiClient } from './api-client';
import type {
  CompraPlanejadaDetalhe,
  CompraPlanejadaFilters,
  CompraPlanejadaListSummary,
  CompraPlanejadaPayload,
  RealizarCompraPlanejadaPayload,
  CompraPlanejadaResumo,
  PagedCompraPlanejada
} from '../../types/compras-planejadas';

async function getPaged<T, TSummary = unknown>(url: string, params: Record<string, unknown>) {
  const response = await apiClient.get<PagedCompraPlanejada<T, TSummary>>(url, { params });
  return response.data;
}

async function getById<T>(url: string) {
  const response = await apiClient.get<T>(url);
  return response.data;
}

async function post<T>(url: string, payload: unknown) {
  const response = await apiClient.post<T>(url, payload);
  return response.data;
}

async function put<T>(url: string, payload: unknown) {
  const response = await apiClient.put<T>(url, payload);
  return response.data;
}

export const comprasPlanejadasApi = {
  listar: (params: CompraPlanejadaFilters) => getPaged<CompraPlanejadaResumo, CompraPlanejadaListSummary>('/compras-planejadas', params),
  obterPorId: (id: string) => getById<CompraPlanejadaDetalhe>(`/compras-planejadas/${id}`),
  criar: (payload: CompraPlanejadaPayload) => post<CompraPlanejadaDetalhe>('/compras-planejadas', payload),
  atualizar: (id: string, payload: CompraPlanejadaPayload) =>
    put<CompraPlanejadaDetalhe>(`/compras-planejadas/${id}`, payload),
  realizar: (id: string, payload: RealizarCompraPlanejadaPayload) =>
    post<CompraPlanejadaDetalhe>(`/compras-planejadas/${id}/realizar`, payload)
};

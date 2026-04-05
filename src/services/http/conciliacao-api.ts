import { apiClient } from './api-client';
import type {
  ConciliacaoFilters,
  ConciliacaoItem,
  ConfirmarVinculoConciliacaoPayload,
  PagedConciliacao
} from '../../types/conciliacao';

async function getPaged<T>(url: string, params: Record<string, unknown>) {
  const response = await apiClient.get<PagedConciliacao<T>>(url, { params });
  return response.data;
}

async function post<T>(url: string, payload?: unknown) {
  const response = await apiClient.post<T>(url, payload);
  return response.data;
}

export const conciliacaoApi = {
  listar: (params: ConciliacaoFilters) => getPaged<ConciliacaoItem>('/conciliacao', params),
  confirmarVinculo: (itemImportadoWhatsappId: string, payload: ConfirmarVinculoConciliacaoPayload) =>
    post<ConciliacaoItem>(`/conciliacao/${itemImportadoWhatsappId}/confirmar-vinculo`, payload)
};

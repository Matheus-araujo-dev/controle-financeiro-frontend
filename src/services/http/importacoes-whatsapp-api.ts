import { apiClient } from './api-client';
import type {
  ImportacaoWhatsappDetalhe,
  ImportacaoWhatsappResumo,
  ImportacoesWhatsappFilters,
  PagedImportacoesWhatsapp,
  RevisarItemImportadoPayload
} from '../../types/importacoes-whatsapp';

async function getPaged<T>(url: string, params: Record<string, unknown>) {
  const response = await apiClient.get<PagedImportacoesWhatsapp<T>>(url, { params });
  return response.data;
}

async function getById<T>(url: string) {
  const response = await apiClient.get<T>(url);
  return response.data;
}

async function post<T>(url: string, payload?: unknown) {
  const response = await apiClient.post<T>(url, payload);
  return response.data;
}

export const importacoesWhatsappApi = {
  listar: (params: ImportacoesWhatsappFilters) => getPaged<ImportacaoWhatsappResumo>('/importacoes-whatsapp', params),
  obterPorId: (id: string) => getById<ImportacaoWhatsappDetalhe>(`/importacoes-whatsapp/${id}`),
  reprocessar: (id: string) => post<ImportacaoWhatsappDetalhe>(`/importacoes-whatsapp/${id}/reprocessar`),
  confirmarItem: (id: string, payload: RevisarItemImportadoPayload) =>
    post<ImportacaoWhatsappDetalhe>(`/importacoes-whatsapp/itens/${id}/confirmar`, payload),
  rejeitarItem: (id: string, payload: RevisarItemImportadoPayload) =>
    post<ImportacaoWhatsappDetalhe>(`/importacoes-whatsapp/itens/${id}/rejeitar`, payload)
};

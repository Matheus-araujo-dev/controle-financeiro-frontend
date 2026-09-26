import axios from 'axios';
import { getApiFieldErrors } from './api-error';
import type { PreviaReembolsoFaturaRequest, PreviaReembolsoFaturaResponse } from '../../types/generated/api';
import { apiClient } from './api-client';
import type { ConciliacaoFatura, VincularItemFatura, CriarItemFatura, RevisaoFaturaResumo } from '../../types/conciliacao-fatura';

export const conciliacaoFaturaApi = {
  previaReembolso: async (faturaId: string, id: string, itemId: string, request: PreviaReembolsoFaturaRequest) =>
    (await apiClient.post<PreviaReembolsoFaturaResponse[]>(`/faturas/${faturaId}/conciliacoes/${id}/itens/${itemId}/previa-reembolso`, request)).data,
  listar: async (faturaId: string) => (await apiClient.get<RevisaoFaturaResumo[]>(`/faturas/${faturaId}/conciliacoes`)).data,
  criar: async (faturaId: string, id: string, itemId: string, request: CriarItemFatura) => {
    await apiClient.post(`/faturas/${faturaId}/conciliacoes/${id}/itens/${itemId}/criar`, request);
  },
  ignorar: async (faturaId: string, id: string, itemId: string) => {
    await apiClient.post(`/faturas/${faturaId}/conciliacoes/${id}/itens/${itemId}/ignorar`);
  },
  salvarRascunho: async (faturaId: string, id: string, itemId: string, dados: unknown, atualizadoEmUtc: string) =>
    (await apiClient.put<{ atualizadoEmUtc: string }>(`/faturas/${faturaId}/conciliacoes/${id}/itens/${itemId}/rascunho`, { dados, atualizadoEmUtc })).data,
  iniciar: async (faturaId: string, arquivo: File, senha?: string) => {
    if (!arquivo.name.toLowerCase().endsWith('.pdf')) throw new Error('Selecione um arquivo PDF.');
    if (arquivo.size === 0) throw new Error('O arquivo PDF está vazio.');
    if (arquivo.size > 128 * 1024 * 1024) throw new Error('O PDF deve ter até 128 MB.');
    const form = new FormData();
    form.append('arquivo', arquivo);
    if (senha) form.append('senha', senha);
    try {
      return (await apiClient.post<ConciliacaoFatura>(`/faturas/${faturaId}/conciliacoes`, form, { timeout: 240000 })).data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 413) throw new Error('O PDF deve ter até 128 MB.', { cause: error });
      const details = Object.values(getApiFieldErrors(error)).flat();
      if (details.length) throw new Error(details.join(' '), { cause: error });
      throw error;
    }
  },
  obter: async (faturaId: string, id: string) =>
    (await apiClient.get<ConciliacaoFatura>(`/faturas/${faturaId}/conciliacoes/${id}`)).data,
  vincular: async (faturaId: string, id: string, itemId: string, request: VincularItemFatura) => {
    await apiClient.post(`/faturas/${faturaId}/conciliacoes/${id}/itens/${itemId}/vincular`, request);
  }
};

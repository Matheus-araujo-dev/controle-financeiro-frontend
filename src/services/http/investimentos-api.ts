import { apiClient } from './api-client';
import type {
  IndicadoresBcb,
  InvestimentoListQuery,
  InvestimentoPayload,
  InvestimentoResumo,
  InvestimentoUpdatePayload
} from '../../types/investimentos';

type PagedInvestimentos = {
  items: InvestimentoResumo[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export const investimentosApi = {
  listar: async (params: InvestimentoListQuery): Promise<PagedInvestimentos> => {
    const { data } = await apiClient.get<PagedInvestimentos>('/investimentos', { params });
    return data;
  },
  obterPorId: async (id: string): Promise<InvestimentoResumo> => {
    const { data } = await apiClient.get<InvestimentoResumo>(`/investimentos/${id}`);
    return data;
  },
  criar: async (payload: InvestimentoPayload): Promise<InvestimentoResumo> => {
    const { data } = await apiClient.post<InvestimentoResumo>('/investimentos', payload);
    return data;
  },
  atualizar: async (id: string, payload: InvestimentoUpdatePayload): Promise<InvestimentoResumo> => {
    const { data } = await apiClient.put<InvestimentoResumo>(`/investimentos/${id}`, payload);
    return data;
  },
  atualizarValorAtual: async (id: string, valorAtual: number): Promise<InvestimentoResumo> => {
    const { data } = await apiClient.post<InvestimentoResumo>(`/investimentos/${id}/atualizar-valor`, { valorAtual });
    return data;
  },
  encerrar: async (id: string, valorResgate: number): Promise<InvestimentoResumo> => {
    const { data } = await apiClient.post<InvestimentoResumo>(`/investimentos/${id}/encerrar`, { valorResgate });
    return data;
  },
  obterIndicadoresBcb: async (): Promise<IndicadoresBcb> => {
    const { data } = await apiClient.get<IndicadoresBcb>('/investimentos/indicadores-bcb');
    return data;
  }
};

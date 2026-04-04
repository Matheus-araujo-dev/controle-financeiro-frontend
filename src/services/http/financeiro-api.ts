import { apiClient } from './api-client';
import type {
  ContaPagarDetalhe,
  ContaPagarFilters,
  ContaPagarPayload,
  ContaPagarResumo,
  ContaReceberDetalhe,
  ContaReceberFilters,
  ContaReceberPayload,
  ContaReceberResumo,
  LiquidacaoPayload,
  MovimentacaoDetalhe,
  MovimentacaoFilters,
  MovimentacaoResumo,
  PagedFinanceiro
} from '../../types/financeiro';

async function getPaged<T>(url: string, params: Record<string, unknown>) {
  const response = await apiClient.get<PagedFinanceiro<T>>(url, { params });
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

async function put<T>(url: string, payload: unknown) {
  const response = await apiClient.put<T>(url, payload);
  return response.data;
}

export const financeiroApi = {
  contasPagar: {
    listar: (params: ContaPagarFilters) => getPaged<ContaPagarResumo>('/contas-pagar', params),
    obterPorId: (id: string) => getById<ContaPagarDetalhe>(`/contas-pagar/${id}`),
    criar: (payload: ContaPagarPayload) => post<ContaPagarDetalhe>('/contas-pagar', payload),
    atualizar: (id: string, payload: ContaPagarPayload) => put<ContaPagarDetalhe>(`/contas-pagar/${id}`, payload),
    liquidar: (id: string, payload: LiquidacaoPayload) => post<ContaPagarDetalhe>(`/contas-pagar/${id}/liquidar`, payload),
    cancelar: (id: string) => post<ContaPagarDetalhe>(`/contas-pagar/${id}/cancelar`)
  },
  contasReceber: {
    listar: (params: ContaReceberFilters) => getPaged<ContaReceberResumo>('/contas-receber', params),
    obterPorId: (id: string) => getById<ContaReceberDetalhe>(`/contas-receber/${id}`),
    criar: (payload: ContaReceberPayload) => post<ContaReceberDetalhe>('/contas-receber', payload),
    atualizar: (id: string, payload: ContaReceberPayload) => put<ContaReceberDetalhe>(`/contas-receber/${id}`, payload),
    liquidar: (id: string, payload: LiquidacaoPayload) => post<ContaReceberDetalhe>(`/contas-receber/${id}/liquidar`, payload),
    cancelar: (id: string) => post<ContaReceberDetalhe>(`/contas-receber/${id}/cancelar`)
  },
  movimentacoes: {
    listar: (params: MovimentacaoFilters) => getPaged<MovimentacaoResumo>('/movimentacoes', params),
    obterPorId: (id: string) => getById<MovimentacaoDetalhe>(`/movimentacoes/${id}`)
  }
};

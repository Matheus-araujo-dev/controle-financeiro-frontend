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
  EncerrarRecorrenciaPayload,
  FaturaDetalhe,
  FaturaFilters,
  FaturaResumo,
  GerarOcorrenciasPayload,
  LiquidacaoPayload,
  MovimentacaoDetalhe,
  MovimentacaoFilters,
  MovimentacaoResumo,
  PagarFaturaPayload,
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
    alterarFuturas: (id: string, payload: ContaPagarPayload) => post<ContaPagarDetalhe>(`/contas-pagar/${id}/alterar-futuras`, payload),
    gerarOcorrencias: (id: string, payload: GerarOcorrenciasPayload) => post<ContaPagarDetalhe>(`/contas-pagar/${id}/gerar-ocorrencias`, payload),
    pausarRecorrencia: (id: string) => post<ContaPagarDetalhe>(`/contas-pagar/${id}/pausar-recorrencia`),
    encerrarRecorrencia: (id: string, payload: EncerrarRecorrenciaPayload) =>
      post<ContaPagarDetalhe>(`/contas-pagar/${id}/encerrar-recorrencia`, payload),
    liquidar: (id: string, payload: LiquidacaoPayload) => post<ContaPagarDetalhe>(`/contas-pagar/${id}/liquidar`, payload),
    cancelar: (id: string) => post<ContaPagarDetalhe>(`/contas-pagar/${id}/cancelar`)
  },
  contasReceber: {
    listar: (params: ContaReceberFilters) => getPaged<ContaReceberResumo>('/contas-receber', params),
    obterPorId: (id: string) => getById<ContaReceberDetalhe>(`/contas-receber/${id}`),
    criar: (payload: ContaReceberPayload) => post<ContaReceberDetalhe>('/contas-receber', payload),
    atualizar: (id: string, payload: ContaReceberPayload) => put<ContaReceberDetalhe>(`/contas-receber/${id}`, payload),
    alterarFuturas: (id: string, payload: ContaReceberPayload) => post<ContaReceberDetalhe>(`/contas-receber/${id}/alterar-futuras`, payload),
    gerarOcorrencias: (id: string, payload: GerarOcorrenciasPayload) => post<ContaReceberDetalhe>(`/contas-receber/${id}/gerar-ocorrencias`, payload),
    pausarRecorrencia: (id: string) => post<ContaReceberDetalhe>(`/contas-receber/${id}/pausar-recorrencia`),
    encerrarRecorrencia: (id: string, payload: EncerrarRecorrenciaPayload) =>
      post<ContaReceberDetalhe>(`/contas-receber/${id}/encerrar-recorrencia`, payload),
    liquidar: (id: string, payload: LiquidacaoPayload) => post<ContaReceberDetalhe>(`/contas-receber/${id}/liquidar`, payload),
    cancelar: (id: string) => post<ContaReceberDetalhe>(`/contas-receber/${id}/cancelar`)
  },
  movimentacoes: {
    listar: (params: MovimentacaoFilters) => getPaged<MovimentacaoResumo>('/movimentacoes', params),
    obterPorId: (id: string) => getById<MovimentacaoDetalhe>(`/movimentacoes/${id}`)
  },
  faturas: {
    listar: (params: FaturaFilters) => getPaged<FaturaResumo>('/faturas', params),
    obterPorId: (id: string) => getById<FaturaDetalhe>(`/faturas/${id}`),
    pagar: (id: string, payload: PagarFaturaPayload) => post<FaturaDetalhe>(`/faturas/${id}/pagar`, payload)
  }
};

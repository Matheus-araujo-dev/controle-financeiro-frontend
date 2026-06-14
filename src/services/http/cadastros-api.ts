import { apiClient } from './api-client';
import type {
  CartaoDetalhe,
  CartaoFilters,
  CartaoPayload,
  CartaoResumo,
  ContaBancariaDetalhe,
  ContaBancariaFilters,
  ContaBancariaPayload,
  ContaBancariaResumo,
  ContaGerencialDetalhe,
  ContaGerencialFilters,
  ContaGerencialPayload,
  ContaGerencialResumo,
  FormaPagamentoDetalhe,
  FormaPagamentoFilters,
  FormaPagamentoPayload,
  FormaPagamentoResumo,
  PagedCadastro,
  PessoaDetalhe,
  PessoaFilters,
  PessoaPayload,
  PessoaResumo
} from '../../types/cadastros';

async function getPaged<T>(url: string, params: Record<string, unknown>) {
  const response = await apiClient.get<PagedCadastro<T>>(url, { params });
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

async function patch<T>(url: string) {
  const response = await apiClient.patch<T>(url);
  return response.data;
}

export const cadastrosApi = {
  pessoas: {
    listar: (params: PessoaFilters) => getPaged<PessoaResumo>('/pessoas', params),
    obterPorId: (id: string) => getById<PessoaDetalhe>(`/pessoas/${id}`),
    criar: (payload: PessoaPayload) => post<PessoaDetalhe>('/pessoas', payload),
    atualizar: (id: string, payload: PessoaPayload) => put<PessoaDetalhe>(`/pessoas/${id}`, payload),
    ativar: (id: string) => patch<PessoaDetalhe>(`/pessoas/${id}/ativar`),
    inativar: (id: string) => patch<PessoaDetalhe>(`/pessoas/${id}/inativar`)
  },
  formasPagamento: {
    listar: (params: FormaPagamentoFilters) => getPaged<FormaPagamentoResumo>('/formas-pagamento', params),
    obterPorId: (id: string) => getById<FormaPagamentoDetalhe>(`/formas-pagamento/${id}`),
    criar: (payload: FormaPagamentoPayload) => post<FormaPagamentoDetalhe>('/formas-pagamento', payload),
    atualizar: (id: string, payload: FormaPagamentoPayload) =>
      put<FormaPagamentoDetalhe>(`/formas-pagamento/${id}`, payload)
  },
  contasBancarias: {
    listar: (params: ContaBancariaFilters) => getPaged<ContaBancariaResumo>('/contas-bancarias', params),
    obterPorId: (id: string) => getById<ContaBancariaDetalhe>(`/contas-bancarias/${id}`),
    criar: (payload: ContaBancariaPayload) => post<ContaBancariaDetalhe>('/contas-bancarias', payload),
    atualizar: (id: string, payload: ContaBancariaPayload) =>
      put<ContaBancariaDetalhe>(`/contas-bancarias/${id}`, payload)
  },
  cartoes: {
    listar: (params: CartaoFilters) => getPaged<CartaoResumo>('/cartoes', params),
    obterPorId: (id: string) => getById<CartaoDetalhe>(`/cartoes/${id}`),
    criar: (payload: CartaoPayload) => post<CartaoDetalhe>('/cartoes', payload),
    atualizar: (id: string, payload: CartaoPayload) => put<CartaoDetalhe>(`/cartoes/${id}`, payload)
  },
  contasGerenciais: {
    listar: (params: ContaGerencialFilters) => getPaged<ContaGerencialResumo>('/contas-gerenciais', params),
    obterPorId: (id: string) => getById<ContaGerencialDetalhe>(`/contas-gerenciais/${id}`),
    criar: (payload: ContaGerencialPayload) => post<ContaGerencialDetalhe>('/contas-gerenciais', payload),
    atualizar: (id: string, payload: ContaGerencialPayload) =>
      put<ContaGerencialDetalhe>(`/contas-gerenciais/${id}`, payload),
    seedPlanoInicial: () => post<{ contasCriadas: number }>('/contas-gerenciais/seed-plano-inicial', {})
  }
};

import { apiClient } from './api-client';

export type ContaRecenteResumo = {
  id: string;
  tipo: 'Pagar' | 'Receber';
  descricao: string;
  valor: number;
  dataVencimento: string;
  status: string;
};

export type ResumoFinanceiroPessoa = {
  pessoaId: string;
  nomePessoa: string;
  totalAPagarPendente: number;
  totalPago: number;
  totalAPagarVencido: number;
  totalAReceberPendente: number;
  totalRecebido: number;
  totalAReceberVencido: number;
  reembolsoPendente: number;
  contasRecentes: ContaRecenteResumo[];
};

export const pessoasApi = {
  obterResumoFinanceiro: async (id: string) => {
    const response = await apiClient.get<ResumoFinanceiroPessoa>(`/pessoas/${id}/resumo-financeiro`);
    return response.data;
  }
};
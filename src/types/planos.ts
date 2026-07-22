export type PlanoResumo = {
  id: string;
  nome: string;
  descricao: string | null;
  valorMensal: number;
  numParcelas: number;
  contaBancariaCaixaId: string;
  contaBancariaNome: string;
  formaPagamentoId: string | null;
  recebedorId: string | null;
  contaGerencialId: string | null;
  parcelasPagas: number;
  totalRetirado: number;
  valorTotal: number;
  totalAcumulado: number;
  concluido: boolean;
  cancelado: boolean;
  createdAtUtc: string;
};

export type PlanoPayload = {
  nome: string;
  descricao?: string;
  valorMensal: number;
  numParcelas: number;
  contaBancariaCaixaId: string;
  formaPagamentoId?: string;
  recebedorId?: string;
  contaGerencialId?: string;
};

export type PlanoUpdatePayload = {
  nome: string;
  descricao?: string;
  valorMensal: number;
  numParcelas: number;
  formaPagamentoId?: string;
  recebedorId?: string;
  contaGerencialId?: string;
};

export type PlanoListQuery = {
  page: number;
  pageSize: number;
  search?: string;
  cancelado?: boolean;
  concluido?: boolean;
  contaBancariaCaixaId?: string;
};

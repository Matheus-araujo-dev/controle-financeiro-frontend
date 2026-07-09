export type PlanoResumo = {
  id: string;
  nome: string;
  descricao: string | null;
  valorMensal: number;
  numParcelas: number;
  contaBancariaCaixaId: string;
  contaBancariaNome: string;
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
};

export type PlanoUpdatePayload = {
  nome: string;
  descricao?: string;
  valorMensal: number;
  numParcelas: number;
};

export type PlanoListQuery = {
  page: number;
  pageSize: number;
  search?: string;
  cancelado?: boolean;
  concluido?: boolean;
  contaBancariaCaixaId?: string;
};

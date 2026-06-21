import type { PagedResult } from './api';

export type CompraPlanejadaPrioridade = 'Baixa' | 'Media' | 'Alta';
export type CompraPlanejadaStatus = 'Planejada' | 'Comprada' | 'Cancelada';

export type ListQueryBase = {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'Asc' | 'Desc';
};

export type CompraPlanejadaResumo = {
  id: string;
  titulo: string;
  valorEstimado: number;
  dataDesejada: string | null;
  prioridade: CompraPlanejadaPrioridade;
  status: CompraPlanejadaStatus;
  parcelavel: boolean;
  quantidadeParcelasDesejada: number | null;
  contaGerencialId: string;
  contaGerencialDescricao: string;
  responsavelId: string;
  responsavelNome: string;
  link: string | null;
  contaPagarGeradaId: string | null;
  convertidaEmContaPagarEmUtc: string | null;
};

export type CompraPlanejadaDetalhe = CompraPlanejadaResumo & {
  descricao: string | null;
  observacao: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type CompraPlanejadaPayload = {
  titulo: string;
  descricao: string;
  valorEstimado: number;
  dataDesejada: string;
  prioridade: CompraPlanejadaPrioridade;
  status: CompraPlanejadaStatus;
  parcelavel: boolean;
  quantidadeParcelasDesejada: number | null;
  contaGerencialId: string;
  responsavelId: string;
  link: string;
  observacao: string;
};

export type RealizarCompraPlanejadaPayload = {
  dataCompra: string;
  dataVencimento: string | null;
  recebedorId: string;
  formaPagamentoId: string;
  cartaoId: string | null;
  contaBancariaId: string | null;
  quantidadeParcelas: number;
  numeroDocumento: string;
  descricao: string;
  observacao: string;
};

export type CompraPlanejadaFilters = ListQueryBase & {
  prioridade?: CompraPlanejadaPrioridade;
  prioridades?: CompraPlanejadaPrioridade[];
  status?: CompraPlanejadaStatus;
  statuses?: CompraPlanejadaStatus[];
  responsavelId?: string;
  contaGerencialId?: string;
  parcelavel?: boolean;
  dataDesejadaInicial?: string;
  dataDesejadaFinal?: string;
  valorEstimadoMin?: number | string;
  valorEstimadoMax?: number | string;
  link?: string;
};

export type CompraPlanejadaListSummary = {
  totalRegistros: number;
  valorTotalEstimado: number;
};

export type PagedCompraPlanejada<T, TSummary = unknown> = PagedResult<T, TSummary>;

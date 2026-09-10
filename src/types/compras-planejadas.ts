import type * as Api from './generated/api';
import type { ApiContract } from './api-contract';

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

export type CompraPlanejadaResumo = Omit<ApiContract<Api.CompraPlanejadaResumoResponse, 'dataDesejada' | 'quantidadeParcelasDesejada' | 'link' | 'contaPagarGeradaId' | 'convertidaEmContaPagarEmUtc'>, 'prioridade' | 'status'> & {
  prioridade: CompraPlanejadaPrioridade;
  status: CompraPlanejadaStatus;
};

export type CompraPlanejadaDetalhe = CompraPlanejadaResumo & ApiContract<Pick<Api.CompraPlanejadaDetalheResponse, 'descricao' | 'observacao' | 'createdAtUtc' | 'updatedAtUtc'>, 'descricao' | 'observacao'>;

export type CompraPlanejadaPayload = Omit<ApiContract<Api.CriarCompraPlanejadaRequest, 'quantidadeParcelasDesejada'>, 'prioridade' | 'status'> & {
  prioridade: CompraPlanejadaPrioridade;
  status: CompraPlanejadaStatus;
};

export type RealizarCompraPlanejadaPayload = ApiContract<Api.RealizarCompraPlanejadaRequest, 'dataVencimento' | 'cartaoId' | 'contaBancariaId'>;

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

export type CompraPlanejadaListSummary = ApiContract<Api.CompraPlanejadaListSummaryResponse>;

export type PagedCompraPlanejada<T, TSummary = unknown> = PagedResult<T, TSummary>;

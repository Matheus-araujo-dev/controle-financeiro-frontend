import type * as Api from './generated/api';
import type { ApiContract } from './api-contract';

export type PlanoResumo = ApiContract<Api.PlanoResumoResponse, 'descricao' | 'formaPagamentoId' | 'recebedorId' | 'contaGerencialId'>;

export type PlanoPayload = ApiContract<Api.CriarPlanoRequest, never, 'descricao' | 'formaPagamentoId' | 'recebedorId' | 'contaGerencialId'>;

export type PlanoUpdatePayload = ApiContract<Api.AtualizarPlanoRequest, never, 'descricao' | 'formaPagamentoId' | 'recebedorId' | 'contaGerencialId'>;

export type PlanoListQuery = {
  page: number;
  pageSize: number;
  search?: string;
  cancelado?: boolean;
  concluido?: boolean;
  contaBancariaCaixaId?: string;
};

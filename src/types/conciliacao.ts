import type { PagedResult } from './api';

export type StatusConciliacaoCodigo = 'PENDENTE' | 'CONCILIADO';

export type ConciliacaoFilters = {
  page: number;
  pageSize: number;
  search?: string;
  statusConciliacaoCodigo?: StatusConciliacaoCodigo | '';
  contaBancariaId?: string;
};

export type ConciliacaoMovimentacaoCandidata = {
  movimentacaoFinanceiraId: string;
  dataMovimentacao: string;
  tipo: string;
  natureza: string;
  valor: number;
  statusCodigo: string;
  observacao: string | null;
  score: number;
};

export type ConciliacaoItem = {
  itemImportadoWhatsappId: string;
  importacaoWhatsappId: string;
  remetente: string;
  descricaoExtrato: string | null;
  valorSugerido: number | null;
  dataSugerida: string | null;
  statusConciliacaoCodigo: StatusConciliacaoCodigo;
  statusConciliacaoNome: string;
  movimentacaoConciliadaId: string | null;
  movimentacaoConciliadaDescricao: string | null;
  candidatas: ConciliacaoMovimentacaoCandidata[];
};

export type ConfirmarVinculoConciliacaoPayload = {
  movimentacaoFinanceiraId: string;
  dataConciliacao?: string | null;
  observacao?: string | null;
};

export type PagedConciliacao<T> = PagedResult<T>;

import type { PagedResult } from './api';

export type LancamentoOrigem = 'Manual' | 'Recorrencia' | 'Importacao';
export type StatusContaCodigo = 'PENDENTE' | 'LIQUIDADA' | 'VENCIDA' | 'CANCELADA' | 'PARCIAL';
export type TipoMovimentacao = 'Entrada' | 'Saida';
export type NaturezaMovimentacao = 'Prevista' | 'Realizada' | 'Economica';

export type ListQueryBase = {
  page: number;
  pageSize: number;
  search?: string;
};

export type RateioPayload = {
  contaGerencialId: string;
  valor: number;
};

export type RateioDetalhe = {
  id: string;
  contaGerencialId: string;
  contaGerencialCodigo: string | null;
  contaGerencialDescricao: string;
  valor: number;
  percentual: number | null;
};

export type ContaPagarResumo = {
  id: string;
  numeroDocumento: string | null;
  descricao: string;
  recebedorId: string;
  recebedorNome: string;
  dataEmissao: string;
  dataVencimento: string;
  dataLiquidacao: string | null;
  formaPagamentoId: string;
  formaPagamentoNome: string;
  valorLiquido: number;
  statusCodigo: StatusContaCodigo;
  statusNome: string;
  quantidadeParcelas: number;
  numeroParcela: number;
  grupoParcelamentoId: string | null;
};

export type ContaPagarDetalhe = {
  id: string;
  numeroDocumento: string | null;
  dataEmissao: string;
  responsavelCompraId: string | null;
  responsavelCompraNome: string | null;
  recebedorId: string;
  recebedorNome: string;
  dataVencimento: string;
  dataLiquidacao: string | null;
  formaPagamentoId: string;
  formaPagamentoNome: string;
  formaPagamentoEhCartao: boolean;
  formaPagamentoBaixarAutomaticamente: boolean;
  cartaoId: string | null;
  cartaoNome: string | null;
  contaBancariaId: string | null;
  contaBancariaNome: string | null;
  valorOriginal: number;
  valorDesconto: number;
  valorJuros: number;
  valorMulta: number;
  valorLiquido: number;
  quantidadeParcelas: number;
  numeroParcela: number;
  grupoParcelamentoId: string | null;
  descricao: string;
  observacao: string | null;
  statusCodigo: StatusContaCodigo;
  statusNome: string;
  origem: LancamentoOrigem;
  rateios: RateioDetalhe[];
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type ContaPagarPayload = {
  numeroDocumento: string | null;
  dataEmissao: string;
  responsavelCompraId: string | null;
  recebedorId: string;
  dataVencimento: string;
  formaPagamentoId: string;
  cartaoId: string | null;
  contaBancariaId: string | null;
  dataLiquidacao: string | null;
  valorOriginal: number;
  valorDesconto: number;
  valorJuros: number;
  valorMulta: number;
  quantidadeParcelas: number;
  descricao: string;
  observacao: string | null;
  rateios: RateioPayload[];
};

export type ContaPagarFilters = ListQueryBase & {
  recebedorId?: string;
  formaPagamentoId?: string;
  statusCodigo?: StatusContaCodigo;
};

export type ContaReceberResumo = {
  id: string;
  numeroDocumento: string | null;
  descricao: string;
  pagadorId: string;
  pagadorNome: string;
  dataEmissao: string;
  dataVencimento: string;
  dataLiquidacao: string | null;
  formaPagamentoId: string;
  formaPagamentoNome: string;
  valorLiquido: number;
  statusCodigo: StatusContaCodigo;
  statusNome: string;
  quantidadeParcelas: number;
  numeroParcela: number;
  grupoParcelamentoId: string | null;
};

export type ContaReceberDetalhe = {
  id: string;
  numeroDocumento: string | null;
  dataEmissao: string;
  responsavelId: string | null;
  responsavelNome: string | null;
  pagadorId: string;
  pagadorNome: string;
  dataVencimento: string;
  dataLiquidacao: string | null;
  formaPagamentoId: string;
  formaPagamentoNome: string;
  formaPagamentoEhCartao: boolean;
  formaPagamentoBaixarAutomaticamente: boolean;
  cartaoId: string | null;
  cartaoNome: string | null;
  contaBancariaId: string | null;
  contaBancariaNome: string | null;
  valorOriginal: number;
  valorDesconto: number;
  valorJuros: number;
  valorMulta: number;
  valorLiquido: number;
  quantidadeParcelas: number;
  numeroParcela: number;
  grupoParcelamentoId: string | null;
  descricao: string;
  observacao: string | null;
  statusCodigo: StatusContaCodigo;
  statusNome: string;
  origem: LancamentoOrigem;
  rateios: RateioDetalhe[];
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type ContaReceberPayload = {
  numeroDocumento: string | null;
  dataEmissao: string;
  responsavelId: string | null;
  pagadorId: string;
  dataVencimento: string;
  formaPagamentoId: string;
  cartaoId: string | null;
  contaBancariaId: string | null;
  dataLiquidacao: string | null;
  valorOriginal: number;
  valorDesconto: number;
  valorJuros: number;
  valorMulta: number;
  quantidadeParcelas: number;
  descricao: string;
  observacao: string | null;
  rateios: RateioPayload[];
};

export type ContaReceberFilters = ListQueryBase & {
  pagadorId?: string;
  formaPagamentoId?: string;
  statusCodigo?: StatusContaCodigo;
};

export type LiquidacaoPayload = {
  dataLiquidacao: string;
  contaBancariaId: string;
};

export type MovimentacaoResumo = {
  id: string;
  dataMovimentacao: string;
  tipo: TipoMovimentacao;
  natureza: NaturezaMovimentacao;
  statusCodigo: string;
  statusNome: string;
  valor: number;
  contaBancariaId: string | null;
  contaBancariaNome: string | null;
  contaPagarId: string | null;
  contaReceberId: string | null;
  observacao: string | null;
};

export type MovimentacaoDetalhe = MovimentacaoResumo & {
  dataConciliacao: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type MovimentacaoFilters = ListQueryBase & {
  contaBancariaId?: string;
  statusCodigo?: string;
  tipo?: TipoMovimentacao;
  natureza?: NaturezaMovimentacao;
};

export type PagedFinanceiro<T> = PagedResult<T>;

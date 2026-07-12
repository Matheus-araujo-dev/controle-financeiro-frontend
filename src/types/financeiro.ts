import type { PagedResult } from './api';

export type LancamentoOrigem = 'Manual' | 'Recorrencia' | 'Importacao';
export type StatusContaCodigo = 'PENDENTE' | 'LIQUIDADA' | 'VENCIDA' | 'CANCELADA' | 'PARCIAL' | 'EM_FATURA' | 'FUTURO';
export type StatusFaturaCodigo = 'ABERTA' | 'PAGA' | 'FECHADA';
export type TipoMovimentacao = 'Entrada' | 'Saida';
export type NaturezaMovimentacao = 'Prevista' | 'Realizada' | 'Economica';
export type TipoPeriodicidadeRecorrencia = 'Mensal';
export type TipoDiaRecorrencia = 'DiaFixo' | 'DiaUtil';

export type ListQueryBase = {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'Asc' | 'Desc';
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

export type RecorrenciaDetalhe = {
  id: string;
  tipoPeriodicidade: TipoPeriodicidadeRecorrencia;
  tipoDia: TipoDiaRecorrencia;
  diaOrdemMensal: number;
  dataInicio: string;
  dataFim: string | null;
  ativa: boolean;
  permiteEdicaoOcorrenciaIndividual: boolean;
  observacao: string | null;
  contaOrigemTipo: 'ContaPagar' | 'ContaReceber';
};

export type RecorrenciaListItem = RecorrenciaDetalhe & {
  contaOrigemId: string;
  descricao: string;
  valorLiquido: number;
  pessoaNome: string;
  responsavelNome: string | null;
};

export type ContaFinanceiraListSummary = {
  totalRegistros: number;
  valorTotal: number;
  totalPendente: number;
  totalVencido: number;
  totalVencendoHoje: number;
  totalLiquidado: number;
};

export type MovimentacaoListSummary = {
  totalRegistros: number;
  totalEntradas: number;
  totalSaidas: number;
  saldoLiquido: number;
};

export type RecorrenciaListSummary = {
  totalRegistros: number;
  valorTotal: number;
};

export type RecorrenciaListResponse = {
  items: RecorrenciaListItem[];
  summary: RecorrenciaListSummary;
  totalItems?: number;
  page?: number;
  pageSize?: number;
};

export type RecorrenciaFilters = ListQueryBase & {
  ativa?: boolean;
  tipo?: 'Receber' | 'Pagar';
  dataReferenciaInicial?: string;
  dataReferenciaFinal?: string;
};

export type RecorrenciaPayload = {
  tipoPeriodicidade: TipoPeriodicidadeRecorrencia;
  tipoDia: TipoDiaRecorrencia;
  diaOrdemMensal: number;
  dataInicio: string | null;
  dataFim: string | null;
  permiteEdicaoOcorrenciaIndividual: boolean;
  observacao: string | null;
};

export type ContaPagarResumo = {
  id: string;
  numeroDocumento: string | null;
  descricao: string;
  recebedorId: string;
  recebedorNome: string;
  responsavelNome: string | null;
  dataEmissao: string;
  dataVencimento: string;
  dataLiquidacao: string | null;
  formaPagamentoId: string;
  formaPagamentoNome: string;
  valorLiquido: number;
  valorPago: number | null;
  statusCodigo: StatusContaCodigo;
  statusNome: string;
  quantidadeParcelas: number;
  numeroParcela: number;
  grupoParcelamentoId: string | null;
  ehRecorrente: boolean;
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
  dataCompra: string | null;
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
  valorPago: number | null;
  quantidadeParcelas: number;
  numeroParcela: number;
  grupoParcelamentoId: string | null;
  origemCompraPlanejadaId: string | null;
  descricao: string;
  observacao: string | null;
  statusCodigo: StatusContaCodigo;
  statusNome: string;
  ehRecorrente: boolean;
  origem: LancamentoOrigem;
  recorrencia: RecorrenciaDetalhe | null;
  competenciaFaturaCartao: string | null;
  dataFechamentoFaturaCartao: string | null;
  dataVencimentoFaturaCartao: string | null;
  rateios: RateioDetalhe[];
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type ContaPagarPayload = {
  origemCompraPlanejadaId: string | null;
  numeroDocumento: string | null;
  dataEmissao: string;
  responsavelCompraId: string;
  recebedorId: string;
  dataVencimento: string;
  formaPagamentoId: string;
  cartaoId: string | null;
  contaBancariaId: string | null;
  dataLiquidacao: string | null;
  dataCompra: string | null;
  valorOriginal: number;
  valorDesconto: number;
  valorJuros: number;
  valorMulta: number;
  quantidadeParcelas: number;
  descricao: string;
  observacao: string | null;
  rateios: RateioPayload[];
  recorrencia: RecorrenciaPayload | null;
};

export type ContaPagarFilters = ListQueryBase & {
  numeroDocumento?: string;
  descricao?: string;
  recebedorId?: string;
  recebedorIds?: string[];
  formaPagamentoId?: string;
  formaPagamentoIds?: string[];
  responsavelIds?: string[];
  statusCodigo?: StatusContaCodigo | StatusContaCodigo[];
  statusCodigos?: StatusContaCodigo[];
  dataEmissaoInicial?: string;
  dataEmissaoFinal?: string;
  dataInicial?: string;
  dataFinal?: string;
  valorMinimo?: number;
  valorMaximo?: number;
  ehRecorrente?: boolean;
};

export type ContaReceberResumo = {
  id: string;
  numeroDocumento: string | null;
  descricao: string;
  pagadorId: string;
  pagadorNome: string;
  responsavelNome: string | null;
  dataEmissao: string;
  dataVencimento: string;
  dataLiquidacao: string | null;
  formaPagamentoId: string;
  formaPagamentoNome: string;
  valorLiquido: number;
  valorPago: number | null;
  statusCodigo: StatusContaCodigo;
  statusNome: string;
  quantidadeParcelas: number;
  numeroParcela: number;
  grupoParcelamentoId: string | null;
  ehRecorrente: boolean;
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
  valorPago: number | null;
  quantidadeParcelas: number;
  numeroParcela: number;
  grupoParcelamentoId: string | null;
  descricao: string;
  observacao: string | null;
  statusCodigo: StatusContaCodigo;
  statusNome: string;
  ehRecorrente: boolean;
  origem: LancamentoOrigem;
  recorrencia: RecorrenciaDetalhe | null;
  rateios: RateioDetalhe[];
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type ContaReceberPayload = {
  numeroDocumento: string | null;
  dataEmissao: string;
  responsavelId: string;
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
  recorrencia: RecorrenciaPayload | null;
};

export type ContaReceberFilters = ListQueryBase & {
  numeroDocumento?: string;
  descricao?: string;
  pagadorId?: string;
  pagadorIds?: string[];
  formaPagamentoId?: string;
  formaPagamentoIds?: string[];
  responsavelIds?: string[];
  statusCodigo?: StatusContaCodigo | StatusContaCodigo[];
  statusCodigos?: StatusContaCodigo[];
  dataEmissaoInicial?: string;
  dataEmissaoFinal?: string;
  dataInicial?: string;
  dataFinal?: string;
  valorMinimo?: number;
  valorMaximo?: number;
  ehRecorrente?: boolean;
};

export type LiquidacaoPayload = {
  valorLiquidacao: number;
  dataLiquidacao: string;
  contaBancariaId: string;
  formaPagamentoId: string;
  atualizarValorConta: boolean;
  atualizarRecorrencia: boolean;
  cancelarValorRestante: boolean;
};

export type CancelarContaPagarPayload = {
  cancelarPlanejamentoRelacionado?: boolean | null;
  pausarRecorrenciaRelacionada?: boolean | null;
  cancelarParcelasFuturas?: boolean | null;
};

export type CancelarContaReceberPayload = {
  pausarRecorrenciaRelacionada?: boolean | null;
};

export type GerarOcorrenciasPayload = {
  ateData: string;
};

export type EncerrarRecorrenciaPayload = {
  dataFim: string;
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
  faturaCartaoId: string | null;
  observacao: string | null;
  responsavelNome: string | null;
};

export type MovimentacaoDetalhe = MovimentacaoResumo & {
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type MovimentacaoFilters = ListQueryBase & {
  contaBancariaId?: string;
  contaBancariaIds?: string[];
  responsavelIds?: string[];
  pessoaIds?: string[];
  statusCodigo?: string;
  tipo?: TipoMovimentacao;
  natureza?: NaturezaMovimentacao;
  dataInicial?: string;
  dataFinal?: string;
};

export type FaturaResumo = {
  id: string;
  cartaoId: string;
  cartaoNome: string;
  competencia: string;
  dataFechamento: string;
  dataVencimento: string;
  valorTotal: number;
  dataPagamento: string | null;
  statusCodigo: StatusFaturaCodigo;
  statusNome: string;
  quantidadeItens: number;
};

export type FaturaAgrupamentoResumo = {
  chave: string;
  label: string;
  quantidadeFaturas: number;
  valorTotal: number;
};

export type FaturaListSummary = {
  totalRegistros: number;
  valorTotal: number;
  porCartao: FaturaAgrupamentoResumo[];
  porCompetencia: FaturaAgrupamentoResumo[];
};

export type FaturaItem = {
  contaPagarId: string;
  descricao: string;
  recebedorNome: string;
  dataCompra: string;
  valorLiquido: number;
  statusCodigo: string;
  numeroParcela: number;
  quantidadeParcelas: number;
  ehEstorno?: boolean;
};

export type FaturaDetalhe = FaturaResumo & {
  contaBancariaPagamentoId: string | null;
  contaBancariaPagamentoNome: string | null;
  observacao: string | null;
  itens: FaturaItem[];
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type FaturaFilters = ListQueryBase & {
  cartaoId?: string | string[];
  cartaoIds?: string[];
  competencia?: string;
  competencias?: string[];
  statusCodigo?: StatusFaturaCodigo | StatusFaturaCodigo[];
  statusCodigos?: StatusFaturaCodigo[];
  dataVencimentoInicial?: string;
  dataVencimentoFinal?: string;
  dataFechamentoInicial?: string;
  dataFechamentoFinal?: string;
};

export type PagarFaturaPayload = {
  dataPagamento: string;
  contaBancariaPagamentoId: string;
  observacao: string | null;
};

export type PagedFinanceiro<T, TSummary = unknown> = PagedResult<T, TSummary>;

export type TransferenciaResumo = {
  id: string;
  contaBancariaOrigemId: string;
  origemNome: string;
  contaBancariaDestinoId: string;
  destinoNome: string;
  valor: number;
  dataTransferencia: string;
  descricao: string | null;
  cancelada: boolean;
  createdAtUtc: string;
};

export type TransferenciaPayload = {
  contaBancariaOrigemId: string;
  contaBancariaDestinoId: string;
  valor: number;
  dataTransferencia: string;
  descricao?: string;
};

export type TransferenciaFilters = {
  page: number;
  pageSize: number;
  contaBancariaOrigemId?: string;
  contaBancariaDestinoId?: string;
  dataInicial?: string;
  dataFinal?: string;
  cancelada?: boolean;
};

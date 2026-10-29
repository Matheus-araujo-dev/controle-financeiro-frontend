import type * as Api from './generated/api';
import type { ApiContract } from './api-contract';

import type { PagedResult } from './api';

export type LancamentoOrigem = Api.LancamentoOrigem;
export type TipoContaVinculada = Api.TipoContaVinculada;

export type ContaVinculadaResumo = Omit<ApiContract<Pick<Api.ContaVinculadaResumo, 'id' | 'tipo' | 'descricao' | 'valorLiquido' | 'statusCodigo' | 'statusNome' | 'dataVencimento'>>, 'tipo'> & {
  tipo: TipoContaVinculada;
};

export type GrupoContaResumo = Omit<ApiContract<Pick<Api.ContaVinculadaResumo, 'id' | 'tipo' | 'descricao' | 'valorLiquido' | 'numeroParcela' | 'quantidadeParcelas' | 'statusCodigo' | 'statusNome' | 'pessoaNome'>>, 'tipo'> & {
  tipo: TipoContaVinculada;
};

export type GrupoReembolsoInfo = Omit<ApiContract<Api.GrupoReembolsoInfo>, 'contas'> & {
  contas: GrupoContaResumo[];
};

export type GrupoResponsaveisInfo = Omit<ApiContract<Api.GrupoPagadoresInfo>, 'contas'> & {
  contas: GrupoContaResumo[];
};

export type CriarReembolsoPayload = Omit<ApiContract<Api.CriarReembolsoContaPagarRequest, 'observacao'>, 'pagadoresIds' | 'rateios'> & {
  pagadoresIds: string[];
  rateios: RateioPayload[];
};

export type ReembolsoContaResumo = ApiContract<Api.ReembolsoContaResumo>;

export type CriarReembolsoResponse = Omit<ApiContract<Api.CriarReembolsoContaPagarResponse>, 'contasReceber'> & {
  contasReceber: ReembolsoContaResumo[];
};
export type StatusContaCodigo = 'PENDENTE' | 'LIQUIDADA' | 'VENCIDA' | 'CANCELADA' | 'PARCIAL' | 'EM_FATURA' | 'FUTURO';
export type StatusFaturaCodigo = 'ABERTA' | 'PAGA' | 'FECHADA';
export type TipoMovimentacao = Api.TipoMovimentacaoResponse;
export type NaturezaMovimentacao = Api.NaturezaMovimentacaoResponse;
export type TipoPeriodicidadeRecorrencia = Api.TipoPeriodicidadeRecorrencia;
export type TipoDiaRecorrencia = Api.TipoDiaRecorrencia;

export type ListQueryBase = {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'Asc' | 'Desc';
};

export type RateioPayload = ApiContract<Api.RateioRequest>;

export type RateioDetalhe = ApiContract<Api.RateioResponse, 'contaGerencialCodigo' | 'percentual'>;

export type RecorrenciaDetalhe = Omit<ApiContract<Api.RecorrenciaResponse, 'dataFim' | 'observacao', 'encerrada'>, 'tipoPeriodicidade' | 'tipoDia' | 'contaOrigemTipo'> & {
  tipoPeriodicidade: TipoPeriodicidadeRecorrencia;
  tipoDia: TipoDiaRecorrencia;
  contaOrigemTipo: 'ContaPagar' | 'ContaReceber';
};

export type RecorrenciaListItem = RecorrenciaDetalhe & ApiContract<Pick<Api.RecorrenciaListItemResponse, 'contaOrigemId' | 'descricao' | 'valorLiquido' | 'pessoaNome' | 'pagadorNome'>, 'pagadorNome'>;

export type ContaFinanceiraListSummary = ApiContract<Api.ContaPagarListSummaryResponse>;

export type MovimentacaoListSummary = ApiContract<Api.MovimentacaoListSummaryResponse>;

export type RecorrenciaListSummary = ApiContract<Api.RecorrenciaListSummaryResponse>;

export type RecorrenciaListResponse = Omit<ApiContract<Pick<Api.RecorrenciaListResponse, 'items' | 'summary' | 'totalItems' | 'page' | 'pageSize'>, never, 'totalItems' | 'page' | 'pageSize'>, 'items' | 'summary'> & {
  items: RecorrenciaListItem[];
  summary: RecorrenciaListSummary;
};

export type RecorrenciaFilters = ListQueryBase & {
  ativa?: boolean;
  tipo?: 'Receber' | 'Pagar';
  dataReferenciaInicial?: string;
  dataReferenciaFinal?: string;
};

export type RecorrenciaPayload = Omit<ApiContract<Api.RecorrenciaConfigRequest, 'dataInicio' | 'dataFim' | 'observacao'>, 'tipoPeriodicidade' | 'tipoDia'> & {
  tipoPeriodicidade: TipoPeriodicidadeRecorrencia;
  tipoDia: TipoDiaRecorrencia;
};

export type ContaPagarResumo = Omit<ApiContract<Api.ContaPagarResumoResponse, 'numeroDocumento' | 'pagadorNome' | 'dataLiquidacao' | 'valorPago' | 'grupoParcelamentoId'>, 'statusCodigo' | 'contaVinculadaId'> & {
  statusCodigo: StatusContaCodigo;
  contaVinculadaId?: string | null;
};

export type ContaPagarDetalhe = Omit<ApiContract<Api.ContaPagarDetalheResponse, 'numeroDocumento' | 'pagadorId' | 'pagadorNome' | 'dataLiquidacao' | 'dataCompra' | 'cartaoId' | 'cartaoNome' | 'contaBancariaId' | 'contaBancariaNome' | 'valorPago' | 'grupoParcelamentoId' | 'origemCompraPlanejadaId' | 'observacao' | 'competenciaFaturaCartao' | 'dataFechamentoFaturaCartao' | 'dataVencimentoFaturaCartao' | 'grupoReembolsoId' | 'grupoPagadoresId', 'grupoReembolsoId' | 'grupoPagadoresId'>, 'statusCodigo' | 'origem' | 'recorrencia' | 'statusFaturaCartao' | 'rateios' | 'contaVinculada' | 'grupoReembolso' | 'grupoPagadores'> & {
  statusCodigo: StatusContaCodigo;
  origem: LancamentoOrigem;
  recorrencia: RecorrenciaDetalhe | null;
  statusFaturaCartao: StatusFaturaCodigo | null;
  rateios: RateioDetalhe[];
  contaVinculada: ContaVinculadaResumo | null;
  grupoReembolso?: GrupoReembolsoInfo | null;
  grupoPagadores?: GrupoResponsaveisInfo | null;
};

export type ContaPagarPayload = Omit<ApiContract<Pick<Api.CriarContaPagarRequest, 'origemCompraPlanejadaId' | 'numeroDocumento' | 'dataEmissao' | 'pagadorId' | 'recebedorId' | 'dataVencimento' | 'formaPagamentoId' | 'cartaoId' | 'contaBancariaId' | 'dataLiquidacao' | 'dataCompra' | 'valorOriginal' | 'valorDesconto' | 'valorJuros' | 'valorMulta' | 'quantidadeParcelas' | 'descricao' | 'observacao' | 'rateios' | 'recorrencia' | 'forcarProximaFatura' | 'contaVinculadaOrigemId' | 'pagadoresAdicionaisIds'>, 'origemCompraPlanejadaId' | 'numeroDocumento' | 'cartaoId' | 'contaBancariaId' | 'dataLiquidacao' | 'dataCompra' | 'observacao' | 'contaVinculadaOrigemId', 'forcarProximaFatura' | 'contaVinculadaOrigemId'>, 'rateios' | 'recorrencia' | 'pagadoresAdicionaisIds'> & {
  rateios: RateioPayload[];
  recorrencia: RecorrenciaPayload | null;
  pagadoresAdicionaisIds?: string[];
};

export type ContaPagarFilters = ListQueryBase & {
  numeroDocumento?: string;
  descricao?: string;
  recebedorId?: string;
  recebedorIds?: string[];
  formaPagamentoId?: string;
  formaPagamentoIds?: string[];
  pagadorIds?: string[];
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

export type ContaReceberResumo = Omit<ApiContract<Api.ContaReceberResumoResponse, 'numeroDocumento' | 'recebedorNome' | 'dataLiquidacao' | 'valorPago' | 'grupoParcelamentoId'>, 'statusCodigo' | 'contaVinculadaId'> & {
  statusCodigo: StatusContaCodigo;
  contaVinculadaId?: string | null;
};

export type ContaReceberDetalhe = Omit<ApiContract<Api.ContaReceberDetalheResponse, 'numeroDocumento' | 'recebedorId' | 'recebedorNome' | 'dataLiquidacao' | 'cartaoId' | 'cartaoNome' | 'contaBancariaId' | 'contaBancariaNome' | 'valorPago' | 'grupoParcelamentoId' | 'observacao' | 'grupoReembolsoId' | 'grupoRecebedoresId', 'grupoReembolsoId' | 'grupoRecebedoresId'>, 'statusCodigo' | 'origem' | 'recorrencia' | 'rateios' | 'contaVinculada' | 'grupoReembolso' | 'grupoRecebedores'> & {
  statusCodigo: StatusContaCodigo;
  origem: LancamentoOrigem;
  recorrencia: RecorrenciaDetalhe | null;
  rateios: RateioDetalhe[];
  contaVinculada: ContaVinculadaResumo | null;
  grupoReembolso?: GrupoReembolsoInfo | null;
  grupoRecebedores?: GrupoResponsaveisInfo | null;
};

export type ContaReceberPayload = Omit<ApiContract<Pick<Api.CriarContaReceberRequest, 'numeroDocumento' | 'dataEmissao' | 'recebedorId' | 'pagadorId' | 'dataVencimento' | 'formaPagamentoId' | 'cartaoId' | 'contaBancariaId' | 'dataLiquidacao' | 'valorOriginal' | 'valorDesconto' | 'valorJuros' | 'valorMulta' | 'quantidadeParcelas' | 'descricao' | 'observacao' | 'rateios' | 'recorrencia' | 'contaVinculadaOrigemId'>, 'numeroDocumento' | 'cartaoId' | 'contaBancariaId' | 'dataLiquidacao' | 'observacao' | 'contaVinculadaOrigemId', 'contaVinculadaOrigemId'>, 'rateios' | 'recorrencia' | 'pagadoresAdicionaisIds'> & {
  rateios: RateioPayload[];
  recorrencia: RecorrenciaPayload | null;
  pagadoresAdicionaisIds?: string[];
};

export type ContaReceberFilters = ListQueryBase & {
  numeroDocumento?: string;
  descricao?: string;
  pagadorId?: string;
  pagadorIds?: string[];
  formaPagamentoId?: string;
  formaPagamentoIds?: string[];
  recebedorIds?: string[];
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

export type CancelarContaPagarPayload = ApiContract<Api.CancelarContaPagarRequest, 'cancelarPlanejamentoRelacionado' | 'pausarRecorrenciaRelacionada' | 'cancelarParcelasFuturas', 'cancelarPlanejamentoRelacionado' | 'pausarRecorrenciaRelacionada' | 'cancelarParcelasFuturas'>;

export type CancelarContaReceberPayload = ApiContract<Api.CancelarContaReceberRequest, 'pausarRecorrenciaRelacionada' | 'cancelarParcelasFuturas', 'pausarRecorrenciaRelacionada' | 'cancelarParcelasFuturas'>;

export type GerarOcorrenciasPayload = {
  ateData: string;
};

export type EncerrarRecorrenciaPayload = ApiContract<Api.EncerrarRecorrenciaRequest>;

export type MovimentacaoResumo = Omit<ApiContract<Api.MovimentacaoResumoResponse, 'contaBancariaId' | 'contaBancariaNome' | 'contaPagarId' | 'contaReceberId' | 'faturaCartaoId' | 'observacao' | 'responsavelNome'>, 'tipo' | 'natureza'> & {
  tipo: TipoMovimentacao;
  natureza: NaturezaMovimentacao;
};

export type MovimentacaoDetalhe = MovimentacaoResumo & ApiContract<Pick<Api.MovimentacaoDetalheResponse, 'createdAtUtc' | 'updatedAtUtc'>>;

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

export type FaturaResumo = Omit<ApiContract<Api.FaturaResumoResponse, 'dataPagamento'>, 'statusCodigo'> & {
  statusCodigo: StatusFaturaCodigo;
};

export type FaturaAgrupamentoResumo = ApiContract<Api.FaturaAgrupamentoResumoResponse>;

export type FaturaListSummary = Omit<ApiContract<Api.FaturaListSummaryResponse>, 'porCartao' | 'porCompetencia'> & {
  porCartao: FaturaAgrupamentoResumo[];
  porCompetencia: FaturaAgrupamentoResumo[];
};

export type FaturaItem = ApiContract<Api.FaturaItemResponse, 'pagadorNome', 'ehEstorno'>;

export type FaturaDetalhe = FaturaResumo & ApiContract<Pick<Api.FaturaDetalheResponse, 'contaBancariaPagamentoId' | 'contaBancariaPagamentoNome' | 'observacao' | 'createdAtUtc' | 'updatedAtUtc'>, 'contaBancariaPagamentoId' | 'contaBancariaPagamentoNome' | 'observacao'> & {
  itens: FaturaItem[];
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

export type PagarFaturaPayload = ApiContract<Api.PagarFaturaRequest, 'observacao'>;

export type PagedFinanceiro<T, TSummary = unknown> = PagedResult<T, TSummary>;

export type TransferenciaResumo = ApiContract<Api.TransferenciaResumoResponse, 'descricao'>;

export type TransferenciaPayload = ApiContract<Api.CriarTransferenciaRequest, never, 'descricao'>;

export type TransferenciaFilters = {
  page: number;
  pageSize: number;
  contaBancariaOrigemId?: string;
  contaBancariaDestinoId?: string;
  dataInicial?: string;
  dataFinal?: string;
  cancelada?: boolean;
};

export type AlteracaoCampo = ApiContract<Api.AlteracaoCampoResponse, 'antes' | 'depois'>;

export type HistoricoEntrada = Omit<ApiContract<Api.HistoricoEntradaResponse, 'regraRecorrenciaId', 'regraRecorrenciaId'>, 'alteracoes'> & {
  alteracoes: AlteracaoCampo[];
};

import type * as Api from './generated/api';
import type { ApiContract } from './api-contract';

import type { NaturezaMovimentacao, TipoMovimentacao } from './financeiro';
export type DashboardTipoLancamento = 'ContaPagar' | 'ContaReceber';
export type DashboardContaGerencialTipo = Api.ContaGerencialTipo;
export type DashboardCentralPrevisaoOrigem = Api.DashboardCentralPrevisaoOrigem;
export type DashboardCentralPrevisaoStatus = Api.DashboardCentralPrevisaoStatus;

export type DashboardResumoFilters = {
  mesReferencia?: string;
  dataReferencia?: string;
  diasProjetados?: number;
  contaBancariaIds?: string[];
};

export type DashboardFluxoCaixaFilters = {
  mesReferencia?: string;
  dataInicial?: string;
  dias?: number;
  contaBancariaIds?: string[];
};

export type DashboardContaGerencialResumoFilters = {
  mesReferencia?: string;
  dataInicial?: string;
  dias?: number;
  tipo?: DashboardContaGerencialTipo;
  responsavelId?: string;
};

export type DashboardContaGerencialSerieFilters = {
  mesReferencia?: string;
  dataInicial?: string;
  dias?: number;
  tipo?: DashboardContaGerencialTipo;
  contaGerencialId?: string;
};

export type DashboardContaGerencialLancamentosFilters = {
  mesReferencia?: string;
  dataInicial?: string;
  dias?: number;
  tipo?: DashboardContaGerencialTipo;
  contaGerencialId?: string;
};

export type DashboardCentralPrevisaoResumoFilters = {
  mesReferencia?: string;
  dataInicial?: string;
  dias?: number;
  origem?: DashboardCentralPrevisaoOrigem;
  status?: DashboardCentralPrevisaoStatus;
};

export type DashboardCentralPrevisaoItensFilters = DashboardCentralPrevisaoResumoFilters & {
  data?: string;
};

export type DashboardContaResumo = Omit<ApiContract<Api.DashboardContaResumoResponse>, 'tipoLancamento'> & {
  tipoLancamento: DashboardTipoLancamento;
};

export type DashboardMovimentacaoResumo = Omit<ApiContract<Api.DashboardMovimentacaoResumoResponse, 'observacaoResumida' | 'contaPagarId' | 'contaReceberId' | 'faturaCartaoId'>, 'tipo' | 'natureza'> & {
  tipo: TipoMovimentacao;
  natureza: NaturezaMovimentacao;
};

export type DashboardResumo = Omit<ApiContract<Api.DashboardResumoResponse>, 'contasVencidas' | 'contasAVencer' | 'movimentacoesRecentes'> & {
  contasVencidas: DashboardContaResumo[];
  contasAVencer: DashboardContaResumo[];
  movimentacoesRecentes: DashboardMovimentacaoResumo[];
};

export type DashboardFluxoCaixaDia = ApiContract<Api.DashboardFluxoCaixaDiaResponse>;

export type DashboardFluxoCaixa = Omit<ApiContract<Api.DashboardFluxoCaixaResponse>, 'visao' | 'itens'> & {
  visao: 'Caixa' | 'Economica';
  itens: DashboardFluxoCaixaDia[];
};

export type DashboardContaGerencialResumoItem = Omit<ApiContract<Api.DashboardContaGerencialResumoItemResponse, 'codigo'>, 'tipo'> & {
  tipo: DashboardContaGerencialTipo;
};

export type DashboardContaGerencialResumo = Omit<ApiContract<Api.DashboardContaGerencialResumoResponse>, 'itens'> & {
  itens: DashboardContaGerencialResumoItem[];
};

export type DashboardContaGerencialSerieDia = ApiContract<Api.DashboardContaGerencialSerieDiaResponse>;

export type DashboardContaGerencialSerie = Omit<ApiContract<Api.DashboardContaGerencialSerieResponse, 'contaGerencialId'>, 'tipo' | 'itens'> & {
  tipo: DashboardContaGerencialTipo | null;
  itens: DashboardContaGerencialSerieDia[];
};

export type DashboardContaGerencialLancamentoItem = Omit<ApiContract<Api.DashboardContaGerencialLancamentoItemResponse>, 'tipoLancamento'> & {
  tipoLancamento: DashboardTipoLancamento;
};

export type DashboardContaGerencialLancamentos = Omit<ApiContract<Api.DashboardContaGerencialLancamentosResponse, 'contaGerencialCodigo'>, 'tipo' | 'itens'> & {
  tipo: DashboardContaGerencialTipo;
  itens: DashboardContaGerencialLancamentoItem[];
};

export type DashboardCentralPrevisaoResumoItem = Omit<ApiContract<Api.DashboardCentralPrevisaoResumoItemResponse>, 'tipoMovimentacao' | 'origem' | 'status'> & {
  tipoMovimentacao: TipoMovimentacao;
  origem: DashboardCentralPrevisaoOrigem;
  status: DashboardCentralPrevisaoStatus;
};

export type DashboardCentralPrevisaoResumo = Omit<ApiContract<Api.DashboardCentralPrevisaoResumoResponse>, 'origem' | 'status' | 'itens'> & {
  origem: DashboardCentralPrevisaoOrigem | null;
  status: DashboardCentralPrevisaoStatus | null;
  itens: DashboardCentralPrevisaoResumoItem[];
};

export type DashboardCentralPrevisaoItem = Omit<ApiContract<Api.DashboardCentralPrevisaoItemResponse, 'pessoaNome' | 'responsavelNome' | 'contaGerencialId' | 'contaGerencialCodigo' | 'contaGerencialDescricao'>, 'tipoMovimentacao' | 'origem' | 'status'> & {
  tipoMovimentacao: TipoMovimentacao;
  origem: DashboardCentralPrevisaoOrigem;
  status: DashboardCentralPrevisaoStatus;
};

export type DashboardCentralPrevisaoItens = Omit<ApiContract<Api.DashboardCentralPrevisaoItensResponse, 'data'>, 'origem' | 'status' | 'itens'> & {
  origem: DashboardCentralPrevisaoOrigem | null;
  status: DashboardCentralPrevisaoStatus | null;
  itens: DashboardCentralPrevisaoItem[];
};

export type DashboardResponsavelFilters = {
  mesReferencia?: string;
  dataInicial?: string;
  dias?: number;
};

export type DashboardResponsavelItem = ApiContract<Api.DashboardResponsavelItemResponse, 'responsavelId'>;

export type DashboardResponsavelResumo = Omit<ApiContract<Api.DashboardResponsavelResumoResponse>, 'itens'> & {
  itens: DashboardResponsavelItem[];
};

export type DashboardComparativoMensalFilters = {
  meses?: number;
};

export type DashboardComparativoMensalItem = ApiContract<Api.DashboardComparativoMensalItemResponse, 'variacaoReceitas' | 'variacaoDespesas'>;

export type DashboardComparativoMensal = Omit<ApiContract<Api.DashboardComparativoMensalResponse>, 'itens'> & {
  itens: DashboardComparativoMensalItem[];
};

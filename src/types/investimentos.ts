import type * as Api from './generated/api';
import type { ApiContract } from './api-contract';

export type TipoInvestimento = 1 | 2 | 3 | 4 | 5;
export type LiquidezInvestimento = 1 | 2 | 3;

export const TipoInvestimentoLabels: Record<TipoInvestimento, string> = {
  1: 'Renda Fixa',
  2: 'Renda Variável',
  3: 'Fundo Imobiliário',
  4: 'Criptomoeda',
  5: 'Outro'
};

export const LiquidezInvestimentoLabels: Record<LiquidezInvestimento, string> = {
  1: 'Diária',
  2: 'No vencimento',
  3: 'Ilíquido'
};

export type InvestimentoResumo = Omit<ApiContract<Api.InvestimentoResumoResponse, 'emissor' | 'dataVencimento' | 'taxaAnual'>, 'tipo' | 'liquidez'> & {
  tipo: TipoInvestimento;
  liquidez: LiquidezInvestimento;
};

export type InvestimentoPayload = Omit<ApiContract<Api.CriarInvestimentoRequest, never, 'emissor' | 'dataVencimento' | 'taxaAnual'>, 'tipo' | 'liquidez'> & {
  tipo: TipoInvestimento;
  liquidez: LiquidezInvestimento;
};

export type InvestimentoUpdatePayload = Omit<ApiContract<Api.AtualizarInvestimentoRequest, never, 'emissor' | 'dataVencimento' | 'taxaAnual'>, 'tipo' | 'liquidez'> & {
  tipo: TipoInvestimento;
  liquidez: LiquidezInvestimento;
};

export type InvestimentoListQuery = {
  page: number;
  pageSize: number;
  search?: string;
  tipo?: TipoInvestimento;
  encerrado?: boolean;
  contaBancariaVinculadaId?: string;
};

export type IndicadoresBcb = ApiContract<Api.IndicadoresBcbResponse, 'selicAnual' | 'cdiAnual' | 'ipcaAcumulado12m' | 'atualizadoEm'>;

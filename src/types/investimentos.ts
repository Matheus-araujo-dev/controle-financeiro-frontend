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

export type InvestimentoResumo = {
  id: string;
  nome: string;
  emissor: string | null;
  tipo: TipoInvestimento;
  tipoLabel: string;
  liquidez: LiquidezInvestimento;
  liquidezLabel: string;
  valorInvestido: number;
  valorAtual: number;
  rendimento: number;
  rendimentoPercent: number;
  dataAplicacao: string;
  dataVencimento: string | null;
  taxaAnual: number | null;
  contaBancariaVinculadaId: string;
  contaBancariaNome: string;
  encerrado: boolean;
  createdAtUtc: string;
};

export type InvestimentoPayload = {
  nome: string;
  emissor?: string;
  tipo: TipoInvestimento;
  liquidez: LiquidezInvestimento;
  valorInvestido: number;
  dataAplicacao: string;
  dataVencimento?: string;
  taxaAnual?: number;
  contaBancariaVinculadaId: string;
};

export type InvestimentoUpdatePayload = {
  nome: string;
  emissor?: string;
  tipo: TipoInvestimento;
  liquidez: LiquidezInvestimento;
  dataVencimento?: string;
  taxaAnual?: number;
};

export type InvestimentoListQuery = {
  page: number;
  pageSize: number;
  search?: string;
  tipo?: TipoInvestimento;
  encerrado?: boolean;
  contaBancariaVinculadaId?: string;
};

export type IndicadoresBcb = {
  selicAnual: number | null;
  cdiAnual: number | null;
  ipcaAcumulado12m: number | null;
  atualizadoEm: string | null;
};

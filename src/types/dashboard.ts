import type { NaturezaMovimentacao, TipoMovimentacao } from './financeiro';

export type DashboardFluxoCaixaVisao = 'Caixa' | 'Economica';
export type DashboardTipoLancamento = 'ContaPagar' | 'ContaReceber';

export type DashboardResumoFilters = {
  dataReferencia?: string;
  diasProjetados?: number;
};

export type DashboardFluxoCaixaFilters = {
  dataInicial?: string;
  dias?: number;
  visao?: DashboardFluxoCaixaVisao;
};

export type DashboardContaResumo = {
  id: string;
  tipoLancamento: DashboardTipoLancamento;
  descricao: string;
  pessoaNome: string;
  dataVencimento: string;
  valor: number;
  statusCodigo: string;
  statusNome: string;
};

export type DashboardMovimentacaoResumo = {
  id: string;
  dataMovimentacao: string;
  tipo: TipoMovimentacao;
  natureza: NaturezaMovimentacao;
  valor: number;
  observacao: string | null;
  contaPagarId: string | null;
  contaReceberId: string | null;
  faturaCartaoId: string | null;
};

export type DashboardResumo = {
  saldoAtual: number;
  totalAPagar: number;
  totalAReceber: number;
  saldoProjetado: number;
  riscoSaldoNegativo: boolean;
  contasVencidas: DashboardContaResumo[];
  contasAVencer: DashboardContaResumo[];
  movimentacoesRecentes: DashboardMovimentacaoResumo[];
};

export type DashboardFluxoCaixaDia = {
  data: string;
  saldoInicial: number;
  entradasPrevistas: number;
  saidasPrevistas: number;
  saldoFinalPrevisto: number;
  riscoSaldoNegativo: boolean;
};

export type DashboardFluxoCaixa = {
  visao: DashboardFluxoCaixaVisao;
  dataInicial: string;
  dias: number;
  riscoSaldoNegativo: boolean;
  itens: DashboardFluxoCaixaDia[];
};

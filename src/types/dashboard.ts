import type { NaturezaMovimentacao, TipoMovimentacao } from './financeiro';
export type DashboardTipoLancamento = 'ContaPagar' | 'ContaReceber';
export type DashboardContaGerencialTipo = 'Receita' | 'Despesa';
export type DashboardCentralPrevisaoOrigem =
  | 'Recorrencia'
  | 'Parcela'
  | 'CompraRecorrenteImportada'
  | 'CompraPlanejada'
  | 'ContaFuturaGerada';
export type DashboardCentralPrevisaoStatus = 'Realizado' | 'Previsto' | 'Substituido';

export type DashboardResumoFilters = {
  mesReferencia?: string;
  dataReferencia?: string;
  diasProjetados?: number;
};

export type DashboardFluxoCaixaFilters = {
  mesReferencia?: string;
  dataInicial?: string;
  dias?: number;
};

export type DashboardContaGerencialResumoFilters = {
  mesReferencia?: string;
  dataInicial?: string;
  dias?: number;
  tipo?: DashboardContaGerencialTipo;
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
  visao: 'Caixa' | 'Economica';
  dataInicial: string;
  dias: number;
  riscoSaldoNegativo: boolean;
  itens: DashboardFluxoCaixaDia[];
};

export type DashboardContaGerencialResumoItem = {
  contaGerencialId: string;
  codigo: string | null;
  descricao: string;
  tipo: DashboardContaGerencialTipo;
  valorTotal: number;
  quantidadeLancamentos: number;
  ultimaDataLancamento: string;
};

export type DashboardContaGerencialResumo = {
  dataInicial: string;
  dias: number;
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  itens: DashboardContaGerencialResumoItem[];
};

export type DashboardContaGerencialSerieDia = {
  data: string;
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
};

export type DashboardContaGerencialSerie = {
  dataInicial: string;
  dias: number;
  tipo: DashboardContaGerencialTipo | null;
  contaGerencialId: string | null;
  itens: DashboardContaGerencialSerieDia[];
};

export type DashboardContaGerencialLancamentoItem = {
  lancamentoId: string;
  tipoLancamento: DashboardTipoLancamento;
  descricao: string;
  pessoaNome: string;
  dataEmissao: string;
  dataVencimento: string;
  valorLancamento: number;
  valorRateio: number;
  statusCodigo: string;
  statusNome: string;
};

export type DashboardContaGerencialLancamentos = {
  dataInicial: string;
  dias: number;
  tipo: DashboardContaGerencialTipo;
  contaGerencialId: string;
  contaGerencialCodigo: string | null;
  contaGerencialDescricao: string;
  itens: DashboardContaGerencialLancamentoItem[];
};

export type DashboardCentralPrevisaoResumoItem = {
  data: string;
  tipoMovimentacao: TipoMovimentacao;
  origem: DashboardCentralPrevisaoOrigem;
  status: DashboardCentralPrevisaoStatus;
  quantidadeItens: number;
  valorTotal: number;
};

export type DashboardCentralPrevisaoResumo = {
  dataInicial: string;
  dias: number;
  origem: DashboardCentralPrevisaoOrigem | null;
  status: DashboardCentralPrevisaoStatus | null;
  itens: DashboardCentralPrevisaoResumoItem[];
};

export type DashboardCentralPrevisaoItem = {
  tipoReferencia: string;
  referenciaId: string;
  data: string;
  tipoMovimentacao: TipoMovimentacao;
  origem: DashboardCentralPrevisaoOrigem;
  status: DashboardCentralPrevisaoStatus;
  descricao: string;
  valor: number;
  pessoaNome: string | null;
  responsavelNome: string | null;
  contaGerencialId: string | null;
  contaGerencialCodigo: string | null;
  contaGerencialDescricao: string | null;
};

export type DashboardCentralPrevisaoItens = {
  dataInicial: string;
  dias: number;
  data: string | null;
  origem: DashboardCentralPrevisaoOrigem | null;
  status: DashboardCentralPrevisaoStatus | null;
  itens: DashboardCentralPrevisaoItem[];
};

export type DashboardResponsavelFilters = {
  mesReferencia?: string;
  dataInicial?: string;
  dias?: number;
};

export type DashboardResponsavelItem = {
  responsavelId: string | null;
  responsavelNome: string;
  totalDespesas: number;
  totalDespesasCartao: number;
  totalReceitas: number;
  saldoLiquido: number;
  quantidadeLancamentos: number;
};

export type DashboardResponsavelResumo = {
  dataInicial: string;
  dias: number;
  totalDespesas: number;
  totalReceitas: number;
  itens: DashboardResponsavelItem[];
};

export type DashboardComparativoMensalFilters = {
  meses?: number;
};

export type DashboardComparativoMensalItem = {
  competencia: string;
  competenciaLabel: string;
  receitas: number;
  despesas: number;
  saldo: number;
  variacaoReceitas: number | null;
  variacaoDespesas: number | null;
};

export type DashboardComparativoMensal = {
  itens: DashboardComparativoMensalItem[];
};

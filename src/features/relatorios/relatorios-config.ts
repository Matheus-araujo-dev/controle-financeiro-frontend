import type {
  CompraPlanejadaListSummary,
  CompraPlanejadaResumo,
  PagedCompraPlanejada
} from '../../types/compras-planejadas';
import type {
  DashboardCentralPrevisaoOrigem,
  DashboardCentralPrevisaoResumo,
  DashboardCentralPrevisaoStatus,
  DashboardComparativoMensal,
  DashboardContaGerencialResumo,
  DashboardFluxoCaixa,
  DashboardResponsavelResumo,
  DashboardResumo
} from '../../types/dashboard';
import type {
  ContaFinanceiraListSummary,
  ContaPagarResumo,
  ContaReceberResumo,
  FaturaListSummary,
  FaturaResumo,
  PagedFinanceiro,
  RecorrenciaListItem
} from '../../types/financeiro';

export type ReportKey =
  | 'geral'
  | 'responsaveis'
  | 'contas-gerenciais'
  | 'fluxo-caixa'
  | 'previsoes'
  | 'inadimplencia'
  | 'faturas'
  | 'recorrencias'
  | 'compras'
  | 'comparativo'
  | 'dre'
  | 'alertas';

export type ReportState = {
  resumo?: DashboardResumo;
  responsaveis?: DashboardResponsavelResumo;
  contasGerenciais?: DashboardContaGerencialResumo;
  fluxoCaixa?: DashboardFluxoCaixa;
  previsoes?: DashboardCentralPrevisaoResumo;
  contasPagarVencidas?: PagedFinanceiro<ContaPagarResumo, ContaFinanceiraListSummary>;
  contasReceberVencidas?: PagedFinanceiro<ContaReceberResumo, ContaFinanceiraListSummary>;
  faturas?: PagedFinanceiro<FaturaResumo, FaturaListSummary>;
  recorrencias?: PagedFinanceiro<RecorrenciaListItem>;
  compras?: PagedCompraPlanejada<CompraPlanejadaResumo, CompraPlanejadaListSummary>;
  comparativo?: DashboardComparativoMensal;
};

export type InadimplenciaTipo = 'todos' | 'pagar' | 'receber';

export const MAX_REPORT_ROWS = 250;

export const reportTabs: Array<{ key: ReportKey; label: string; icon: string }> = [
  { key: 'geral', label: 'Visão geral', icon: 'query_stats' },
  { key: 'responsaveis', label: 'Responsáveis', icon: 'groups' },
  { key: 'contas-gerenciais', label: 'Contas gerenciais', icon: 'account_tree' },
  { key: 'fluxo-caixa', label: 'Fluxo de caixa', icon: 'monitoring' },
  { key: 'previsoes', label: 'Previsões', icon: 'event_repeat' },
  { key: 'inadimplencia', label: 'Inadimplência', icon: 'warning' },
  { key: 'faturas', label: 'Faturas', icon: 'credit_card' },
  { key: 'recorrencias', label: 'Recorrências', icon: 'sync' },
  { key: 'compras', label: 'Compras planejadas', icon: 'shopping_cart' },
  { key: 'comparativo', label: 'Comparativo mensal', icon: 'bar_chart' },
  { key: 'dre', label: 'DRE doméstica', icon: 'receipt_long' },
  { key: 'alertas', label: 'Alertas inteligentes', icon: 'notifications_active' }
];

export const comparativoMesesOptions = [
  { value: '3', label: '3 meses' },
  { value: '6', label: '6 meses' },
  { value: '12', label: '12 meses' }
];

export const contaTipoOptions = [
  { value: '', label: 'Todos' },
  { value: 'Receita', label: 'Receitas' },
  { value: 'Despesa', label: 'Despesas' }
];

export const origemOptions = [
  { value: '', label: 'Todas' },
  { value: 'Recorrencia', label: 'Recorrências' },
  { value: 'Parcela', label: 'Parcelas' },
  { value: 'CompraRecorrenteImportada', label: 'Compras importadas' },
  { value: 'CompraPlanejada', label: 'Compras planejadas' },
  { value: 'ContaFuturaGerada', label: 'Contas futuras' }
];

export const statusPrevisaoOptions = [
  { value: '', label: 'Todos' },
  { value: 'Realizado', label: 'Realizado' },
  { value: 'Previsto', label: 'Previsto' },
  { value: 'Substituido', label: 'Substituído' }
];

export const inadimplenciaTipoOptions = [
  { value: 'todos', label: 'Pagar e receber' },
  { value: 'pagar', label: 'A pagar' },
  { value: 'receber', label: 'A receber' }
];

export const faturaStatusOptions = [
  { value: '', label: 'Todos' },
  { value: 'ABERTA', label: 'Abertas' },
  { value: 'PAGA', label: 'Pagas' }
];

export const recorrenciaTipoOptions = [
  { value: '', label: 'Todas' },
  { value: 'Pagar', label: 'A pagar' },
  { value: 'Receber', label: 'A receber' }
];

export const ativoOptions = [
  { value: '', label: 'Todas' },
  { value: 'true', label: 'Ativas' },
  { value: 'false', label: 'Pausadas/encerradas' }
];

export const compraStatusOptions = [
  { value: '', label: 'Todos' },
  { value: 'Planejada', label: 'Planejada' },
  { value: 'Comprada', label: 'Comprada' },
  { value: 'Cancelada', label: 'Cancelada' }
];

export const compraPrioridadeOptions = [
  { value: '', label: 'Todas' },
  { value: 'Baixa', label: 'Baixa' },
  { value: 'Media', label: 'Média' },
  { value: 'Alta', label: 'Alta' }
];

export const origemLabels: Record<DashboardCentralPrevisaoOrigem, string> = {
  Recorrencia: 'Recorrência',
  Parcela: 'Parcela',
  CompraRecorrenteImportada: 'Compra importada',
  CompraPlanejada: 'Compra planejada',
  ContaFuturaGerada: 'Conta futura'
};

export const statusLabels: Record<DashboardCentralPrevisaoStatus, string> = {
  Realizado: 'Realizado',
  Previsto: 'Previsto',
  Substituido: 'Substituído'
};

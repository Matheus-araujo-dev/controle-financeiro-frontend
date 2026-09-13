import type { CartaoResumo } from '../../types/cadastros';
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
  | 'alertas'
  | 'analises'
  | 'cartoes'
  | 'lancamentos';

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
  cartoes?: CartaoResumo[];
  contasPagarLancamentos?: PagedFinanceiro<ContaPagarResumo, ContaFinanceiraListSummary>;
  contasReceberLancamentos?: PagedFinanceiro<ContaReceberResumo, ContaFinanceiraListSummary>;
};

export const MAX_REPORT_ROWS = 250;

export type ReportTab = { key: ReportKey; label: string; icon: string; description?: string };

export type ReportGroup = {
  group: string;
  icon: string;
  tabs: ReportTab[];
};

export const reportTabs: ReportTab[] = [
  { key: 'geral', label: 'Visão geral', icon: 'query_stats', description: 'Resumo financeiro do mês' },
  { key: 'responsaveis', label: 'Responsáveis', icon: 'groups', description: 'Gastos por responsável' },
  { key: 'contas-gerenciais', label: 'Contas gerenciais', icon: 'account_tree', description: 'Classificação por conta gerencial' },
  { key: 'fluxo-caixa', label: 'Fluxo de caixa', icon: 'monitoring', description: 'Projeção de entradas e saídas' },
  { key: 'previsoes', label: 'Previsões', icon: 'event_repeat', description: 'O que está por vir' },
  { key: 'inadimplencia', label: 'Inadimplência', icon: 'warning', description: 'Contas vencidas e envelhecimento' },
  { key: 'faturas', label: 'Faturas', icon: 'credit_card', description: 'Faturas do cartão de crédito' },
  { key: 'cartoes', label: 'Cartões', icon: 'credit_score', description: 'Limite e uso dos cartões' },
  { key: 'lancamentos', label: 'Lançamentos', icon: 'list_alt', description: 'Todas as contas a pagar e receber' },
  { key: 'recorrencias', label: 'Recorrências', icon: 'sync', description: 'Compromissos fixos e recorrentes' },
  { key: 'compras', label: 'Compras planejadas', icon: 'shopping_cart', description: 'Planejamento de compras futuras' },
  { key: 'comparativo', label: 'Comparativo mensal', icon: 'bar_chart', description: 'Evolução mês a mês' },
  { key: 'dre', label: 'DRE doméstica', icon: 'receipt_long', description: 'Demonstração de resultado' },
  { key: 'alertas', label: 'Alertas inteligentes', icon: 'notifications_active', description: 'Situações que precisam de atenção' },
  { key: 'analises', label: 'Análises', icon: 'analytics', description: 'Análise detalhada de gastos' }
];

export const reportGroups: ReportGroup[] = [
  {
    group: 'Acompanhar o mês',
    icon: 'calendar_month',
    tabs: ['geral', 'fluxo-caixa', 'lancamentos', 'faturas'].map(k => reportTabs.find(t => t.key === k)!)
  },
  {
    group: 'Entender gastos',
    icon: 'pie_chart',
    tabs: ['responsaveis', 'contas-gerenciais', 'comparativo', 'dre', 'analises'].map(k => reportTabs.find(t => t.key === k)!)
  },
  {
    group: 'Planejar compromissos',
    icon: 'event_upcoming',
    tabs: ['previsoes', 'recorrencias', 'cartoes', 'compras'].map(k => reportTabs.find(t => t.key === k)!)
  },
  {
    group: 'Revisar pendências',
    icon: 'checklist',
    tabs: ['inadimplencia', 'alertas'].map(k => reportTabs.find(t => t.key === k)!)
  }
];

export const comparativoMesesOptions = [
  { value: '3', label: '3 meses' },
  { value: '6', label: '6 meses' },
  { value: '12', label: '12 meses' }
];

export const fluxoDiasOptions = [
  { value: '15', label: '15 dias' },
  { value: '30', label: '30 dias' },
  { value: '60', label: '60 dias' },
  { value: '90', label: '90 dias' }
];

export const contaTipoOptions = [
  { value: 'Receita', label: 'Receitas' },
  { value: 'Despesa', label: 'Despesas' }
];

export const origemOptions = [
  { value: 'Recorrencia', label: 'Recorrências' },
  { value: 'Parcela', label: 'Parcelas' },
  { value: 'CompraRecorrenteImportada', label: 'Compras importadas' },
  { value: 'CompraPlanejada', label: 'Compras planejadas' },
  { value: 'ContaFuturaGerada', label: 'Contas futuras' }
];

export const statusPrevisaoOptions = [
  { value: 'Realizado', label: 'Realizado' },
  { value: 'Previsto', label: 'Previsto' },
  { value: 'Substituido', label: 'Substituído' }
];

export const inadimplenciaTipoOptions = [
  { value: 'pagar', label: 'A pagar' },
  { value: 'receber', label: 'A receber' }
];

export const faturaStatusOptions = [
  { value: 'ABERTA', label: 'Abertas' },
  { value: 'PAGA', label: 'Pagas' }
];

export const recorrenciaTipoOptions = [
  { value: 'Pagar', label: 'A pagar' },
  { value: 'Receber', label: 'A receber' }
];

export const ativoOptions = [
  { value: 'true', label: 'Ativas' },
  { value: 'false', label: 'Pausadas/encerradas' }
];

export const compraStatusOptions = [
  { value: 'Planejada', label: 'Planejada' },
  { value: 'Comprada', label: 'Comprada' },
  { value: 'Cancelada', label: 'Cancelada' }
];

export const compraPrioridadeOptions = [
  { value: 'Baixa', label: 'Baixa' },
  { value: 'Media', label: 'Média' },
  { value: 'Alta', label: 'Alta' }
];

export const lancamentosTipoOptions = [
  { value: 'pagar', label: 'A pagar' },
  { value: 'receber', label: 'A receber' }
];

export const lancamentosStatusOptions = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'LIQUIDADA', label: 'Liquidada' },
  { value: 'VENCIDA', label: 'Vencida' },
  { value: 'CANCELADA', label: 'Cancelada' },
  { value: 'PARCIAL', label: 'Parcial' },
  { value: 'EM_FATURA', label: 'Em fatura' },
  { value: 'FUTURO', label: 'Futuro' }
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

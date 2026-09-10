import type { ReportKey, ReportState } from './relatorios-config';

const sourceReports: Record<keyof ReportState, ReportKey[]> = {
  resumo: [],
  responsaveis: ['responsaveis', 'contas-gerenciais', 'dre', 'analises', 'inadimplencia', 'compras', 'recorrencias', 'lancamentos'],
  contasGerenciais: ['contas-gerenciais', 'dre', 'analises'],
  fluxoCaixa: ['fluxo-caixa', 'alertas'],
  previsoes: ['previsoes'],
  contasPagarVencidas: ['inadimplencia'],
  contasReceberVencidas: ['inadimplencia'],
  faturas: ['faturas', 'cartoes'],
  recorrencias: ['recorrencias', 'alertas'],
  compras: ['compras'],
  comparativo: ['comparativo', 'alertas'],
  cartoes: ['cartoes', 'faturas'],
  contasPagarLancamentos: ['lancamentos'],
  contasReceberLancamentos: ['lancamentos']
};

export function reportNeedsSource(report: ReportKey, source: keyof ReportState) {
  return source === 'resumo' || sourceReports[source].includes(report);
}

/** Preserve the server summary; never silently return a truncated report. */
export async function loadAllReportPages<T extends { items: unknown[]; totalPages: number; totalItems: number }>(fetchPage: (page: number) => Promise<T>): Promise<T> {
  const first = await fetchPage(1);
  const items = [...first.items];
  for (let page = 2; page <= first.totalPages; page++) {
    const next = await fetchPage(page);
    if (!next.items.length || next.totalItems !== first.totalItems) throw new Error('Dados incompletos ou alterados durante a consulta. Atualize o relatório.');
    items.push(...next.items);
  }
  if (items.length !== first.totalItems) throw new Error('Dados incompletos. Atualize o relatório.');
  return { ...first, items };
}

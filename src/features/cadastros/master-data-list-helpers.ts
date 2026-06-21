import type { RowAction } from './module-config';

/**
 * Largura estimada da coluna de ações com base na quantidade de ações da linha.
 * Mantido fora do componente para preservar o Fast Refresh do Vite
 * (arquivos de componente não devem exportar utilitários).
 */
export function estimateActionsColumnWidth<TSummary>(rowActions: RowAction<TSummary>[] | undefined) {
  if (!rowActions?.length) {
    return 96;
  }

  return Math.max(96, Math.min(220, rowActions.length * 44 + 20));
}

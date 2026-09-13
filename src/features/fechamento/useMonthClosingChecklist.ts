import { useMemo } from 'react';
import type { DashboardResumo } from '../../types/dashboard';
import type { DashboardContaGerencialResumo } from '../../types/dashboard';
import type { OrcamentoCompetencia } from '../../types/orcamento';

export type ChecklistItemStatus = 'ok' | 'warning' | 'error' | 'loading';

export type ChecklistItem = {
  id: string;
  title: string;
  description: string;
  status: ChecklistItemStatus;
  detail?: string;
  actionLabel?: string;
  actionRoute?: string;
};

interface UseMonthClosingChecklistParams {
  resumo?: DashboardResumo;
  contasGerenciais?: DashboardContaGerencialResumo;
  orcamento?: OrcamentoCompetencia;
  isLoading: boolean;
  mesReferencia: string;
}

export function useMonthClosingChecklist({
  resumo,
  contasGerenciais,
  orcamento,
  isLoading,
  mesReferencia,
}: UseMonthClosingChecklistParams): { items: ChecklistItem[]; score: number } {
  return useMemo(() => {
    if (isLoading) {
      const loadingItem = (id: string, title: string): ChecklistItem => ({
        id, title, description: 'Verificando...', status: 'loading',
      });
      return {
        items: [
          loadingItem('vencidas', 'Contas vencidas'),
          loadingItem('orcamento', 'Orçamento do mês'),
          loadingItem('receitas-despesas', 'Receitas vs Despesas'),
          loadingItem('pendentes', 'Contas pendentes'),
          loadingItem('categorias', 'Categorização'),
        ],
        score: 0,
      };
    }

    const items: ChecklistItem[] = [];

    const vencidas = resumo?.contasVencidas ?? [];
    const totalVencidas = vencidas.reduce((s, c) => s + c.valor, 0);
    items.push({
      id: 'vencidas',
      title: 'Contas vencidas',
      description: vencidas.length === 0
        ? 'Nenhuma conta vencida neste período'
        : `${vencidas.length} conta(s) vencida(s) totalizando R$ ${totalVencidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      status: vencidas.length === 0 ? 'ok' : 'error',
      detail: vencidas.length > 0 ? `${vencidas.filter(v => v.tipoLancamento === 'ContaPagar').length} a pagar, ${vencidas.filter(v => v.tipoLancamento === 'ContaReceber').length} a receber` : undefined,
      actionLabel: vencidas.length > 0 ? 'Ver vencidas' : undefined,
      actionRoute: vencidas.length > 0 ? '/contas-pagar?status=VENCIDA' : undefined,
    });

    const categoriasEstouradas = (orcamento?.itens ?? []).filter(i => i.estourado);
    const temMetas = (orcamento?.itens ?? []).some(i => i.valorMeta !== null && i.valorMeta !== undefined);
    items.push({
      id: 'orcamento',
      title: 'Orçamento do mês',
      description: !temMetas
        ? 'Nenhuma meta de orçamento definida para este mês'
        : categoriasEstouradas.length === 0
          ? `Todas as categorias dentro da meta (${orcamento?.percentualConsumido?.toFixed(0) ?? 0}% consumido)`
          : `${categoriasEstouradas.length} categoria(s) acima da meta`,
      status: !temMetas ? 'warning' : categoriasEstouradas.length === 0 ? 'ok' : 'warning',
      detail: categoriasEstouradas.length > 0
        ? categoriasEstouradas.map(c => c.contaGerencialDescricao).join(', ')
        : undefined,
      actionLabel: 'Ver orçamento',
      actionRoute: '/orcamento',
    });

    const receitas = contasGerenciais?.totalReceitas ?? 0;
    const despesas = contasGerenciais?.totalDespesas ?? 0;
    const saldo = contasGerenciais?.saldo ?? 0;
    items.push({
      id: 'receitas-despesas',
      title: 'Receitas vs Despesas',
      description: saldo >= 0
        ? `Superávit de R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : `Déficit de R$ ${Math.abs(saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      status: saldo >= 0 ? 'ok' : 'warning',
      detail: `Receitas: R$ ${receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} · Despesas: R$ ${despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      actionLabel: 'Ver DRE',
      actionRoute: '/relatorios?tab=dre',
    });

    const pendentes = resumo?.contasAVencer ?? [];
    const totalPendentes = pendentes.reduce((s, c) => s + c.valor, 0);
    items.push({
      id: 'pendentes',
      title: 'Contas pendentes',
      description: pendentes.length === 0
        ? 'Nenhuma conta pendente no período'
        : `${pendentes.length} conta(s) a vencer totalizando R$ ${totalPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      status: pendentes.length === 0 ? 'ok' : pendentes.length > 10 ? 'warning' : 'ok',
      detail: pendentes.length > 0 ? `${pendentes.filter(p => p.tipoLancamento === 'ContaPagar').length} a pagar, ${pendentes.filter(p => p.tipoLancamento === 'ContaReceber').length} a receber` : undefined,
    });

    const categorias = contasGerenciais?.itens ?? [];
    const semCategoria = categorias.filter(c => !c.contaGerencialId);
    items.push({
      id: 'categorias',
      title: 'Categorização',
      description: semCategoria.length === 0
        ? `Todas as ${categorias.length} categorias atribuídas corretamente`
        : `${semCategoria.length} lançamento(s) sem conta gerencial`,
      status: semCategoria.length === 0 ? 'ok' : 'warning',
      actionLabel: 'Ver categorias',
      actionRoute: '/relatorios?tab=contas-gerenciais',
    });

    const okCount = items.filter(i => i.status === 'ok').length;
    const score = items.length > 0 ? Math.round((okCount / items.length) * 100) : 0;

    return { items, score };
  }, [resumo, contasGerenciais, orcamento, isLoading, mesReferencia]);
}

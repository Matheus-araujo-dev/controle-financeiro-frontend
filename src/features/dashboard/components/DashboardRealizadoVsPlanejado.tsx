import { formatCurrencyBRL } from '../../../shared/currency';
import type { DashboardContaGerencialResumoItem } from '../../../types/dashboard';
import type { OrcamentoCompetencia } from '../../../types/orcamento';

interface Props {
  contasGerenciais: DashboardContaGerencialResumoItem[];
  orcamento: OrcamentoCompetencia | undefined;
}

function getBarColor(pct: number) {
  if (pct > 100) return 'bg-error';
  if (pct >= 80) return 'bg-warning';
  return 'bg-primary';
}

function getTextColor(pct: number) {
  if (pct > 100) return 'text-error';
  if (pct >= 80) return 'text-warning';
  return 'text-primary';
}

export function DashboardRealizadoVsPlanejado({ contasGerenciais, orcamento }: Props) {
  const despesas = contasGerenciais.filter((c) => c.tipo === 'Despesa');
  const metaMap = new Map(
    (orcamento?.itens ?? [])
      .filter((i) => i.valorMeta !== null)
      .map((i) => [i.contaGerencialId, i.valorMeta!])
  );

  const items = despesas
    .map((c) => {
      const meta = metaMap.get(c.contaGerencialId) ?? null;
      const pct = meta ? (c.valorTotal / meta) * 100 : null;
      return { ...c, meta, pct };
    })
    .sort((a, b) => b.valorTotal - a.valorTotal)
    .slice(0, 6);

  const temMeta = items.some((i) => i.meta !== null);

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-white/5 bg-surface-container-low p-6">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/5 bg-surface-container text-primary">
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>savings</span>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Realizado vs Planejado</p>
          <p className="font-headline text-base font-bold text-on-surface">Despesas por categoria</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="py-4 text-center text-sm text-on-surface-variant">Sem despesas no período.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.contaGerencialId}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-xs font-semibold text-on-surface">{item.descricao}</span>
                <div className="shrink-0 text-right">
                  <span className="text-xs font-bold text-on-surface">{formatCurrencyBRL(item.valorTotal)}</span>
                  {item.meta !== null && (
                    <span className="ml-1 text-[10px] text-on-surface-variant">/ {formatCurrencyBRL(item.meta)}</span>
                  )}
                </div>
              </div>
              {item.meta !== null && item.pct !== null ? (
                <>
                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className={`h-full transition-all ${getBarColor(item.pct)}`}
                      style={{ width: `${Math.min(item.pct, 100)}%` }}
                    />
                  </div>
                  <div className="mt-0.5 flex justify-end">
                    <span className={`text-[10px] font-bold ${getTextColor(item.pct)}`}>
                      {item.pct.toFixed(0)}%
                    </span>
                  </div>
                </>
              ) : (
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full bg-on-surface-variant/30" style={{ width: '100%' }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {!temMeta && items.length > 0 && (
        <p className="text-center text-xs text-on-surface-variant">
          Configure metas em <span className="font-bold text-primary">Orçamento</span> para ver o progresso.
        </p>
      )}
    </div>
  );
}

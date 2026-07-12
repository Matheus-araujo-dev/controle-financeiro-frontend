import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { investimentosApi } from '../../../services/http/investimentos-api';
import { TipoInvestimentoLabels } from '../../../types/investimentos';
import { formatCurrencyBRL } from '../../../shared/currency';

const TIPO_COLORS: Record<number, string> = {
  1: '#2bf58e',
  2: '#a3e635',
  3: '#f5c842',
  4: '#f59342',
  5: '#8a8a8a'
};

export function DashboardInvestimentos() {
  const { data, isLoading } = useQuery({
    queryKey: ['investimentos', 'dashboard'],
    queryFn: () => investimentosApi.listar({ page: 1, pageSize: 200, encerrado: false }),
    staleTime: 60_000
  });

  const ativos = useMemo(() => data?.items ?? [], [data]);

  const totalInvestido = useMemo(() => ativos.reduce((acc, i) => acc + i.valorInvestido, 0), [ativos]);
  const totalAtual    = useMemo(() => ativos.reduce((acc, i) => acc + i.valorAtual, 0), [ativos]);
  const totalReturn   = useMemo(() => ativos.reduce((acc, i) => acc + i.rendimento, 0), [ativos]);
  const returnPct     = totalInvestido > 0 ? (totalReturn / totalInvestido) * 100 : 0;

  const porTipo = useMemo(() => {
    const map = new Map<number, number>();
    for (const inv of ativos) {
      map.set(inv.tipo, (map.get(inv.tipo) ?? 0) + inv.valorAtual);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tipo, valor]) => ({ tipo, valor, label: TipoInvestimentoLabels[tipo as keyof typeof TipoInvestimentoLabels] ?? 'Outro' }));
  }, [ativos]);

  const top5 = useMemo(() => [...ativos].sort((a, b) => b.valorAtual - a.valorAtual).slice(0, 5), [ativos]);

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-white/5 bg-surface-container-low p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/5 bg-surface-container text-primary">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Carteira</p>
            <p className="font-headline text-base font-bold text-on-surface">Investimentos</p>
          </div>
        </div>
        <Link to="/investimentos" className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline">
          Ver todos →
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-white/5 bg-surface-container p-3">
          <p className="text-[10px] text-on-surface-variant">Investido</p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-on-surface">{formatCurrencyBRL(totalInvestido)}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-surface-container p-3">
          <p className="text-[10px] text-on-surface-variant">Atual</p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-primary">{formatCurrencyBRL(totalAtual)}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-surface-container p-3">
          <p className="text-[10px] text-on-surface-variant">Rendimento</p>
          <p className={`mt-0.5 text-sm font-bold tabular-nums ${totalReturn >= 0 ? 'text-primary' : 'text-error'}`}>
            {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(1)}%
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-6 text-sm text-on-surface-variant">
          Carregando carteira…
        </div>
      )}

      {!isLoading && ativos.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
          <span className="material-symbols-outlined text-3xl text-on-surface-variant">show_chart</span>
          <p className="text-sm text-on-surface-variant">Nenhum investimento ativo.</p>
          <Link to="/investimentos" className="text-xs font-bold text-primary hover:underline">Adicionar investimento →</Link>
        </div>
      )}

      {/* Composição por tipo */}
      {!isLoading && porTipo.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Composição</p>
          {porTipo.map(({ tipo, valor, label }) => {
            const pct = totalAtual > 0 ? (valor / totalAtual) * 100 : 0;
            const cor = TIPO_COLORS[tipo] ?? '#8a8a8a';
            return (
              <div key={tipo} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-on-surface">{label}</span>
                  <span className="tabular-nums text-on-surface-variant">{pct.toFixed(0)}% · {formatCurrencyBRL(valor)}</span>
                </div>
                <div className="h-1 w-full rounded-full bg-white/5">
                  <div className="h-1 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: cor }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Top 5 */}
      {!isLoading && top5.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Maiores posições</p>
          <ul className="space-y-2">
            {top5.map((inv) => {
              const cor = TIPO_COLORS[inv.tipo] ?? '#8a8a8a';
              const retPct = inv.valorInvestido > 0 ? ((inv.valorAtual - inv.valorInvestido) / inv.valorInvestido) * 100 : 0;
              return (
                <li key={inv.id} className="flex items-center gap-3">
                  <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: cor }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-on-surface">{inv.nome}</p>
                    <p className="text-[10px] text-on-surface-variant">{inv.emissor ?? inv.tipoLabel}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-bold tabular-nums text-on-surface">{formatCurrencyBRL(inv.valorAtual)}</p>
                    <p className={`text-[10px] tabular-nums ${retPct >= 0 ? 'text-primary' : 'text-error'}`}>
                      {retPct >= 0 ? '+' : ''}{retPct.toFixed(1)}%
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

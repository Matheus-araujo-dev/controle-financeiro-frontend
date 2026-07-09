import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatCurrencyBRL } from '../../../shared/currency';
import { financeiroApi } from '../../../services/http/financeiro-api';
import { cadastrosApi } from '../../../services/http/cadastros-api';

function getCurrentMonthCompetencia() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function DashboardCartoesBreakdown() {
  const competencia = getCurrentMonthCompetencia();

  const { data: faturasData, isPending: loadingFaturas } = useQuery({
    queryKey: ['faturas', 'cartoes-breakdown', competencia],
    queryFn: () => financeiroApi.faturas.listar({ page: 1, pageSize: 50, search: '', competencia }),
    staleTime: 5 * 60_000
  });

  const { data: cartoesData } = useQuery({
    queryKey: ['cartoes', 'breakdown'],
    queryFn: () => cadastrosApi.cartoes.listar({ page: 1, pageSize: 100, search: '' }),
    staleTime: 10 * 60_000
  });

  const cartaoMap = useMemo(() => {
    const map = new Map<string, { icone: string | null; cor: string | null; numeroFinal: string }>();
    (cartoesData?.items ?? []).forEach((c) => {
      map.set(c.id, { icone: c.icone ?? null, cor: c.cor ?? null, numeroFinal: c.numeroFinal });
    });
    return map;
  }, [cartoesData]);

  const faturas = faturasData?.items ?? [];
  const grouped = useMemo(() => {
    const map = new Map<string, { cartaoId: string; cartaoNome: string; valor: number; faturas: number }>();
    for (const f of faturas) {
      const existing = map.get(f.cartaoId);
      if (existing) {
        existing.valor += f.valorTotal;
        existing.faturas++;
      } else {
        map.set(f.cartaoId, { cartaoId: f.cartaoId, cartaoNome: f.cartaoNome, valor: f.valorTotal, faturas: 1 });
      }
    }
    return [...map.values()].sort((a, b) => b.valor - a.valor);
  }, [faturas]);

  const totalFaturas = grouped.reduce((s, g) => s + g.valor, 0);

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-white/5 bg-surface-container-low p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/5 bg-surface-container text-primary">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Cartões</p>
            <p className="font-headline text-base font-bold text-on-surface">Faturas do mês</p>
          </div>
        </div>
        <Link to="/faturas" className="text-xs font-bold uppercase tracking-wider text-primary hover:underline">
          Ver todas
        </Link>
      </div>

      {loadingFaturas ? (
        <p className="text-sm text-on-surface-variant animate-pulse">Carregando...</p>
      ) : grouped.length === 0 ? (
        <p className="py-4 text-center text-sm text-on-surface-variant">Nenhuma fatura no mês.</p>
      ) : (
        <>
          <ul className="space-y-2">
            {grouped.map((g) => {
              const meta = cartaoMap.get(g.cartaoId);
              const cor = meta?.cor ?? '#2bf58e';
              const icone = meta?.icone ?? 'credit_card';
              const pct = totalFaturas > 0 ? (g.valor / totalFaturas) * 100 : 0;
              return (
                <li key={g.cartaoId} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-surface-container px-4 py-3">
                  <div
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                    style={{ backgroundColor: `${cor}20`, color: cor }}
                  >
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {icone}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm font-semibold text-on-surface">{g.cartaoNome}</span>
                      <span className="ml-2 shrink-0 text-sm font-bold text-error">{formatCurrencyBRL(g.valor)}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full bg-error/60" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-surface-container px-4 py-3">
            <span className="text-sm font-bold text-on-surface-variant">Total em cartões</span>
            <span className="font-headline text-lg font-extrabold text-error">{formatCurrencyBRL(totalFaturas)}</span>
          </div>
        </>
      )}
    </div>
  );
}

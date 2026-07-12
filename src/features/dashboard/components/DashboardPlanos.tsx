import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { planosApi } from '../../../services/http/planos-api';
import { formatCurrencyBRL } from '../../../shared/currency';

function ProgressRing({ percent, color = '#2bf58e', size = 64 }: { percent: number; color?: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const filled = circ * Math.min(1, Math.max(0, percent));

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={6}
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

export function DashboardPlanos() {
  const { data, isLoading } = useQuery({
    queryKey: ['planos', 'dashboard'],
    queryFn: () => planosApi.listar({ page: 1, pageSize: 50, cancelado: false }),
    staleTime: 60_000
  });

  const ativos = useMemo(() => (data?.items ?? []).filter((p) => !p.concluido && !p.cancelado), [data]);
  const concluidos = useMemo(() => (data?.items ?? []).filter((p) => p.concluido), [data]);
  const compromissoMensal = useMemo(() => ativos.reduce((acc, p) => acc + p.valorMensal, 0), [ativos]);
  const totalAcumulado = useMemo(() => ativos.reduce((acc, p) => acc + p.totalAcumulado, 0), [ativos]);

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-white/5 bg-surface-container-low p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/5 bg-surface-container text-primary">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>savings</span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Planejamento</p>
            <p className="font-headline text-base font-bold text-on-surface">Planos e Metas</p>
          </div>
        </div>
        <Link to="/planos" className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline">
          Ver todos →
        </Link>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-white/5 bg-surface-container p-3 text-center">
          <p className="font-headline text-lg font-bold tabular-nums text-primary">{ativos.length}</p>
          <p className="text-[10px] text-on-surface-variant">Ativos</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-surface-container p-3 text-center">
          <p className="font-headline text-lg font-bold tabular-nums text-on-surface">{concluidos.length}</p>
          <p className="text-[10px] text-on-surface-variant">Concluídos</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-surface-container p-3 text-center">
          <p className="font-headline text-sm font-bold tabular-nums text-amber-400">{formatCurrencyBRL(compromissoMensal)}</p>
          <p className="text-[10px] text-on-surface-variant">/ mês</p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-6 text-on-surface-variant text-sm">
          Carregando planos…
        </div>
      )}

      {!isLoading && ativos.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
          <span className="material-symbols-outlined text-3xl text-on-surface-variant">savings</span>
          <p className="text-sm text-on-surface-variant">Nenhum plano ativo.</p>
          <Link to="/planos" className="text-xs font-bold text-primary hover:underline">Criar plano →</Link>
        </div>
      )}

      {!isLoading && ativos.length > 0 && (
        <ul className="space-y-3">
          {ativos.slice(0, 4).map((plano) => {
            const progresso = plano.numParcelas > 0 ? plano.parcelasPagas / plano.numParcelas : 0;
            const pct = Math.round(progresso * 100);
            return (
              <li key={plano.id} className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <ProgressRing percent={progresso} size={52} />
                  <span className="absolute inset-0 flex items-center justify-center font-headline text-[10px] font-bold text-primary tabular-nums">
                    {pct}%
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-on-surface">{plano.nome}</p>
                  <p className="text-xs text-on-surface-variant">
                    {plano.parcelasPagas}/{plano.numParcelas} parcelas &nbsp;·&nbsp; {formatCurrencyBRL(plano.valorMensal)}/mês
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-bold text-primary tabular-nums">{formatCurrencyBRL(plano.totalAcumulado)}</p>
                  <p className="text-[10px] text-on-surface-variant">acumulado</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!isLoading && ativos.length > 0 && (
        <div className="mt-1 rounded-xl border border-white/5 bg-surface-container p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-on-surface-variant">Total acumulado (ativos)</span>
            <span className="font-bold tabular-nums text-primary">{formatCurrencyBRL(totalAcumulado)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

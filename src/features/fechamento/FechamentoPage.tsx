import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DateInput } from '../../components/forms/DateInput';
import { PageState } from '../../components/states/PageState';
import { dashboardApi } from '../../services/http/dashboard-api';
import { orcamentosApi } from '../../services/http/orcamentos-api';
import { useMonthClosingChecklist } from './useMonthClosingChecklist';
import type { ChecklistItem } from './useMonthClosingChecklist';

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const statusConfig: Record<string, { icon: string; color: string; bg: string }> = {
  ok: { icon: 'check_circle', color: 'text-primary', bg: 'bg-primary/10' },
  warning: { icon: 'warning', color: 'text-warning', bg: 'bg-warning/10' },
  error: { icon: 'error', color: 'text-error', bg: 'bg-error/10' },
  loading: { icon: 'hourglass_empty', color: 'text-on-surface-variant', bg: 'bg-surface-container' },
};

function ChecklistRow({ item }: { item: ChecklistItem }) {
  const config = statusConfig[item.status];
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
      <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${config.bg} shrink-0`}>
        <span
          className={`material-symbols-outlined ${config.color}`}
          style={{ fontVariationSettings: item.status === 'ok' ? "'FILL' 1" : undefined }}
        >
          {config.icon}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-on-surface">{item.title}</h4>
        </div>
        <p className="text-xs text-on-surface-variant mt-0.5">{item.description}</p>
        {item.detail && (
          <p className="text-[11px] text-on-surface-variant/70 mt-1">{item.detail}</p>
        )}
      </div>
      {item.actionLabel && item.actionRoute && (
        <Link
          to={item.actionRoute}
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
        >
          {item.actionLabel}
          <span className="material-symbols-outlined text-xs">arrow_forward</span>
        </Link>
      )}
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#4ade80' : score >= 50 ? '#fbbf24' : '#f87171';

  return (
    <div className="relative w-32 h-32">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-white/5" />
        <circle
          cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-on-surface">{score}%</span>
        <span className="text-[10px] text-on-surface-variant">concluído</span>
      </div>
    </div>
  );
}

export function FechamentoPage() {
  const [mesReferencia, setMesReferencia] = useState(getCurrentMonth());

  const { data: resumo, isFetching: loadingResumo } = useQuery({
    queryKey: ['fechamento', 'resumo', mesReferencia],
    queryFn: () => dashboardApi.obterResumo({ mesReferencia }),
    staleTime: 30_000,
  });

  const { data: contasGerenciais, isFetching: loadingCG } = useQuery({
    queryKey: ['fechamento', 'contas-gerenciais', mesReferencia],
    queryFn: () => dashboardApi.obterResumoContasGerenciais({ mesReferencia }),
    staleTime: 30_000,
  });

  const { data: orcamento, isFetching: loadingOrc } = useQuery({
    queryKey: ['fechamento', 'orcamento', mesReferencia],
    queryFn: () => orcamentosApi.obterPorCompetencia(mesReferencia),
    staleTime: 30_000,
  });

  const isLoading = loadingResumo || loadingCG || loadingOrc;

  const { items, score } = useMonthClosingChecklist({
    resumo,
    contasGerenciais,
    orcamento,
    isLoading: isLoading && !resumo,
    mesReferencia,
  });

  const okCount = items.filter(i => i.status === 'ok').length;
  const warningCount = items.filter(i => i.status === 'warning').length;
  const errorCount = items.filter(i => i.status === 'error').length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-headline font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              fact_check
            </span>
            Fechamento do mês
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Revise os itens abaixo antes de considerar o mês encerrado
          </p>
        </div>
        <div className="w-[200px]">
          <DateInput
            compact
            mode="month"
            ariaLabel="Mês de referência"
            value={mesReferencia}
            onChange={(v) => setMesReferencia(v || getCurrentMonth())}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8">
        <div className="space-y-3">
          {items.map((item) => (
            <ChecklistRow key={item.id} item={item} />
          ))}
        </div>

        <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-surface-container-low border border-white/6 lg:w-[220px] self-start">
          <ScoreRing score={score} />
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-3 text-xs">
              {okCount > 0 && (
                <span className="flex items-center gap-1 text-primary">
                  <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  {okCount}
                </span>
              )}
              {warningCount > 0 && (
                <span className="flex items-center gap-1 text-warning">
                  <span className="material-symbols-outlined text-xs">warning</span>
                  {warningCount}
                </span>
              )}
              {errorCount > 0 && (
                <span className="flex items-center gap-1 text-error">
                  <span className="material-symbols-outlined text-xs">error</span>
                  {errorCount}
                </span>
              )}
            </div>
            <p className="text-[11px] text-on-surface-variant">
              {score === 100 ? 'Mês pronto para fechar!' : 'Revise os itens pendentes'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { agenteApi } from '../../../services/http/agente-api';

const tipoConfig = {
  ALERTA: {
    icon: 'warning',
    color: 'text-error',
    bg: 'bg-error/10',
    border: 'border-error/20',
    chip: 'bg-error/15 text-error'
  },
  POSITIVO: {
    icon: 'trending_up',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    chip: 'bg-primary/15 text-primary'
  },
  DICA: {
    icon: 'lightbulb',
    color: 'text-tertiary',
    bg: 'bg-tertiary/10',
    border: 'border-tertiary/20',
    chip: 'bg-tertiary/15 text-tertiary'
  },
  INFO: {
    icon: 'info',
    color: 'text-on-surface-variant',
    bg: 'bg-surface-container',
    border: 'border-white/5',
    chip: 'bg-white/10 text-on-surface-variant'
  }
} as const;

interface Props {
  mesReferencia: string;
}

export function DashboardAiInsights({ mesReferencia }: Props) {
  const { data, isPending, isError } = useQuery({
    queryKey: ['dashboard', 'insights', mesReferencia],
    queryFn: () => agenteApi.obterInsights(mesReferencia),
    staleTime: 5 * 60_000,
    retry: false
  });

  const insights = data?.insights ?? [];

  return (
    <div className="bg-surface-container-low border border-white/5 rounded-3xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Inteligência Artificial
            </div>
            <div className="text-sm font-bold text-on-surface">Análise do Mês</div>
          </div>
        </div>
        <Link
          to="/agente/chat"
          className="text-[11px] font-bold transition-colors"
          style={{ color: 'var(--color-primary)' }}
        >
          Perguntar ao agente →
        </Link>
      </div>

      {isPending ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-14 rounded-2xl bg-surface-container animate-pulse"
              style={{ opacity: 1 - i * 0.15 }}
            />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-6 text-on-surface-variant text-sm">
          <span className="material-symbols-outlined block text-2xl mb-2 opacity-40" style={{ fontVariationSettings: "'FILL' 1" }}>psychology_alt</span>
          Análise indisponível no momento.{' '}
          <Link to="/agente" className="text-primary underline">
            Use o chat do agente
          </Link>
        </div>
      ) : insights.length === 0 ? (
        <div className="text-center py-6 text-on-surface-variant text-sm">
          <span className="material-symbols-outlined block text-2xl mb-2 opacity-40" style={{ fontVariationSettings: "'FILL' 1" }}>sentiment_satisfied</span>
          Sem alertas para este período.
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight, i) => {
            const cfg = tipoConfig[insight.tipo] ?? tipoConfig.INFO;
            return (
              <div
                key={i}
                className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${cfg.bg} ${cfg.border}`}
              >
                <span className={`material-symbols-outlined text-base mt-0.5 shrink-0 ${cfg.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {cfg.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium leading-snug ${cfg.color}`}>{insight.mensagem}</p>
                  {insight.valor ? (
                    <p className={`text-xs font-bold mt-0.5 ${cfg.color} opacity-80`}>{insight.valor}</p>
                  ) : null}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${cfg.chip}`}>
                  {insight.tipo}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

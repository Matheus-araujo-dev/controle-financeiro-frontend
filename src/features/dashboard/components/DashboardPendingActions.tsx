import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../../components/data/StatusBadge';
import { formatCurrencyBRL } from '../../../shared/currency';
import { formatDateBR } from '../../../shared/date';
import type { DashboardContaResumo } from '../../../types/dashboard';

interface DashboardPendingActionsProps {
  vencidas: DashboardContaResumo[];
  aVencer: DashboardContaResumo[];
  onLiquidar?: (item: DashboardContaResumo) => void;
}

type PendingGroup = 'vencidas' | 'hoje' | 'semana' | 'mes';

function groupByUrgency(vencidas: DashboardContaResumo[], aVencer: DashboardContaResumo[]) {
  const today = new Date().toISOString().split('T')[0];
  const in7 = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const groups: Record<PendingGroup, DashboardContaResumo[]> = {
    vencidas: vencidas,
    hoje: aVencer.filter(i => i.dataVencimento === today),
    semana: aVencer.filter(i => i.dataVencimento > today && i.dataVencimento <= in7),
    mes: aVencer.filter(i => i.dataVencimento > in7),
  };
  return groups;
}

const groupConfig: Record<PendingGroup, { label: string; icon: string; tone: 'danger' | 'warning' | 'neutral' | 'success' }> = {
  vencidas: { label: 'Vencidas', icon: 'error', tone: 'danger' },
  hoje: { label: 'Vencem hoje', icon: 'schedule', tone: 'warning' },
  semana: { label: 'Próximos 7 dias', icon: 'event_upcoming', tone: 'neutral' },
  mes: { label: 'Restante do mês', icon: 'calendar_month', tone: 'neutral' },
};

export const DashboardPendingActions: React.FC<DashboardPendingActionsProps> = ({
  vencidas,
  aVencer,
  onLiquidar
}) => {
  const navigate = useNavigate();
  const groups = groupByUrgency(vencidas, aVencer);
  const totalPendente = [...vencidas, ...aVencer].reduce((acc, i) => acc + i.valor, 0);
  const totalVencidas = vencidas.reduce((acc, i) => acc + i.valor, 0);

  function handleClick(item: DashboardContaResumo) {
    const base = item.tipoLancamento === 'ContaPagar' ? '/contas-pagar' : '/contas-receber';
    navigate(`${base}/${item.id}`);
  }

  return (
    <div className="bg-surface-container-low rounded-2xl border border-white/6 overflow-hidden">
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-headline font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">checklist</span>
            Pendências
          </h3>
          {vencidas.length > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error/15 text-error text-xs font-bold">
              <span className="material-symbols-outlined text-xs">warning</span>
              {vencidas.length} vencida{vencidas.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex gap-4 text-xs">
          <div>
            <span className="text-on-surface-variant">Total pendente</span>
            <p className="text-sm font-bold text-on-surface">{formatCurrencyBRL(totalPendente)}</p>
          </div>
          {totalVencidas > 0 && (
            <div>
              <span className="text-on-surface-variant">Em atraso</span>
              <p className="text-sm font-bold text-error">{formatCurrencyBRL(totalVencidas)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {(Object.keys(groupConfig) as PendingGroup[]).map((key) => {
          const items = groups[key];
          if (!items.length) return null;
          const config = groupConfig[key];

          return (
            <div key={key} className="border-b border-white/5 last:border-b-0">
              <div className="flex items-center gap-2 px-5 py-2 bg-surface-container/50">
                <span className={`material-symbols-outlined text-sm ${key === 'vencidas' ? 'text-error' : 'text-on-surface-variant'}`}>
                  {config.icon}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  {config.label}
                </span>
                <span className="text-[10px] font-bold text-on-surface-variant/50">
                  ({items.length})
                </span>
              </div>
              <ul>
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 px-5 py-2.5 hover:bg-white/3 transition-colors cursor-pointer group"
                    onClick={() => handleClick(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleClick(item); }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-on-surface truncate">{item.descricao}</span>
                        <StatusBadge
                          label={key === 'vencidas' ? 'Vencida' : item.tipoLancamento === 'ContaPagar' ? 'A pagar' : 'A receber'}
                          tone={key === 'vencidas' ? 'danger' : item.tipoLancamento === 'ContaPagar' ? 'warning' : 'success'}
                        />
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] text-on-surface-variant">
                          {formatDateBR(item.dataVencimento)}
                        </span>
                        {item.pessoaNome && (
                          <span className="text-[11px] text-on-surface-variant truncate">
                            {item.pessoaNome}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${item.tipoLancamento === 'ContaPagar' ? 'text-error' : 'text-primary'}`}>
                        {formatCurrencyBRL(item.valor)}
                      </span>
                      {onLiquidar && key !== 'mes' && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onLiquidar(item); }}
                          className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                          aria-label={`Liquidar ${item.descricao}`}
                          title="Liquidar"
                        >
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        {vencidas.length === 0 && aVencer.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 px-5">
            <span className="material-symbols-outlined text-3xl text-primary/30 mb-2">task_alt</span>
            <p className="text-sm text-on-surface-variant">Tudo em dia! Sem pendências.</p>
          </div>
        )}
      </div>
    </div>
  );
};

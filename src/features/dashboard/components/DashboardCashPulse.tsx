import React, { useState } from 'react';
import { NeonBadge } from '../../../components/neon-ledger/NeonBadge';
import { formatCurrencyBRL } from '../../../shared/currency';
import { DashboardFluxoCaixaDia } from '../../../types/dashboard';

interface DashboardCashPulseProps {
  items: DashboardFluxoCaixaDia[];
}

function parseLocalDate(iso: string) {
  return new Date(iso + 'T00:00:00');
}

function formatShortDate(iso: string) {
  return parseLocalDate(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export const DashboardCashPulse: React.FC<DashboardCashPulseProps> = ({ items }) => {
  const today = new Date().toISOString().split('T')[0];
  const safeItems = items ?? [];
  const todayIndex = safeItems.findIndex(i => i.data === today);
  const defaultIndex = todayIndex >= 0 ? todayIndex : Math.max(safeItems.length - 1, 0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const displayIndex = activeIndex ?? defaultIndex;
  const displayItem = safeItems[displayIndex] ?? null;

  const maxSaldo = safeItems.length > 0 ? Math.max(...safeItems.map(i => Math.abs(i.saldoFinalPrevisto)), 1) : 1;
  const diasCriticos = safeItems.filter(i => i.riscoSaldoNegativo).length;

  const labelIndices = new Set<number>();
  if (safeItems.length > 0) {
    labelIndices.add(0);
    for (let i = 7; i < safeItems.length; i += 7) labelIndices.add(i);
    if (safeItems.length > 1) labelIndices.add(safeItems.length - 1);
  }

  return (
    <div className="lg:col-span-2 p-6 flex flex-col gap-4 bg-surface-container-low rounded-2xl border border-white/6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-headline font-bold">Cash Pulse</h3>
          <p className="text-xs text-on-surface-variant">Saldo projetado dia a dia</p>
        </div>
        <NeonBadge variant={diasCriticos > 0 ? 'error' : 'primary'} size="sm">
          {diasCriticos > 0 ? `${diasCriticos} dias críticos` : 'Saudável'}
        </NeonBadge>
      </div>

      {/* Info panel */}
      <div className="flex items-center justify-between rounded-xl bg-surface-container px-3 py-2 border border-white/5 min-h-[38px]">
        {displayItem ? (
          <>
            <span className="text-xs text-on-surface-variant font-medium">
              {formatShortDate(displayItem.data)}
              {displayItem.data === today && (
                <span className="ml-1.5 text-[9px] font-black uppercase tracking-widest text-primary/70">hoje</span>
              )}
            </span>
            <span
              className={`text-sm font-headline font-bold ${
                displayItem.saldoFinalPrevisto < 0 ? 'text-error' : 'text-primary'
              }`}
            >
              {formatCurrencyBRL(displayItem.saldoFinalPrevisto)}
            </span>
          </>
        ) : (
          <span className="text-xs text-on-surface-variant/40 w-full text-center">—</span>
        )}
      </div>

      {/* Chart */}
      <div className="flex flex-col gap-1">
        {/* Bars */}
        <div className="relative h-40 flex items-end gap-px sm:gap-[1.5px]">
          {/* Baseline */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10 pointer-events-none" />

          {safeItems.map((item, index) => {
            const h = (Math.abs(item.saldoFinalPrevisto) / maxSaldo) * 100;
            const isToday = item.data === today;
            const isCritical = item.riscoSaldoNegativo;
            const isActive = activeIndex === index;

            const barClass = isToday
              ? 'bg-primary/70'
              : isCritical
                ? (isActive ? 'bg-error/60' : 'bg-error/35 hover:bg-error/55')
                : (isActive ? 'bg-primary/48' : 'bg-primary/25 hover:bg-primary/42');

            return (
              <div
                key={item.data}
                className={`flex-1 rounded-t transition-all duration-100 cursor-pointer relative ${barClass}`}
                style={{ height: isToday ? '95%' : `${Math.max(h, 3)}%` }}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                onTouchStart={() => setActiveIndex(index)}
                onTouchEnd={() => setTimeout(() => setActiveIndex(null), 1200)}
              >
                {isToday && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </div>
            );
          })}
        </div>

        {/* Day labels */}
        <div className="relative h-4">
          {[...labelIndices].map(index => {
            const pct = safeItems.length > 1 ? (index / (safeItems.length - 1)) * 100 : 0;
            const day = parseLocalDate(safeItems[index].data).getDate();
            return (
              <span
                key={index}
                className="absolute text-[8px] text-on-surface-variant -translate-x-1/2 select-none"
                style={{ left: `${pct}%` }}
              >
                {day}
              </span>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between pt-3 border-t border-outline-variant/10 text-[10px] text-on-surface-variant font-bold tracking-widest uppercase">
        <span>Início do Mês</span>
        <span>Projeção 30D</span>
      </div>
    </div>
  );
};

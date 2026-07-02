import React from 'react';
import { NeonBadge } from '../../../components/neon-ledger/NeonBadge';
import { formatCurrencyBRL } from '../../../shared/currency';
import { DashboardFluxoCaixaDia } from '../../../types/dashboard';

interface DashboardCashPulseProps {
  items: DashboardFluxoCaixaDia[];
}

export const DashboardCashPulse: React.FC<DashboardCashPulseProps> = ({ items }) => {
  const maxSaldo = Math.max(...items.map(i => Math.abs(i.saldoFinalPrevisto)), 1);
  const diasCriticos = items.filter(i => i.riscoSaldoNegativo).length;

  return (
    <div className="lg:col-span-2 p-6 flex flex-col gap-6 bg-surface-container-low rounded-2xl border border-white/6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-headline font-bold">Cash Pulse</h3>
          <p className="text-xs text-on-surface-variant">Curva diária do saldo final projetado</p>
        </div>
        <div className="flex gap-2">
          <NeonBadge variant={diasCriticos > 0 ? 'error' : 'primary'} size="sm">
            {diasCriticos > 0 ? `${diasCriticos} dias críticos` : 'Saudável'}
          </NeonBadge>
        </div>
      </div>

      <div className="h-64 relative flex items-end justify-between gap-1 group">
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <span className="text-4xl font-black text-primary select-none uppercase tracking-[1em]">
            Fluxo
          </span>
        </div>
        
        <div className="w-full h-full flex items-end justify-between px-2 gap-1.5 md:gap-2">
          {items.map((item) => {
            const height = (Math.abs(item.saldoFinalPrevisto) / maxSaldo) * 100;
            const isToday = new Date().toISOString().split('T')[0] === item.data;
            
            return (
              <div 
                key={item.data}
                className={`
                  flex-1 rounded-t-sm transition-all duration-300 cursor-pointer relative group/bar
                  ${isToday
                    ? 'bg-primary/60 h-[95%]'
                    : item.riscoSaldoNegativo
                      ? 'bg-error/40 hover:bg-error/60' 
                      : 'bg-surface-container-highest hover:bg-primary/20'}
                `}
                style={{ height: isToday ? undefined : `${Math.max(height, 5)}%` }}
              >
                {/* Tooltip */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-surface-container-highest px-3 py-2 rounded-lg text-[10px] opacity-0 group-hover/bar:opacity-100 whitespace-nowrap transition-all duration-200 border border-primary/20 z-10 shadow-xl pointer-events-none">
                  <p className="font-bold text-on-surface">{new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                  <p className={item.saldoFinalPrevisto < 0 ? 'text-error' : 'text-primary'}>
                    {formatCurrencyBRL(item.saldoFinalPrevisto)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-outline-variant/10 text-[10px] text-on-surface-variant font-bold tracking-widest uppercase">
        <span>Início do Mês</span>
        <span>Projeção 30D</span>
      </div>
    </div>
  );
};

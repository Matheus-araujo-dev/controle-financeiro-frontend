import React from 'react';
import { GlassCard } from '../../../components/neon-ledger/GlassCard';
import { formatCurrencyBRL } from '../../../shared/currency';
import { formatDateBR } from '../../../shared/date';
import { DashboardContaResumo } from '../../../types/dashboard';

interface DashboardOperationalAgendaProps {
  items: DashboardContaResumo[];
}

export const DashboardOperationalAgenda: React.FC<DashboardOperationalAgendaProps> = ({ items }) => {
  return (
    <GlassCard className="p-6 flex flex-col gap-6" hoverable>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-headline font-bold">Agenda</h3>
        <button className="p-1 hover:bg-surface-container-highest rounded transition-colors">
          <span className="material-symbols-outlined text-lg text-on-surface-variant">more_horiz</span>
        </button>
      </div>

      <div className="space-y-6 overflow-y-auto max-h-[340px] pr-2 custom-scrollbar">
        {items.map((item) => {
          const isToday = new Date().toISOString().split('T')[0] === item.dataVencimento;
          
          return (
            <div key={item.id} className="flex gap-4 group">
              <div className="flex flex-col items-center">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-primary' : 'text-on-surface-variant'}`}>
                  {isToday ? 'Hoje' : formatDateBR(item.dataVencimento).split('/')[0] + '/' + formatDateBR(item.dataVencimento).split('/')[1]}
                </span>
                <div className="w-px h-full bg-outline-variant/20 mt-2 group-last:hidden"></div>
              </div>
              <div className="flex-1 pb-2">
                <div className={`
                  bg-surface-container-low p-3 rounded-xl border-l-4 transition-all duration-300 group-hover:bg-surface-container
                  ${item.tipoLancamento === 'ContaPagar' ? 'border-error' : 'border-primary'}
                `}>
                  <p className="text-xs font-bold text-on-surface group-hover:text-white transition-colors">
                    {item.descricao}
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-[10px] text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">
                        {item.tipoLancamento === 'ContaPagar' ? 'payments' : 'call_received'}
                      </span>
                      {item.pessoaNome}
                    </p>
                    <p className={`text-[11px] font-bold ${item.tipoLancamento === 'ContaPagar' ? 'text-error' : 'text-primary'}`}>
                      {formatCurrencyBRL(item.valor)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 opacity-30 italic text-sm">
            Sem compromissos para o período.
          </div>
        )}
      </div>

      <button className="mt-2 text-[10px] font-bold text-primary hover:underline self-center uppercase tracking-[0.2em] transition-all">
        Ver calendário completo
      </button>
    </GlassCard>
  );
};

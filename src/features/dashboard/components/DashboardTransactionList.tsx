import React from 'react';
import { GlassCard } from '../../../components/neon-ledger/GlassCard';
import { NeonDataGrid } from '../../../components/neon-ledger/NeonDataGrid';
import { NeonBadge } from '../../../components/neon-ledger/NeonBadge';
import { formatCurrencyBRL } from '../../../shared/currency';
import { formatDateBR } from '../../../shared/date';
import { DashboardMovimentacaoResumo } from '../../../types/dashboard';

interface DashboardTransactionListProps {
  movimentacoes: DashboardMovimentacaoResumo[];
  onViewAll?: () => void;
}

export const DashboardTransactionList: React.FC<DashboardTransactionListProps> = ({ 
  movimentacoes,
  onViewAll 
}) => {
  return (
    <GlassCard className="overflow-hidden flex flex-col">
      <div className="px-6 py-4 flex justify-between items-center border-b border-outline-variant/10">
        <h3 className="text-lg font-headline font-bold">Lançamentos Recentes</h3>
        <div className="flex gap-2">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm group-focus-within:text-primary transition-colors">
              search
            </span>
            <input 
              className="bg-surface-container-low border-none text-xs rounded-lg pl-9 pr-4 py-2 w-48 focus:ring-1 focus:ring-primary/40 outline-none transition-all" 
              placeholder="Filtrar..." 
              type="text"
            />
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <NeonDataGrid
          columns={[
            {
              key: 'dataMovimentacao',
              label: 'Data',
              render: (v) => <span className="text-on-surface-variant">{formatDateBR(v)}</span>
            },
            {
              key: 'observacao',
              label: 'Descrição',
              render: (v) => <span className="font-medium">{v || 'Movimentação financeira'}</span>
            },
            {
              key: 'natureza',
              label: 'Categoria',
              render: (v) => <NeonBadge variant="neutral" size="sm" fill="solid">{v}</NeonBadge>
            },
            {
              key: 'status',
              label: 'Status',
              render: () => (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary ring-2 ring-primary/20"></div>
                  <span className="text-[11px] text-on-surface">Confirmado</span>
                </div>
              )
            },
            {
              key: 'valor',
              label: 'Valor',
              align: 'right',
              render: (v, record) => (
                <span className={`font-bold ${record.tipo === 'Entrada' ? 'text-primary' : 'text-error'}`}>
                  {record.tipo === 'Entrada' ? '+' : '-'} {formatCurrencyBRL(v)}
                </span>
              )
            }
          ]}
          data={movimentacoes}
        />
      </div>

      <div className="p-4 border-t border-outline-variant/5 text-center">
        <button 
          onClick={onViewAll}
          className="text-xs font-bold text-primary hover:underline hover:glow-sm uppercase tracking-widest transition-all"
        >
          Ver histórico completo
        </button>
      </div>
    </GlassCard>
  );
};

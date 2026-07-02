import { EyeOutlined } from '@ant-design/icons';
import React from 'react';
import { AppDataTable, type TableColumnsType } from '../../../components/data/AppDataTable';
import { IconActionButton } from '../../../components/data/IconActionButton';
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
  const columns: TableColumnsType<DashboardMovimentacaoResumo> = [
    {
      title: 'Data',
      dataIndex: 'dataMovimentacao',
      key: 'dataMovimentacao',
      render: (value) => <span className="text-on-surface-variant">{formatDateBR(String(value))}</span>
    },
    {
      title: 'Descrição',
      dataIndex: 'observacao',
      key: 'observacao',
      render: (value) => <span className="font-medium">{String(value) || 'Movimentação financeira'}</span>
    },
    {
      title: 'Categoria',
      dataIndex: 'natureza',
      key: 'natureza',
      render: (value) => (
        <span className="inline-flex items-center rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
          {String(value)}
        </span>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: () => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-primary/20" />
          <span className="text-[11px] text-on-surface">Confirmado</span>
        </div>
      )
    },
    {
      title: 'Valor',
      dataIndex: 'valor',
      key: 'valor',
      align: 'right',
      render: (value, record) => (
        <span className={`font-bold ${record.tipo === 'Entrada' ? 'text-primary' : 'text-error'}`}>
          {record.tipo === 'Entrada' ? '+' : '-'} {formatCurrencyBRL(Number(value))}
        </span>
      )
    },
    {
      title: 'Ações',
      key: 'acoes',
      align: 'right',
      width: 100,
      render: () => <IconActionButton label="Detalhar" icon={<EyeOutlined />} href="/movimentacoes" />
    }
  ];

  return (
    <div className="overflow-hidden flex flex-col bg-surface-container-low rounded-2xl border border-white/6">
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

      <AppDataTable
        rowKey={(record) => `${record.dataMovimentacao}-${record.observacao ?? ''}-${record.valor}`}
        columns={columns}
        dataSource={movimentacoes}
        pagination={false}
      />

      <div className="p-4 border-t border-outline-variant/5 text-center">
        <button
          onClick={onViewAll}
          className="text-xs font-bold hover:underline uppercase tracking-widest transition-all"
          style={{ color: 'var(--color-primary)' }}
        >
          Ver histórico completo
        </button>
      </div>
    </div>
  );
};

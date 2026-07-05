import React from 'react';
import { formatCurrencyBRL } from '../../../shared/currency';

interface KpiCardProps {
  label: string;
  value: number;
  icon: string;
  color: 'primary' | 'error' | 'secondary' | 'neutral';
  supportText?: string;
  trend?: {
    value: string;
    isUp: boolean;
  };
  progress?: number;
}

const KpiCard: React.FC<KpiCardProps> = ({ 
  label, 
  value, 
  icon, 
  color, 
  supportText, 
  trend,
  progress 
}) => {
  const iconColors = {
    primary: 'text-primary',
    error: 'text-error',
    secondary: 'text-secondary',
    neutral: 'text-on-surface-variant'
  };

  return (
    <div className="totalizador-card p-4 sm:p-6 min-h-[110px] sm:min-h-[148px] flex flex-col group">
      <div className="flex justify-between items-start">
        <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
          {label}
        </span>
        <span
          className={`material-symbols-outlined ${iconColors[color]} group-hover:scale-110 transition-transform`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
      </div>
      <div className="mt-2 sm:mt-4">
        <p className={`text-xl sm:text-2xl lg:text-3xl font-headline font-bold leading-tight ${color === 'primary' ? 'text-primary neon-glow' : 'text-on-surface'}`}>
          {formatCurrencyBRL(value)}
        </p>

        {trend && (
          <p className={`text-[11px] flex items-center gap-1 mt-1 font-semibold ${trend.isUp ? 'text-primary' : 'text-error'}`}>
            <span className="material-symbols-outlined text-[12px]">
              {trend.isUp ? 'trending_up' : 'trending_down'}
            </span>
            {trend.value}
          </p>
        )}

        {supportText && !trend && (
          <p className="text-[11px] text-on-surface-variant mt-1 font-medium italic">
            {supportText}
          </p>
        )}

        {progress !== undefined && (
          <div className="w-full bg-surface-container-highest h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

interface DashboardKpiGridProps {
  saldoAtual: number;
  totalAPagar: number;
  totalAReceber: number;
  saldoProjetado: number;
  numContasPendentes: number;
}

export const DashboardKpiGrid: React.FC<DashboardKpiGridProps> = ({
  saldoAtual,
  totalAPagar,
  totalAReceber,
  saldoProjetado,
  numContasPendentes
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
      <KpiCard
        label="Saldo Atual"
        value={saldoAtual}
        icon="account_balance_wallet"
        color="primary"
      />
      <KpiCard
        label="A Pagar"
        value={totalAPagar}
        icon="payments"
        color="error"
        supportText={`${numContasPendentes} faturas pendentes`}
      />
      <KpiCard
        label="A Receber"
        value={totalAReceber}
        icon="call_received"
        color="secondary"
      />
      <KpiCard
        label="Projetado (Fim de Mês)"
        value={saldoProjetado}
        icon="insights"
        color="neutral"
        progress={saldoAtual > 0 ? (saldoAtual / Math.max(saldoProjetado, 1)) * 100 : 0}
      />
    </div>
  );
};

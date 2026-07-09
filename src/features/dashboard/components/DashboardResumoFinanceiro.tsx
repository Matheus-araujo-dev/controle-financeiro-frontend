import { formatCurrencyBRL } from '../../../shared/currency';
import type { DashboardContaGerencialResumo } from '../../../types/dashboard';

interface Props {
  data: DashboardContaGerencialResumo | undefined;
  referenceMonth: string;
}

function formatMonth(yyyyMM: string) {
  const [y, m] = yyyyMM.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1));
}

export function DashboardResumoFinanceiro({ data, referenceMonth }: Props) {
  const receitas = data?.totalReceitas ?? 0;
  const despesas = data?.totalDespesas ?? 0;
  const saldo = data?.saldo ?? 0;
  const total = receitas + despesas;
  const pctReceitas = total > 0 ? (receitas / total) * 100 : 50;
  const pctDespesas = total > 0 ? (despesas / total) * 100 : 50;
  const saldoPositivo = saldo >= 0;

  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-white/5 bg-surface-container-low p-6">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/5 bg-surface-container text-primary">
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>monitoring</span>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Receitas vs Despesas</p>
          <p className="font-headline text-base font-bold text-on-surface">{formatMonth(referenceMonth)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/5 bg-surface-container p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Receitas</p>
          <p className="mt-1 font-headline text-lg font-extrabold text-primary">{formatCurrencyBRL(receitas)}</p>
          <p className="text-xs text-on-surface-variant">{pctReceitas.toFixed(0)}% do total</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-surface-container p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Despesas</p>
          <p className="mt-1 font-headline text-lg font-extrabold text-error">{formatCurrencyBRL(despesas)}</p>
          <p className="text-xs text-on-surface-variant">{pctDespesas.toFixed(0)}% do total</p>
        </div>
      </div>

      {total > 0 && (
        <div className="space-y-1">
          <div className="flex h-3 overflow-hidden rounded-full bg-white/5">
            <div className="h-full bg-primary transition-all" style={{ width: `${pctReceitas}%` }} />
            <div className="h-full bg-error transition-all" style={{ width: `${pctDespesas}%` }} />
          </div>
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
            <span className="text-primary">{pctReceitas.toFixed(0)}% receitas</span>
            <span className="text-error">{pctDespesas.toFixed(0)}% despesas</span>
          </div>
        </div>
      )}

      <div className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${saldoPositivo ? 'border-primary/20 bg-primary/5' : 'border-error/20 bg-error/5'}`}>
        <span className="text-sm font-bold text-on-surface-variant">Resultado do mês</span>
        <span className={`font-headline text-xl font-extrabold ${saldoPositivo ? 'text-primary' : 'text-error'}`}>
          {formatCurrencyBRL(saldo)}
        </span>
      </div>
    </div>
  );
}

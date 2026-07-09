import { formatCurrencyBRL } from '../../../shared/currency';
import type { ContaBancariaResumo } from '../../../types/cadastros';

interface Props {
  contas: ContaBancariaResumo[];
}

export function DashboardSaldoPorConta({ contas }: Props) {
  const ativas = contas.filter((c) => c.ativo);
  const saldoTotal = ativas.reduce((acc, c) => acc + c.saldoAtual, 0);
  const sorted = [...ativas].sort((a, b) => b.saldoAtual - a.saldoAtual);

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-white/5 bg-surface-container-low p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/5 bg-surface-container text-primary">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Saldo por conta</p>
            <p className="font-headline text-base font-bold text-on-surface">Contas bancárias</p>
          </div>
        </div>
        <span className={`text-sm font-bold tabular-nums ${saldoTotal >= 0 ? 'text-primary' : 'text-error'}`}>
          {formatCurrencyBRL(saldoTotal)}
        </span>
      </div>

      {sorted.length === 0 ? (
        <p className="py-4 text-center text-sm text-on-surface-variant">Nenhuma conta cadastrada.</p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((conta) => {
            const cor = conta.cor ?? '#2bf58e';
            const icone = conta.icone ?? 'account_balance';
            const isPositive = conta.saldoAtual >= 0;

            return (
              <li
                key={conta.id}
                className="flex items-center gap-3 rounded-2xl border border-white/5 bg-surface-container px-4 py-3 transition-colors hover:bg-surface-container-high"
              >
                <div
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                  style={{ backgroundColor: `${cor}20`, color: cor }}
                >
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {icone}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-on-surface">{conta.nome}</p>
                  <p className="text-xs text-on-surface-variant">{conta.banco}</p>
                </div>
                <span className={`shrink-0 text-sm font-bold tabular-nums ${isPositive ? 'text-primary' : 'text-error'}`}>
                  {formatCurrencyBRL(conta.saldoAtual)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

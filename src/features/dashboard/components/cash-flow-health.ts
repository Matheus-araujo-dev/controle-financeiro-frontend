import type { DashboardFluxoCaixa } from '../../../types/dashboard';

type Health = { state: 'empty' | 'incomplete' } | {
  state: 'ready'; firstNegative: string | null; minimum: number;
  initial: number; final: number; change: number; start: string; end: string;
};

export function analyzeCashFlow(data: DashboardFluxoCaixa | undefined, month: string): Health {
  if (!data || data.itens.length === 0) return { state: 'empty' };
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return { state: 'incomplete' };
  const start = `${month}-01`;
  const [year, monthNumber] = month.split('-').map(Number);
  const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  if (data.visao !== 'Caixa' || data.dataInicial !== start || data.dias !== days || data.itens.length !== days) return { state: 'incomplete' };
  let previous = data.itens[0].saldoInicial;
  for (const [index, day] of data.itens.entries()) {
    const date = `${month}-${String(index + 1).padStart(2, '0')}`;
    if (day.data !== date || ![day.saldoInicial, day.entradasPrevistas, day.saidasPrevistas, day.saldoFinalPrevisto].every(Number.isFinite) ||
      Math.abs(day.saldoInicial - previous) > 0.011 ||
      Math.abs(day.saldoInicial + day.entradasPrevistas - day.saidasPrevistas - day.saldoFinalPrevisto) > 0.011 ||
      day.riscoSaldoNegativo !== (day.saldoFinalPrevisto < 0)) return { state: 'incomplete' };
    previous = day.saldoFinalPrevisto;
  }
  const firstNegative = data.itens.find(day => day.saldoFinalPrevisto < 0)?.data ?? null;
  if (data.riscoSaldoNegativo !== (firstNegative !== null)) return { state: 'incomplete' };
  const initial = data.itens[0].saldoInicial;
  return { state: 'ready', firstNegative, minimum: Math.min(...data.itens.map(day => day.saldoFinalPrevisto)), initial,
    final: previous, change: Math.round((previous - initial) * 100) / 100, start, end: `${month}-${days}` };
}

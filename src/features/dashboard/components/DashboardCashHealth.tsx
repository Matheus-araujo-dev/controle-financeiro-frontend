import { Link } from 'react-router-dom';
import type { DashboardFluxoCaixa } from '../../../types/dashboard';
import { formatCurrencyBRL } from '../../../shared/currency';
import { formatDateBR } from '../../../shared/date';
import { analyzeCashFlow } from './cash-flow-health';

type Props = { data?: DashboardFluxoCaixa; referenceMonth: string; loading?: boolean; error?: boolean; onRetry?: () => void };
export function DashboardCashHealth({ data, referenceMonth, loading, error, onRetry }: Props) {
  const health = analyzeCashFlow(data, referenceMonth);
  const message = error ? 'Previsão indisponível' : loading ? 'Atualizando previsão' : health.state === 'empty' ? 'Sem dados de caixa' : health.state === 'incomplete' ? 'Previsão incompleta' : null;
  return <section aria-label="Saúde e previsão de caixa" className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-6 space-y-4">
    <h2 className="text-lg font-bold">Saúde e previsão de caixa</h2>
    {message ? <div role="status"><p>{message}</p><p className="text-sm text-on-surface-variant">Aguarde dados completos do mês para avaliar o risco.</p>{error && <button type="button" className="underline p-2" onClick={onRetry}>Tentar novamente</button>}</div> : health.state === 'ready' && <>
      <p className={health.firstNegative ? 'text-error font-bold' : 'text-on-surface'}>{health.firstNegative ? `Primeiro saldo negativo: ${formatDateBR(health.firstNegative)}` : 'Nenhum saldo negativo no período informado'}</p>
      <p className="text-sm text-on-surface-variant">De {formatDateBR(health.start)} a {formatDateBR(health.end)} · Todas as contas. Estimativa baseada nos registros disponíveis; não é garantia de saldo nem confirmação de conciliação.</p>
      <dl className="grid gap-4 sm:grid-cols-3">
        <div><dt>Menor saldo diário</dt><dd className="font-bold">{formatCurrencyBRL(health.minimum)}</dd></div>
        <div><dt>Saldo ao fim do período</dt><dd className="font-bold">{formatCurrencyBRL(health.final)}</dd></div>
        <div><dt>Tendência no período</dt><dd className="font-bold">{health.change > 0 ? 'Aumento' : health.change < 0 ? 'Redução' : 'Estável'}{health.change !== 0 && ` de ${formatCurrencyBRL(Math.abs(health.change))}`}</dd></div>
      </dl>
      <p className="text-sm">Saldo inicial de {formatCurrencyBRL(health.initial)}, mais entradas e menos saídas. A data negativa é a primeira da série do mês, podendo estar no passado. Projeções ainda não materializadas seguem as regras do mês selecionado.</p>
      <details><summary className="cursor-pointer underline py-2">Ver composição diária</summary>
        <div className="max-h-80 overflow-auto"><table aria-label="Composição diária do caixa" className="w-full text-sm text-right"><thead><tr>{['Data', 'Saldo inicial', 'Entradas', 'Saídas', 'Saldo final'].map(label => <th key={label} className="p-2 whitespace-nowrap">{label}</th>)}</tr></thead>
          <tbody>{data!.itens.map(day => <tr key={day.data} className={day.riscoSaldoNegativo ? 'text-error' : ''}><th className="p-2 whitespace-nowrap">{formatDateBR(day.data)}</th>{[day.saldoInicial, day.entradasPrevistas, day.saidasPrevistas, day.saldoFinalPrevisto].map((value, index) => <td className="p-2 whitespace-nowrap" key={index}>{formatCurrencyBRL(value)}</td>)}</tr>)}</tbody></table></div>
      </details>
      <div className="flex flex-wrap gap-4 text-sm underline">
        <Link to={`/contas-pagar?dataInicial=${health.start}&dataFinal=${health.end}`}>Consultar contas a pagar</Link>
        <Link to={`/contas-receber?dataInicial=${health.start}&dataFinal=${health.end}`}>Consultar contas a receber</Link>
        <Link to={`/movimentacoes?dataInicial=${health.start}&dataFinal=${health.end}`}>Consultar movimentações</Link>
      </div>
      <p className="text-xs text-on-surface-variant">As consultas abrem registros do período; previsões de recorrências ainda não geradas podem não aparecer como lançamentos.</p>
    </>}
  </section>;
}

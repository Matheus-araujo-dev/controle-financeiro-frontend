import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SummaryCard, ListPageShell } from '../../components/layout';
import { formatCurrencyBRL } from '../../shared/currency';
import { dashboardApi } from '../../services/http/dashboard-api';
import { usePurchaseSimulator, type SimulationInput } from './usePurchaseSimulator';
import type { SimulationScenario } from './usePurchaseSimulator';

function ScenarioCard({ scenario, recommended }: { scenario: SimulationScenario; recommended: boolean }) {
  return (
    <article
      className={`rounded-2xl border p-4 sm:p-6 ${
        recommended ? 'border-primary/40 bg-primary/5' : 'border-white/6 bg-surface-container-low'
      }`}
    >
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-lg font-semibold text-on-surface">{scenario.label}</h3>
        {recommended && (
          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
            Recomendado
          </span>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-on-surface-variant">Valor da parcela</dt>
          <dd className="mt-0.5 font-semibold text-on-surface">{formatCurrencyBRL(scenario.valorParcela)}</dd>
        </div>
        <div>
          <dt className="text-on-surface-variant">Valor total</dt>
          <dd className="mt-0.5 font-semibold text-on-surface">{formatCurrencyBRL(scenario.valorTotal)}</dd>
        </div>
        <div>
          <dt className="text-on-surface-variant">Custo de juros</dt>
          <dd className={`mt-0.5 font-semibold ${scenario.custoJuros > 0 ? 'text-error' : 'text-success'}`}>
            {formatCurrencyBRL(scenario.custoJuros)}
          </dd>
        </div>
        <div>
          <dt className="text-on-surface-variant">% da receita</dt>
          <dd className={`mt-0.5 font-semibold ${scenario.percentualRenda > 30 ? 'text-warning' : 'text-on-surface'}`}>
            {scenario.percentualRenda.toFixed(1)}%
          </dd>
        </div>
        <div>
          <dt className="text-on-surface-variant">Comprometimento</dt>
          <dd className={`mt-0.5 font-semibold ${scenario.comprometimentoAposCompra > 70 ? 'text-error' : 'text-on-surface'}`}>
            {scenario.comprometimentoAposCompra.toFixed(1)}%
          </dd>
        </div>
        <div>
          <dt className="text-on-surface-variant">Meses para recuperar</dt>
          <dd className="mt-0.5 font-semibold text-on-surface">
            {scenario.mesesParaRecuperar === Infinity ? '\u2014' : `${scenario.mesesParaRecuperar} meses`}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function ImpactBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="mb-2">
      <div className="mb-1 flex justify-between text-xs text-on-surface-variant">
        <span>{label}</span>
        <span>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-white/10">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const PARCELAS_OPTIONS = [2, 3, 4, 5, 6, 8, 10, 12, 18, 24];

export function SimuladorCompraPage() {
  const [valor, setValor] = useState('');
  const [parcelas, setParcelas] = useState(3);
  const [taxaJuros, setTaxaJuros] = useState('0');

  const { data: summary } = useQuery({
    queryKey: ['dashboard', 'resumo'],
    queryFn: () => dashboardApi.obterResumo(),
    staleTime: 5 * 60_000,
  });

  const { data: contasGerenciais } = useQuery({
    queryKey: ['dashboard', 'contas-gerenciais'],
    queryFn: () => dashboardApi.obterResumoContasGerenciais(),
    staleTime: 5 * 60_000,
  });

  const saldoAtual = summary?.saldoAtual ?? 0;
  const receitaMensal = contasGerenciais?.totalReceitas ?? 0;
  const despesaMensal = contasGerenciais?.totalDespesas ?? 0;

  const parsedValor = parseFloat(valor.replace(/[^\d,.-]/g, '').replace(',', '.'));
  const parsedTaxa = parseFloat(taxaJuros.replace(',', '.'));

  const input: SimulationInput | null =
    !isNaN(parsedValor) && parsedValor > 0
      ? {
          valor: parsedValor,
          parcelas,
          taxaJuros: isNaN(parsedTaxa) ? 0 : parsedTaxa,
          saldoAtual,
          receitaMensal,
          despesaMensal,
        }
      : null;

  const result = usePurchaseSimulator(input);

  const handleValorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValor(e.target.value);
  }, []);

  const handleTaxaChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTaxaJuros(e.target.value);
  }, []);

  return (
    <ListPageShell
      summary={
        <>
          <SummaryCard label="Saldo atual" value={formatCurrencyBRL(saldoAtual)} accent="muted" />
          <SummaryCard label="Receita mensal" value={formatCurrencyBRL(receitaMensal)} accent="primary" />
          <SummaryCard label="Despesa mensal" value={formatCurrencyBRL(despesaMensal)} accent="error" />
        </>
      }
      summaryColumns={3}
    >
      <section className="mb-6 rounded-2xl border border-white/6 bg-surface-container-low p-4 sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-on-surface">Dados da compra</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="sim-valor" className="mb-1 block text-sm text-on-surface-variant">
              Valor da compra
            </label>
            <input
              id="sim-valor"
              type="text"
              inputMode="decimal"
              className="w-full rounded-lg border border-white/10 bg-surface-container px-3 py-2 text-on-surface outline-none focus:border-primary"
              placeholder="R$ 0,00"
              value={valor}
              onChange={handleValorChange}
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="sim-parcelas" className="mb-1 block text-sm text-on-surface-variant">
              Parcelas
            </label>
            <select
              id="sim-parcelas"
              className="w-full rounded-lg border border-white/10 bg-surface-container px-3 py-2 text-on-surface outline-none focus:border-primary"
              value={parcelas}
              onChange={e => setParcelas(Number(e.target.value))}
            >
              {PARCELAS_OPTIONS.map(n => (
                <option key={n} value={n}>{n}x</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sim-juros" className="mb-1 block text-sm text-on-surface-variant">
              Juros mensal (%)
            </label>
            <input
              id="sim-juros"
              type="text"
              inputMode="decimal"
              className="w-full rounded-lg border border-white/10 bg-surface-container px-3 py-2 text-on-surface outline-none focus:border-primary"
              placeholder="0"
              value={taxaJuros}
              onChange={handleTaxaChange}
            />
          </div>
        </div>
      </section>

      {result && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <ScenarioCard scenario={result.aVista} recommended={result.recomendacao === 'a_vista'} />
            <ScenarioCard scenario={result.parcelado} recommended={result.recomendacao === 'parcelado'} />
          </div>

          {result.economia > 0 && (
            <section className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center">
              <p className="text-sm text-on-surface-variant">Economia pagando à vista</p>
              <p className="mt-1 text-2xl font-bold text-primary">{formatCurrencyBRL(result.economia)}</p>
            </section>
          )}

          <section className="mb-6 rounded-2xl border border-white/6 bg-surface-container-low p-4 sm:p-6">
            <h2 className="mb-4 text-base font-semibold text-on-surface">Impacto no orçamento</h2>
            <ImpactBar
              label="À vista — comprometimento"
              value={result.aVista.comprometimentoAposCompra}
              max={100}
              color={result.aVista.comprometimentoAposCompra > 70 ? 'bg-error' : 'bg-primary'}
            />
            <ImpactBar
              label={`${parcelas}x — comprometimento`}
              value={result.parcelado.comprometimentoAposCompra}
              max={100}
              color={result.parcelado.comprometimentoAposCompra > 70 ? 'bg-error' : 'bg-success'}
            />
            <ImpactBar
              label="Saldo restante (à vista)"
              value={Math.max(saldoAtual - parsedValor, 0)}
              max={saldoAtual}
              color="bg-primary"
            />
          </section>

          {result.alertas.length > 0 && (
            <section className="rounded-2xl border border-warning/20 bg-warning/5 p-4">
              <h2 className="mb-2 text-sm font-semibold text-warning">Alertas</h2>
              <ul className="space-y-1">
                {result.alertas.map((alerta, i) => (
                  <li key={i} className="text-sm text-on-surface-variant">{'\u2022'} {alerta}</li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {!result && valor && !isNaN(parsedValor) && parsedValor > 0 && (
        <div className="rounded-2xl border border-white/6 bg-surface-container-low p-6 text-center text-on-surface-variant">
          Selecione ao menos 2 parcelas para ver a simulação.
        </div>
      )}

      {!valor && (
        <div className="rounded-2xl border border-white/6 bg-surface-container-low p-6 text-center text-on-surface-variant">
          Informe o valor da compra para iniciar a simulação.
        </div>
      )}
    </ListPageShell>
  );
}

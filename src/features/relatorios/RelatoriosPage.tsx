import { useEffect, useState } from 'react';
import { dashboardApi } from '../../services/http/dashboard-api';
import type { DashboardResponsavelResumo } from '../../types/dashboard';
import { PageState } from '../../components/states/PageState';
import { formatCurrencyBRL } from '../../shared/currency';

function getCurrentReferenceMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Relatórios gerenciais. Primeiro relatório: gastos e receitas por responsável
 * (quem causou o lançamento) em um período, com abertura do que foi no cartão.
 */
export function RelatoriosPage() {
  const [referenceMonth, setReferenceMonth] = useState(getCurrentReferenceMonth());
  const [data, setData] = useState<DashboardResponsavelResumo>();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    setLoading(true);
    setErrorMessage(undefined);
    dashboardApi
      .obterResumoPorResponsaveis({ mesReferencia: referenceMonth })
      .then(setData)
      .catch((error) =>
        setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar o relatório.')
      )
      .finally(() => setLoading(false));
  }, [referenceMonth]);

  if (loading && !data) {
    return <PageState state="loading" title="Carregando relatório..." />;
  }

  const itens = data?.itens ?? [];
  const maiorDespesa = Math.max(1, ...itens.map((item) => item.totalDespesas));

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-on-surface-variant font-label text-xs uppercase tracking-[0.2em] mb-2">Análises</h2>
          <h1 className="text-4xl font-headline font-extrabold tracking-tight text-on-surface m-0">
            Gastos por <span className="text-primary">Responsável</span>
          </h1>
          <p className="text-on-surface-variant mt-2 mb-0">
            Quem movimentou o financeiro da família no período — incluindo compras no cartão.
          </p>
        </div>
        <input
          type="month"
          aria-label="Mês de referência do relatório"
          value={referenceMonth}
          onChange={(event) => setReferenceMonth(event.target.value || getCurrentReferenceMonth())}
          className="bg-surface-container-highest border border-outline-variant/15 rounded-xl px-4 py-2 text-sm font-semibold text-on-surface outline-none focus:border-primary/40 transition-all cursor-pointer"
        />
      </div>

      {errorMessage ? (
        <div className="bg-error/10 border border-error/30 p-4 rounded-2xl text-error text-sm font-bold">
          {errorMessage}
        </div>
      ) : null}

      {/* Totais do período */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-container p-6 rounded-[1.5rem] border border-white/5">
          <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest block mb-2">
            Despesas no período
          </span>
          <span className="text-error text-3xl font-headline font-extrabold">
            {formatCurrencyBRL(data?.totalDespesas ?? 0)}
          </span>
        </div>
        <div className="bg-surface-container p-6 rounded-[1.5rem] border border-white/5">
          <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest block mb-2">
            Receitas no período
          </span>
          <span className="text-primary text-3xl font-headline font-extrabold">
            {formatCurrencyBRL(data?.totalReceitas ?? 0)}
          </span>
        </div>
        <div className="bg-surface-container p-6 rounded-[1.5rem] border border-white/5">
          <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest block mb-2">
            Pessoas envolvidas
          </span>
          <span className="text-on-surface text-3xl font-headline font-extrabold">{itens.length}</span>
        </div>
      </div>

      {/* Ranking por responsável */}
      <div className="bg-surface-container-low p-6 md:p-8 rounded-3xl border border-white/5 space-y-5">
        {itens.length === 0 ? (
          <PageState
            state="empty"
            title="Nenhum lançamento no período"
            subtitle="Ajuste o mês de referência ou registre lançamentos com responsável."
          />
        ) : (
          itens.map((item) => (
            <div
              key={item.responsavelId ?? 'sem-responsavel'}
              className="rounded-2xl bg-surface-container px-5 py-4 border border-white/5 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-black shrink-0">
                    {item.responsavelNome.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-base font-bold text-on-surface truncate">{item.responsavelNome}</div>
                    <div className="text-[11px] text-on-surface-variant">
                      {item.quantidadeLancamentos} lançamento(s)
                      {item.totalDespesasCartao > 0
                        ? ` · ${formatCurrencyBRL(item.totalDespesasCartao)} no cartão`
                        : ''}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Despesas</div>
                    <div className="text-lg font-headline font-extrabold text-error">
                      {formatCurrencyBRL(item.totalDespesas)}
                    </div>
                  </div>
                  {item.totalReceitas > 0 ? (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Receitas</div>
                      <div className="text-lg font-headline font-extrabold text-primary">
                        {formatCurrencyBRL(item.totalReceitas)}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Barra proporcional de despesas (cartão em lima, restante em verde) */}
              <div className="h-2 rounded-full bg-white/5 overflow-hidden flex">
                <div
                  className="h-full bg-tertiary"
                  style={{ width: `${(item.totalDespesasCartao / maiorDespesa) * 100}%` }}
                />
                <div
                  className="h-full bg-primary/70"
                  style={{ width: `${((item.totalDespesas - item.totalDespesasCartao) / maiorDespesa) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}

        {itens.length > 0 ? (
          <div className="flex items-center gap-5 pt-1 text-[11px] text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-tertiary inline-block" /> Cartão de crédito
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary/70 inline-block" /> Demais despesas
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

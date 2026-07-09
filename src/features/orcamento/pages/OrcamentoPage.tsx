import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { formCompactFieldClass } from '../../../components/forms/FormPrimitives';
import { DateInput } from '../../../components/forms/DateInput';
import { PageState } from '../../../components/states/PageState';
import { orcamentosApi } from '../../../services/http/orcamentos-api';
import { CurrencyInput } from '../../../shared/CurrencyInput';
import { formatCurrencyBRL } from '../../../shared/currency';
import type { OrcamentoCompetencia, OrcamentoItem } from '../../../types/orcamento';

function getCurrentCompetencia() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatCompetencia(value: string) {
  const [year, month] = value.split('-').map(Number);
  if (!year || !month) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
}

// Verde abaixo de 80%, âmbar entre 80% e 100%, vermelho acima de 100% (sem azul — regra do projeto).
function getProgressColor(percentual: number) {
  if (percentual > 100) {
    return 'bg-error';
  }

  if (percentual >= 80) {
    return 'bg-warning';
  }

  return 'bg-primary';
}

function getProgressTextColor(percentual: number) {
  if (percentual > 100) {
    return 'text-error';
  }

  if (percentual >= 80) {
    return 'text-warning';
  }

  return 'text-primary';
}

type OrcamentoRowProps = {
  item: OrcamentoItem;
  saving: boolean;
  onSalvarMeta: (item: OrcamentoItem, valorMeta: number | null) => Promise<void>;
};

function OrcamentoRow({ item, saving, onSalvarMeta }: OrcamentoRowProps) {
  const [draftMeta, setDraftMeta] = useState<number | null>(item.valorMeta);

  useEffect(() => {
    setDraftMeta(item.valorMeta);
  }, [item.valorMeta]);

  const percentual = item.percentualConsumido ?? 0;
  const progresso = item.valorMeta ? Math.min(percentual, 100) : 0;
  const metaCalculada = !item.aceitaLancamentos;

  return (
    <div className="bg-surface-container border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-on-surface truncate">
            {item.contaGerencialCodigo ? `${item.contaGerencialCodigo} · ` : ''}
            {item.contaGerencialDescricao}
          </p>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Realizado: <span className="font-semibold text-on-surface">{formatCurrencyBRL(item.valorRealizado)}</span>
            {item.valorMeta !== null && (
              <>
                {' '}de <span className="font-semibold text-on-surface">{formatCurrencyBRL(item.valorMeta)}</span>
              </>
            )}
          </p>
          {metaCalculada && (
            <p className="text-xs text-on-surface-variant mt-1 italic">
              Conta estrutural: meta calculada automaticamente pela soma das contas filhas.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {item.estourado && (
            <span className="flex items-center gap-1 text-error text-xs font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
              Estourou
            </span>
          )}
          <CurrencyInput
            aria-label={`Meta de ${item.contaGerencialDescricao}`}
            value={draftMeta}
            onChange={setDraftMeta}
            disabled={saving || metaCalculada}
            placeholder={metaCalculada ? 'Calculada automaticamente' : 'R$ 0,00'}
            className={`${formCompactFieldClass} !min-h-0 !bg-surface-container-high h-11 w-36 min-w-[120px] flex-1 sm:flex-none text-sm`}
          />
          <button
            type="button"
            onClick={() => void onSalvarMeta(item, draftMeta)}
            disabled={saving || metaCalculada || draftMeta === item.valorMeta}
            className="bg-primary/15 text-primary border border-primary/30 rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all hover:bg-primary/25 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Salvar
          </button>
        </div>
      </div>

      {item.valorMeta !== null ? (
        <div className="flex items-center gap-3">
          <div
            className="flex-1 h-2 rounded-full bg-surface-container-low overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(percentual)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Consumo do orçamento de ${item.contaGerencialDescricao}`}
          >
            <div
              className={`h-full rounded-full transition-all ${getProgressColor(percentual)}`}
              style={{ width: `${progresso}%` }}
            />
          </div>
          <span className={`text-xs font-bold w-14 text-right ${getProgressTextColor(percentual)}`}>
            {percentual.toFixed(0)}%
          </span>
        </div>
      ) : (
        <p className="text-xs text-on-surface-variant italic">Sem meta definida para esta competência.</p>
      )}
    </div>
  );
}

function getLastNMonths(n: number, base: string): string[] {
  const [year, month] = base.split('-').map(Number);
  const result: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return result;
}

function MultiPeriodoView({ competencias }: { competencias: string[] }) {
  const queries = useQueries({
    queries: competencias.map((comp) => ({
      queryKey: ['orcamento', 'competencia', comp],
      queryFn: () => orcamentosApi.obterPorCompetencia(comp),
      staleTime: 30_000
    }))
  });

  const datasets = useMemo(
    () => queries.map((q) => q.data).filter((d): d is OrcamentoCompetencia => !!d),
    [queries]
  );

  const allCategories = useMemo(() => {
    const map = new Map<string, string>();
    datasets.forEach((d) =>
      d.itens.forEach((item) => {
        if (!map.has(item.contaGerencialId)) map.set(item.contaGerencialId, item.contaGerencialDescricao);
      })
    );
    return [...map.entries()].map(([id, desc]) => ({ id, desc }));
  }, [datasets]);

  const loading = queries.some((q) => q.isPending);

  if (loading) return <PageState state="loading" title="Carregando comparativo" />;
  if (allCategories.length === 0) return <PageState state="empty" title="Sem dados no período" subtitle="Ajuste o mês de referência." />;

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/5">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-surface-container">
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Categoria</th>
            {competencias.map((c) => (
              <th key={c} className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">
                {new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' }).format(
                  new Date(Number(c.split('-')[0]), Number(c.split('-')[1]) - 1, 1)
                )}
              </th>
            ))}
            <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Média</th>
            <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Máx</th>
          </tr>
        </thead>
        <tbody>
          {allCategories.map(({ id, desc }) => {
            const values = datasets.map((d) => d.itens.find((i) => i.contaGerencialId === id)?.valorRealizado ?? 0);
            const avg = values.reduce((s, v) => s + v, 0) / (values.length || 1);
            const max = Math.max(...values);
            return (
              <tr key={id} className="border-b border-white/5 hover:bg-primary/5">
                <td className="px-4 py-3 font-semibold text-on-surface max-w-[180px] truncate">{desc}</td>
                {competencias.map((c, idx) => {
                  const val = datasets[idx]?.itens.find((i) => i.contaGerencialId === id)?.valorRealizado ?? 0;
                  const meta = datasets[idx]?.itens.find((i) => i.contaGerencialId === id)?.valorMeta ?? null;
                  const pct = meta ? (val / meta) * 100 : null;
                  return (
                    <td key={c} className="px-4 py-3 text-right">
                      <span className={pct !== null && pct > 100 ? 'text-error font-bold' : 'text-on-surface'}>
                        {formatCurrencyBRL(val)}
                      </span>
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-right font-bold text-primary">{formatCurrencyBRL(avg)}</td>
                <td className="px-4 py-3 text-right font-bold text-on-surface-variant">{formatCurrencyBRL(max)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function OrcamentoPage() {
  const queryClient = useQueryClient();
  const [competencia, setCompetencia] = useState<string>(getCurrentCompetencia());
  const [savingContaId, setSavingContaId] = useState<string>();
  const [actionError, setActionError] = useState<string>();
  const [multiPeriodo, setMultiPeriodo] = useState(false);

  const { data: orcamento, isLoading, error } = useQuery({
    queryKey: ['orcamento', 'competencia', competencia],
    queryFn: () => orcamentosApi.obterPorCompetencia(competencia),
    staleTime: 30_000,
    placeholderData: (prev) => prev
  });

  const errorMessage = actionError ?? (error instanceof Error ? error.message : error ? 'Falha ao carregar orçamento.' : undefined);

  async function handleSalvarMeta(item: OrcamentoItem, valorMeta: number | null) {
    setSavingContaId(item.contaGerencialId);
    setActionError(undefined);

    try {
      if (valorMeta && valorMeta > 0) {
        await orcamentosApi.upsertMeta({
          contaGerencialId: item.contaGerencialId,
          competencia,
          valorMeta
        });
      } else if (item.metaId) {
        await orcamentosApi.removerMeta(item.metaId);
      }

      await queryClient.invalidateQueries({ queryKey: ['orcamento', 'competencia', competencia] });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Falha ao salvar meta.');
    } finally {
      setSavingContaId(undefined);
    }
  }

  if (isLoading && !orcamento) {
    return <PageState state="loading" title="Carregando orçamento" />;
  }

  const totalPercentual = orcamento?.percentualConsumido ?? 0;
  const saldoDisponivel = (orcamento?.totalMeta ?? 0) - (orcamento?.totalRealizado ?? 0);

  const multiCompetencias = getLastNMonths(6, competencia);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <p className="text-sm text-on-surface-variant">
          {multiPeriodo
            ? `Comparativo dos últimos 6 meses até ${formatCompetencia(competencia)}.`
            : `Metas por categoria de despesa em ${formatCompetencia(competencia)}.`}
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMultiPeriodo((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              multiPeriodo
                ? 'border-primary/30 bg-primary/15 text-primary'
                : 'border-white/10 bg-surface-container text-on-surface-variant hover:text-primary hover:border-primary/20'
            }`}
          >
            <span className="material-symbols-outlined text-sm">calendar_view_month</span>
            {multiPeriodo ? 'Comparativo 6m' : 'Ver comparativo'}
          </button>
          <DateInput
            compact
            mode="month"
            ariaLabel="Competência do orçamento"
            value={competencia}
            onChange={(value) => setCompetencia(value || getCurrentCompetencia())}
            className="max-w-[220px]"
          />
        </div>
      </div>

      {errorMessage && (
        <div className="bg-error-container/20 border border-error/20 p-4 rounded-2xl flex items-center gap-3 text-error animate-in fade-in slide-in-from-top-2">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      {orcamento && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="totalizador-card p-5">
            <p className="text-xs text-on-surface-variant uppercase tracking-widest font-medium">Total orçado</p>
            <p className="text-2xl font-headline font-extrabold text-on-surface mt-1">
              {formatCurrencyBRL(orcamento.totalMeta)}
            </p>
          </div>
          <div className="totalizador-card p-5">
            <p className="text-xs text-on-surface-variant uppercase tracking-widest font-medium">Total realizado</p>
            <p className={`text-2xl font-headline font-extrabold mt-1 ${getProgressTextColor(totalPercentual)}`}>
              {formatCurrencyBRL(orcamento.totalRealizado)}
            </p>
            {orcamento.percentualConsumido !== null && (
              <p className="text-xs text-on-surface-variant mt-1">
                {orcamento.percentualConsumido.toFixed(1)}% do orçamento consumido
              </p>
            )}
          </div>
          <div className="totalizador-card p-5">
            <p className="text-xs text-on-surface-variant uppercase tracking-widest font-medium">Saldo disponível</p>
            <p className={`text-2xl font-headline font-extrabold mt-1 ${saldoDisponivel < 0 ? 'text-error' : 'text-primary'}`}>
              {formatCurrencyBRL(saldoDisponivel)}
            </p>
          </div>
        </div>
      )}

      {orcamento && orcamento.itens.length === 0 && (
        <PageState
          state="empty"
          title="Nenhuma conta gerencial de despesa"
          subtitle="Cadastre contas gerenciais de despesa para definir metas de orçamento."
        />
      )}

      {multiPeriodo ? (
        <MultiPeriodoView competencias={multiCompetencias} />
      ) : (
        <div className="space-y-3">
          {[...(orcamento?.itens ?? [])].sort((a, b) => (a.contaGerencialCodigo ?? '').localeCompare(b.contaGerencialCodigo ?? '', 'pt-BR', { numeric: true })).map((item) => (
            <OrcamentoRow
              key={item.contaGerencialId}
              item={item}
              saving={savingContaId === item.contaGerencialId}
              onSalvarMeta={handleSalvarMeta}
            />
          ))}
        </div>
      )}
    </div>
  );
}

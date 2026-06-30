import { useCallback, useEffect, useState } from 'react';
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

  return (
    <div className="bg-surface-container-highest border border-outline-variant/10 rounded-2xl p-4 flex flex-col gap-3">
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
        </div>
        <div className="flex items-center gap-2">
          {item.estourado && (
            <span className="flex items-center gap-1 text-error text-xs font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">warning</span>
              Estourou
            </span>
          )}
          <CurrencyInput
            aria-label={`Meta de ${item.contaGerencialDescricao}`}
            value={draftMeta}
            onChange={setDraftMeta}
            disabled={saving}
            placeholder="Definir meta"
            style={{ width: 160 }}
          />
          <button
            type="button"
            onClick={() => void onSalvarMeta(item, draftMeta)}
            disabled={saving || draftMeta === item.valorMeta}
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

export function OrcamentoPage() {
  const [competencia, setCompetencia] = useState<string>(getCurrentCompetencia());
  const [orcamento, setOrcamento] = useState<OrcamentoCompetencia>();
  const [loading, setLoading] = useState(false);
  const [savingContaId, setSavingContaId] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();

  const loadOrcamento = useCallback(async () => {
    setLoading(true);
    setErrorMessage(undefined);

    try {
      setOrcamento(await orcamentosApi.obterPorCompetencia(competencia));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar orçamento.');
    } finally {
      setLoading(false);
    }
  }, [competencia]);

  useEffect(() => {
    void loadOrcamento();
  }, [loadOrcamento]);

  async function handleSalvarMeta(item: OrcamentoItem, valorMeta: number | null) {
    setSavingContaId(item.contaGerencialId);
    setErrorMessage(undefined);

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

      await loadOrcamento();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao salvar meta.');
    } finally {
      setSavingContaId(undefined);
    }
  }

  if (loading && !orcamento) {
    return <PageState state="loading" title="Carregando orçamento" />;
  }

  const totalPercentual = orcamento?.percentualConsumido ?? 0;
  const saldoDisponivel = (orcamento?.totalMeta ?? 0) - (orcamento?.totalRealizado ?? 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-extrabold tracking-tight text-on-surface">
            Orçamento mensal
          </h1>
          <p className="text-on-surface-variant font-body mt-1">
            Metas por categoria de despesa em {formatCompetencia(competencia)}.
          </p>
        </div>
        <DateInput
          compact
          mode="month"
          ariaLabel="Competência do orçamento"
          value={competencia}
          onChange={(value) => setCompetencia(value || getCurrentCompetencia())}
          className="max-w-[220px]"
        />
      </div>

      {errorMessage && (
        <div className="bg-error-container/20 border border-error/20 p-4 rounded-2xl flex items-center gap-3 text-error animate-in fade-in slide-in-from-top-2">
          <span className="material-symbols-outlined">warning</span>
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      {orcamento && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-container-highest border border-outline-variant/10 rounded-2xl p-5">
            <p className="text-xs text-on-surface-variant uppercase tracking-widest font-medium">Total orçado</p>
            <p className="text-2xl font-headline font-extrabold text-on-surface mt-1">
              {formatCurrencyBRL(orcamento.totalMeta)}
            </p>
          </div>
          <div className="bg-surface-container-highest border border-outline-variant/10 rounded-2xl p-5">
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
          <div className="bg-surface-container-highest border border-outline-variant/10 rounded-2xl p-5">
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

      <div className="space-y-3">
        {orcamento?.itens.map((item) => (
          <OrcamentoRow
            key={item.contaGerencialId}
            item={item}
            saving={savingContaId === item.contaGerencialId}
            onSalvarMeta={handleSalvarMeta}
          />
        ))}
      </div>
    </div>
  );
}

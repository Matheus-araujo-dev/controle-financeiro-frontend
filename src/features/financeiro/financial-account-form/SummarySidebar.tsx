import { useState } from 'react';
import { FormActionPanel } from '../../../components/forms/FormPrimitives';
import { Button } from '../../../components/ui/Button';
import { formatCurrencyBRL } from '../../../shared/currency';
import type { FinancialAccountFormApi } from './useFinancialAccountForm';

type SummarySidebarProps = {
  form: FinancialAccountFormApi;
};

type ConfirmState = {
  title: string;
  message: string;
  confirmLabel: string;
  tone: 'danger' | 'warning';
  onConfirm: () => void;
} | null;

function ConfirmDialog({ state, onClose }: { state: ConfirmState; onClose: () => void }) {
  if (!state) return null;

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-surface-container-low p-7 shadow-2xl">
        <div className="mb-6 flex items-start gap-3">
          <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${state.tone === 'danger' ? 'bg-error/12 text-error' : 'bg-warning/12 text-warning'}`}>
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          </div>
          <div>
            <h3 className="font-headline text-lg font-bold text-on-surface">{state.title}</h3>
            <p className="mt-1 text-sm text-on-surface-variant">{state.message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Voltar
          </Button>
          <Button
            type="button"
            variant={state.tone === 'danger' ? 'danger' : 'secondary'}
            onClick={() => {
              state.onConfirm();
              onClose();
            }}
          >
            {state.confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function RecorrenciaCancelDialog({
  open,
  onClose,
  onCancelarApenas,
  onCancelarEPausar
}: {
  open: boolean;
  onClose: () => void;
  onCancelarApenas: () => void;
  onCancelarEPausar: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-surface-container-low p-7 shadow-2xl">
        <div className="mb-6 flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-error/12 text-error">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>repeat</span>
          </div>
          <div>
            <h3 className="font-headline text-lg font-bold text-on-surface">Cancelar lancamento recorrente</h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              Este lancamento esta vinculado a uma recorrencia ativa. Deseja pausar a recorrencia para que novas contas nao sejam geradas?
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Voltar
          </Button>
          <Button type="button" variant="secondary" onClick={onCancelarApenas}>
            Nao, manter recorrencia
          </Button>
          <Button type="button" variant="danger" onClick={onCancelarEPausar}>
            Sim, pausar recorrencia
          </Button>
        </div>
      </div>
    </div>
  );
}

function ParcelasCancelDialog({
  open,
  onClose,
  onCancelarApenas,
  onCancelarFuturas
}: {
  open: boolean;
  onClose: () => void;
  onCancelarApenas: () => void;
  onCancelarFuturas: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-surface-container-low p-7 shadow-2xl">
        <div className="mb-6 flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-error/12 text-error">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
          </div>
          <div>
            <h3 className="font-headline text-lg font-bold text-on-surface">Cancelar parcela</h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              Este titulo faz parte de um parcelamento. Deseja cancelar tambem as parcelas futuras pendentes?
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Voltar
          </Button>
          <Button type="button" variant="secondary" onClick={onCancelarApenas}>
            Nao, apenas esta
          </Button>
          <Button type="button" variant="danger" onClick={onCancelarFuturas}>
            Sim, cancelar futuras
          </Button>
        </div>
      </div>
    </div>
  );
}


function RecorrenciaEscopoDialog({
  open,
  onClose,
  onApenas,
  onAlterarFuturas
}: {
  open: boolean;
  onClose: () => void;
  onApenas: () => void;
  onAlterarFuturas: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-surface-container-low p-7 shadow-2xl">
        <div className="mb-6 flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>repeat</span>
          </div>
          <div>
            <h3 className="font-headline text-lg font-bold text-on-surface">Atualizar lançamento recorrente</h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              Este lançamento pertence a uma recorrência ativa. Deseja atualizar apenas esta ocorrência ou esta e todas as futuras?
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Voltar
          </Button>
          <Button type="button" variant="secondary" onClick={onApenas}>
            Apenas esta
          </Button>
          <Button type="button" variant="primary" onClick={onAlterarFuturas}>
            Esta e as futuras
          </Button>
        </div>
      </div>
    </div>
  );
}

function PlannedPurchaseCancelDialog({
  open,
  onClose,
  onKeepPlanning,
  onCancelPlanning
}: {
  open: boolean;
  onClose: () => void;
  onKeepPlanning: () => void;
  onCancelPlanning: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-surface-container-low p-7 shadow-2xl">
        <div className="mb-6 flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-warning/12 text-warning">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>sync_problem</span>
          </div>
          <div>
            <h3 className="font-headline text-lg font-bold text-on-surface">Cancelar titulo originado de compra planejada</h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              Esta conta nasceu de uma compra planejada. Ao cancelar o titulo, voce pode cancelar tambem o planejamento ou devolver a compra ao status planejada.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Voltar
          </Button>
          <Button type="button" variant="secondary" onClick={onKeepPlanning}>
            Nao, manter planejamento
          </Button>
          <Button type="button" variant="danger" onClick={onCancelPlanning}>
            Sim, cancelar planejamento
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SummarySidebar({ form }: SummarySidebarProps) {
  const {
    id,
    isSubmitting,
    isValid,
    valorLiquido,
    watchedValues,
    detailStatus,
    errorMessage,
    onCancel,
    cancelar,
    estornar,
    origemCompraPlanejadaId,
    exibeRecorrencia,
    grupoParcelamentoId,
    numeroParcela,
    totalRateios,
    pendingValues,
    onConfirmApenas,
    onConfirmAlterarFuturas,
    clearPendingScope
  } = form;
  const showSubmitError = Boolean(errorMessage) && !isSubmitting;

  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [plannedPurchaseConfirmOpen, setPlannedPurchaseConfirmOpen] = useState(false);
  const [recorrenciaConfirmOpen, setRecorrenciaConfirmOpen] = useState(false);
  const [parcelasConfirmOpen, setParcelasConfirmOpen] = useState(false);
  const [scopeSubmitting, setScopeSubmitting] = useState(false);

  const valorOriginal = Number(watchedValues.valorOriginal) || 0;
  const valorDesconto = Number(watchedValues.valorDesconto) || 0;
  const valorJurosMulta = (Number(watchedValues.valorJuros) || 0) + (Number(watchedValues.valorMulta) || 0);
  const hasPlannedPurchaseOrigin = Boolean(origemCompraPlanejadaId);
  const hasRecorrenciaOrigin = Boolean(id) && Boolean(exibeRecorrencia);
  // Não-origem de parcelamento: tem grupo mas não é a parcela 1
  const isNonOriginParcela = Boolean(grupoParcelamentoId) && numeroParcela !== undefined && numeroParcela > 1;

  return (
    <div className="space-y-8 lg:col-span-5">
      <div className="fixed left-4 right-4 z-40 lg:hidden" style={{ bottom: '72px' }}>
        {showSubmitError ? (
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-error/20 bg-error/10 px-3 py-2.5 text-error backdrop-blur-xl">
            <span className="material-symbols-outlined text-sm shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            <p className="text-xs font-bold">{errorMessage}</p>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-surface-container-low/95 px-4 py-3 shadow-[0_-4px_32px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Valor Liquido</p>
            <p className="truncate text-xl font-black" style={{ color: 'var(--color-primary)' }}>
              {formatCurrencyBRL(valorLiquido)}
            </p>
          </div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="shrink-0 rounded-xl"
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            {id && id !== 'novo' ? 'Atualizar' : 'Confirmar'}
          </Button>
        </div>
      </div>

      <FormActionPanel
        title="Pronto para salvar?"
        eyebrow="Resumo Financeiro"
        submitLabel={id && id !== 'novo' ? 'Atualizar Lançamento' : 'Confirmar Lançamento'}
        submitDisabled={isSubmitting}
        submitting={isSubmitting}
        error={errorMessage}
        onCancel={onCancel}
        cancelLabel="Descartar Alterações"
        items={[
          { label: 'Valor Liquido', value: formatCurrencyBRL(valorLiquido), accent: true },
          { label: 'Valor Original', value: formatCurrencyBRL(valorOriginal) },
          { label: 'Desconto', value: formatCurrencyBRL(valorDesconto) },
          { label: 'Juros / Multa', value: formatCurrencyBRL(valorJurosMulta) },
          { label: 'Total Rateado', value: formatCurrencyBRL(totalRateios), accent: Math.abs(totalRateios - valorLiquido) < 0.01 },
          { label: 'Parcelas', value: watchedValues.quantidadeParcelas || 1 }
        ]}
      >
        <div className="space-y-3">
          {id && (detailStatus === 'PENDENTE' || detailStatus === 'FUTURO' || detailStatus === 'EM_FATURA') ? (
            <Button
              type="button"
              variant="danger"
              size="lg"
              className="w-full rounded-2xl font-bold"
              onClick={() => {
                if (hasPlannedPurchaseOrigin) {
                  setPlannedPurchaseConfirmOpen(true);
                  return;
                }
                if (hasRecorrenciaOrigin) {
                  setRecorrenciaConfirmOpen(true);
                  return;
                }
                if (isNonOriginParcela) {
                  setParcelasConfirmOpen(true);
                  return;
                }
                setConfirm({
                  title: 'Confirmar Cancelamento',
                  message: 'Tem certeza que deseja cancelar este lançamento? Esta ação não pode ser desfeita.',
                  confirmLabel: 'Sim, cancelar',
                  tone: 'danger',
                  onConfirm: () => void cancelar()
                });
              }}
            >
              Cancelar Título
            </Button>
          ) : null}

          {id && detailStatus === 'LIQUIDADA' ? (
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="w-full rounded-2xl border-warning/30! text-warning! font-bold"
              onClick={() =>
                setConfirm({
                  title: 'Estornar Liquidacao',
                  message: 'Deseja reverter o pagamento deste titulo?',
                  confirmLabel: 'Sim, estornar',
                  tone: 'warning',
                  onConfirm: () => void estornar()
                })
              }
            >
              Estornar Pagamento
            </Button>
          ) : null}
        </div>
      </FormActionPanel>

      <ConfirmDialog state={confirm} onClose={() => setConfirm(null)} />
      <RecorrenciaCancelDialog
        open={recorrenciaConfirmOpen}
        onClose={() => setRecorrenciaConfirmOpen(false)}
        onCancelarApenas={() => {
          void cancelar({ pausarRecorrenciaRelacionada: false });
          setRecorrenciaConfirmOpen(false);
        }}
        onCancelarEPausar={() => {
          void cancelar({ pausarRecorrenciaRelacionada: true });
          setRecorrenciaConfirmOpen(false);
        }}
      />
      <PlannedPurchaseCancelDialog
        open={plannedPurchaseConfirmOpen}
        onClose={() => setPlannedPurchaseConfirmOpen(false)}
        onKeepPlanning={() => {
          void cancelar({ cancelarPlanejamentoRelacionado: false });
          setPlannedPurchaseConfirmOpen(false);
        }}
        onCancelPlanning={() => {
          void cancelar({ cancelarPlanejamentoRelacionado: true });
          setPlannedPurchaseConfirmOpen(false);
        }}
      />
      <ParcelasCancelDialog
        open={parcelasConfirmOpen}
        onClose={() => setParcelasConfirmOpen(false)}
        onCancelarApenas={() => {
          void cancelar({ cancelarParcelasFuturas: false });
          setParcelasConfirmOpen(false);
        }}
        onCancelarFuturas={() => {
          void cancelar({ cancelarParcelasFuturas: true });
          setParcelasConfirmOpen(false);
        }}
      />
      <RecorrenciaEscopoDialog
        open={pendingValues !== null && !scopeSubmitting}
        onClose={clearPendingScope}
        onApenas={() => {
          setScopeSubmitting(true);
          void onConfirmApenas().finally(() => setScopeSubmitting(false));
        }}
        onAlterarFuturas={() => {
          setScopeSubmitting(true);
          void onConfirmAlterarFuturas().finally(() => setScopeSubmitting(false));
        }}
      />
    </div>
  );
}

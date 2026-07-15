import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormActionPanel } from '../../../components/forms/FormPrimitives';
import { Button } from '../../../components/ui/Button';
import { formatCurrencyBRL } from '../../../shared/currency';
import { formatDateBR } from '../../../shared/date';
import type { FinancialAccountFormApi } from './useFinancialAccountForm';
import type { CancelarContaPagarPayload } from '../../../types/financeiro';

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

function ContaVinculadaCancelDialog({
  open,
  onClose,
  onCancelarSoEsta,
  onCancelarAmbas
}: {
  open: boolean;
  onClose: () => void;
  onCancelarSoEsta: () => void;
  onCancelarAmbas: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-surface-container-low p-7 shadow-2xl">
        <div className="mb-6 flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-error/12 text-error">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>link_off</span>
          </div>
          <div>
            <h3 className="font-headline text-lg font-bold text-on-surface">Conta vinculada (reembolso)</h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              Este lançamento possui uma conta vinculada. Deseja cancelar também a conta vinculada?
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>Voltar</Button>
          <Button type="button" variant="secondary" onClick={onCancelarSoEsta}>Não, só esta</Button>
          <Button type="button" variant="danger" onClick={onCancelarAmbas}>Sim, cancelar ambas</Button>
        </div>
      </div>
    </div>
  );
}

function ContaVinculadaPropagateDialog({
  open,
  diff,
  loading,
  onClose,
  onPropagar,
  onDismiss
}: {
  open: boolean;
  diff: Array<{ key: string; label: string; from: string; to: string }>;
  loading: boolean;
  onClose: () => void;
  onPropagar: () => void;
  onDismiss: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-surface-container-low p-7 shadow-2xl">
        <div className="mb-6 flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>sync_alt</span>
          </div>
          <div>
            <h3 className="font-headline text-lg font-bold text-on-surface">Propagar alterações à conta vinculada?</h3>
            <p className="mt-1 text-sm text-on-surface-variant">Os seguintes campos foram alterados. Deseja aplicar as mesmas alterações na conta vinculada (reembolso)?</p>
          </div>
        </div>
        <div className="mb-6 space-y-2">
          {diff.map((item) => (
            <div key={item.key} className="rounded-xl border border-white/8 bg-surface-container px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{item.label}</p>
              <div className="mt-1 flex items-center gap-2 text-sm">
                <span className="text-on-surface-variant line-through">{item.from}</span>
                <span className="material-symbols-outlined text-sm text-primary">arrow_forward</span>
                <span className="font-semibold text-on-surface">{item.to}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Voltar</Button>
          <Button type="button" variant="secondary" onClick={onDismiss} disabled={loading}>Não propagar</Button>
          <Button type="button" variant="primary" onClick={onPropagar} loading={loading} disabled={loading}>Sim, propagar</Button>
        </div>
      </div>
    </div>
  );
}

export function SummarySidebar({ form }: SummarySidebarProps) {
  const navigate = useNavigate();
  const {
    id,
    isSubmitting,
    actionLoading,
    isValid,
    valorLiquido,
    watchedValues,
    detailStatus,
    detailFaturaStatus,
    faturaLocked,
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
    clearPendingScope,
    contaVinculada,
    pendingPropagation,
    propagarParaVinculada,
    dismissPropagation
  } = form;
  const showSubmitError = Boolean(errorMessage) && !isSubmitting;

  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [plannedPurchaseConfirmOpen, setPlannedPurchaseConfirmOpen] = useState(false);
  const [recorrenciaConfirmOpen, setRecorrenciaConfirmOpen] = useState(false);
  const [parcelasConfirmOpen, setParcelasConfirmOpen] = useState(false);
  const [scopeSubmitting, setScopeSubmitting] = useState(false);
  const [pendingCancelOptions, setPendingCancelOptions] = useState<CancelarContaPagarPayload | null>(null);
  const [contaVinculadaCancelOpen, setContaVinculadaCancelOpen] = useState(false);

  function iniciarCancelamento(options?: CancelarContaPagarPayload) {
    if (contaVinculada) {
      setPendingCancelOptions(options ?? null);
      setContaVinculadaCancelOpen(true);
    } else {
      void cancelar(options);
    }
  }

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
          {contaVinculada ? (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>link</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Conta Vinculada</span>
              </div>
              <p className="text-sm font-bold text-on-surface leading-snug">{contaVinculada.descricao}</p>
              <p className="text-xs text-on-surface-variant">
                {contaVinculada.tipo === 'Pagar' ? 'A pagar' : 'A receber'} · {formatCurrencyBRL(contaVinculada.valorLiquido)} · venc. {formatDateBR(contaVinculada.dataVencimento)}
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full rounded-xl text-xs"
                onClick={() => navigate(`${contaVinculada.tipo === 'Pagar' ? '/contas-pagar' : '/contas-receber'}/${contaVinculada.id}`)}
              >
                Ver conta vinculada
              </Button>
            </div>
          ) : null}

          {faturaLocked ? (
            <div className="flex items-start gap-2 rounded-xl border border-warning/20 bg-warning/8 px-3 py-2.5 text-warning">
              <span className="material-symbols-outlined text-sm shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
              <p className="text-xs font-bold leading-snug">
                Fatura {detailFaturaStatus === 'PAGA' ? 'liquidada' : 'fechada'}. Edição e estorno bloqueados.
              </p>
            </div>
          ) : null}

          {id && !faturaLocked && (detailStatus === 'PENDENTE' || detailStatus === 'FUTURO' || detailStatus === 'EM_FATURA') ? (
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
                  onConfirm: () => iniciarCancelamento()
                });
              }}
            >
              Cancelar Título
            </Button>
          ) : null}

          {id && detailStatus === 'LIQUIDADA' && !faturaLocked ? (
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
          setRecorrenciaConfirmOpen(false);
          iniciarCancelamento({ pausarRecorrenciaRelacionada: false });
        }}
        onCancelarEPausar={() => {
          setRecorrenciaConfirmOpen(false);
          iniciarCancelamento({ pausarRecorrenciaRelacionada: true });
        }}
      />
      <PlannedPurchaseCancelDialog
        open={plannedPurchaseConfirmOpen}
        onClose={() => setPlannedPurchaseConfirmOpen(false)}
        onKeepPlanning={() => {
          setPlannedPurchaseConfirmOpen(false);
          iniciarCancelamento({ cancelarPlanejamentoRelacionado: false });
        }}
        onCancelPlanning={() => {
          setPlannedPurchaseConfirmOpen(false);
          iniciarCancelamento({ cancelarPlanejamentoRelacionado: true });
        }}
      />
      <ParcelasCancelDialog
        open={parcelasConfirmOpen}
        onClose={() => setParcelasConfirmOpen(false)}
        onCancelarApenas={() => {
          setParcelasConfirmOpen(false);
          iniciarCancelamento({ cancelarParcelasFuturas: false });
        }}
        onCancelarFuturas={() => {
          setParcelasConfirmOpen(false);
          iniciarCancelamento({ cancelarParcelasFuturas: true });
        }}
      />
      <ContaVinculadaCancelDialog
        open={contaVinculadaCancelOpen}
        onClose={() => setContaVinculadaCancelOpen(false)}
        onCancelarSoEsta={() => {
          setContaVinculadaCancelOpen(false);
          void cancelar(pendingCancelOptions ?? undefined);
        }}
        onCancelarAmbas={() => {
          setContaVinculadaCancelOpen(false);
          void cancelar({ ...(pendingCancelOptions ?? {}), cancelarContaVinculada: true });
        }}
      />
      <ContaVinculadaPropagateDialog
        open={pendingPropagation !== null}
        diff={pendingPropagation?.diff ?? []}
        loading={actionLoading}
        onClose={() => { /* mantém aberto, só fecha com dismiss ou propagar */ }}
        onPropagar={() => void propagarParaVinculada()}
        onDismiss={dismissPropagation}
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

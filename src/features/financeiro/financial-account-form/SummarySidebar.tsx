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
            <span className="material-symbols-outlined text-2xl">warning</span>
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
    estornar
  } = form;

  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const valorOriginal = Number(watchedValues.valorOriginal) || 0;
  const valorDesconto = Number(watchedValues.valorDesconto) || 0;
  const valorJurosMulta = (Number(watchedValues.valorJuros) || 0) + (Number(watchedValues.valorMulta) || 0);

  return (
    <div className="space-y-8 lg:col-span-5">
      {/* Mobile: barra flutuante acima da nav inferior */}
      <div className="fixed left-4 right-4 z-40 lg:hidden" style={{ bottom: '72px' }}>
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-surface-container-low/95 px-4 py-3 shadow-[0_-4px_32px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Valor Líquido</p>
            <p className="truncate text-xl font-black" style={{ color: 'var(--color-primary)' }}>
              {formatCurrencyBRL(valorLiquido)}
            </p>
          </div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="shrink-0 rounded-xl"
            disabled={isSubmitting || !isValid}
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
        submitDisabled={isSubmitting || !isValid}
        submitting={isSubmitting}
        error={errorMessage}
        onCancel={onCancel}
        cancelLabel="Descartar Alterações"
        items={[
          { label: 'Valor Líquido', value: formatCurrencyBRL(valorLiquido), accent: true },
          { label: 'Valor Original', value: formatCurrencyBRL(valorOriginal) },
          { label: 'Desconto', value: formatCurrencyBRL(valorDesconto) },
          { label: 'Juros / Multa', value: formatCurrencyBRL(valorJurosMulta) },
          { label: 'Parcelas', value: watchedValues.quantidadeParcelas || 1 }
        ]}
      >
        <div className="space-y-3">
          {id && (detailStatus === 'PENDENTE' || detailStatus === 'EM_FATURA') ? (
            <Button
              type="button"
              variant="danger"
              size="lg"
              className="w-full rounded-2xl font-bold"
              onClick={() =>
                setConfirm({
                  title: 'Confirmar Cancelamento',
                  message: 'Tem certeza que deseja cancelar este lançamento? Esta ação não pode ser desfeita.',
                  confirmLabel: 'Sim, cancelar',
                  tone: 'danger',
                  onConfirm: () => void cancelar()
                })
              }
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
                  title: 'Estornar Liquidação',
                  message: 'Deseja reverter o pagamento deste título?',
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
    </div>
  );
}

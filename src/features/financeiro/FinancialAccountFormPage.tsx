import { Controller } from 'react-hook-form';

import { PageState } from '../../components/states/PageState';
import { FormSection } from '../../components/layout';
import { CurrencyInput } from '../../shared/CurrencyInput';
import type { FinanceiroModuleConfig } from './module-config';
import { GeneralInfoSection } from './financial-account-form/GeneralInfoSection';
import { TermsValueSection } from './financial-account-form/TermsValueSection';
import { PaymentSection } from './financial-account-form/PaymentSection';
import { RecurrenceSection } from './financial-account-form/RecurrenceSection';
import { RateioSection } from './financial-account-form/RateioSection';
import { SummarySidebar } from './financial-account-form/SummarySidebar';
import { fieldLabelClass, nativeCompactFieldClass, nativeFieldWithPaddingClass, nativeTextareaClass } from './financial-account-form/field-classes';
import { useFinancialAccountForm } from './financial-account-form/useFinancialAccountForm';
import { DuplicateAlertModal } from './financial-account-form/DuplicateAlertModal';
import { FaturaIndisponivelModal } from './financial-account-form/FaturaIndisponivelModal';
import { QuickLaunchModal } from '../../components/quick-launch/QuickLaunchButton';

export function FinancialAccountFormPage({
  config
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: FinanceiroModuleConfig<any, any, any>;
}) {
  const form = useFinancialAccountForm(config);
  const {
    id, control, canEdit, loading, errorMessage, isSubmitting, handleSubmit, onSubmit,
    pendingDuplicateValues, duplicateItems, createDespiteDuplicate, cancelDuplicateCheck,
    faturaIndisponivelMessage, confirmarProximaFatura, cancelarFaturaIndisponivel,
    gerarReembolso, setGerarReembolso, reembolsoData, clearReembolso
  } = form;
  const isReceita = config.key === 'contas-receber';

  if (loading) return <PageState state="loading" title="Carregando lançamento..." />;
  // Only show full-page error for load failures on existing records (never for submit errors)
  if (errorMessage && id && !isSubmitting) return <PageState state="error" title="Falha ao carregar lançamento" subtitle={errorMessage} />;

  return (
    <div className="space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-28 lg:pb-0">
      <div className="flex justify-end">
        <span
          className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-xs font-bold ${
            isReceita ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'
          }`}
        >
          {isReceita ? 'Entrada' : 'Saída'}
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
          <div className="lg:col-span-7 space-y-8">
            <GeneralInfoSection form={form} personLabel={config.personLabel} personRole={config.personRole} />
            <PaymentSection form={form} />
            <TermsValueSection form={form} moduloLabel={isReceita ? 'receber' : 'pagar'} />
            <RecurrenceSection form={form} />

            <FormSection title="Rateio por Centro de Custo" eyebrow="Passo 4" icon={<span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>pie_chart</span>}>
              <RateioSection form={form} />
            </FormSection>

            <FormSection title="Detalhes e Observações" eyebrow="Passo 5" icon={<span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2.5">
                  <label className={fieldLabelClass}>Nº Documento</label>
                  <Controller
                    control={control}
                    name="numeroDocumento"
                    render={({ field: { value, ...rest } }) => (
                      <input {...rest} value={value ?? ''} disabled={!canEdit} className={nativeFieldWithPaddingClass} placeholder="000.000" />
                    )}
                  />
                </div>
                <div className="space-y-2.5">
                  <label className={fieldLabelClass}>Desconto</label>
                  <Controller
                    control={control}
                    name="valorDesconto"
                    render={({ field }) => (
                      <CurrencyInput value={field.value} onChange={(val) => field.onChange(val ?? 0)} disabled={!canEdit} className={nativeCompactFieldClass} />
                    )}
                  />
                </div>
                <div className="space-y-2.5">
                  <label className={fieldLabelClass}>Juros</label>
                  <Controller
                    control={control}
                    name="valorJuros"
                    render={({ field }) => (
                      <CurrencyInput value={field.value} onChange={(val) => field.onChange(val ?? 0)} disabled={!canEdit} className={nativeCompactFieldClass} />
                    )}
                  />
                </div>
                <div className="space-y-2.5">
                  <label className={fieldLabelClass}>Multa</label>
                  <Controller
                    control={control}
                    name="valorMulta"
                    render={({ field }) => (
                      <CurrencyInput value={field.value} onChange={(val) => field.onChange(val ?? 0)} disabled={!canEdit} className={nativeCompactFieldClass} />
                    )}
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <label className={fieldLabelClass}>Observações</label>
                <Controller
                  control={control}
                  name="observacao"
                  render={({ field: { value, ...rest } }) => (
                    <textarea
                      {...rest}
                      value={value ?? ''}
                      rows={4}
                      disabled={!canEdit}
                      placeholder="Notas sobre o lançamento, notas fiscais, motivo do parcelamento..."
                      className={nativeTextareaClass}
                    />
                  )}
                />
              </div>
            </FormSection>

            {!id ? (
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-surface-container px-5 py-4">
                <div>
                  <p className="text-sm font-bold text-on-surface">
                    {isReceita ? 'Gerar conta a pagar (reembolso)' : 'Gerar conta a receber (reembolso)'}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Após salvar, abre o lançamento rápido pré-preenchido com os dados invertidos.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={gerarReembolso}
                  aria-label={isReceita ? 'Gerar conta a pagar como reembolso' : 'Gerar conta a receber como reembolso'}
                  onClick={() => setGerarReembolso((prev) => !prev)}
                  className={[
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors',
                    gerarReembolso ? 'bg-primary border-transparent' : 'bg-white/10 border-white/25'
                  ].join(' ')}
                >
                  <span
                    className={[
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                      gerarReembolso ? 'translate-x-5' : 'translate-x-0'
                    ].join(' ')}
                  />
                </button>
              </div>
            ) : null}
          </div>

          <SummarySidebar form={form} />
        </div>
      </form>

      {reembolsoData ? (
        <QuickLaunchModal
          initialValues={reembolsoData}
          isReembolso
          onClose={clearReembolso}
        />
      ) : null}

      <DuplicateAlertModal
        open={!!pendingDuplicateValues}
        loading={isSubmitting}
        duplicates={duplicateItems ?? []}
        onConfirm={createDespiteDuplicate}
        onCancel={cancelDuplicateCheck}
      />

      <FaturaIndisponivelModal
        open={!!faturaIndisponivelMessage}
        loading={isSubmitting}
        message={faturaIndisponivelMessage}
        onConfirm={confirmarProximaFatura}
        onCancel={cancelarFaturaIndisponivel}
      />
    </div>
  );
}

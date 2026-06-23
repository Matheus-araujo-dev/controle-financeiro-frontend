import { useCallback, useMemo, useState } from 'react';
import { Controller } from 'react-hook-form';

import { PageState } from '../../components/states/PageState';
import { FormSection } from '../../components/layout';
import type { FinanceiroModuleConfig } from './module-config';
import { GeneralInfoSection } from './financial-account-form/GeneralInfoSection';
import { TermsValueSection } from './financial-account-form/TermsValueSection';
import { PaymentSection } from './financial-account-form/PaymentSection';
import { RecurrenceSection } from './financial-account-form/RecurrenceSection';
import { RateioSection } from './financial-account-form/RateioSection';
import { SummarySidebar } from './financial-account-form/SummarySidebar';
import { nativeTextareaClass } from './financial-account-form/field-classes';
import { useFinancialAccountForm } from './financial-account-form/useFinancialAccountForm';
import { AttachmentsSection } from '../../components/attachments/AttachmentsSection';
import { uploadPendingAttachments } from '../../services/http/anexos-api';
import type { TipoEntidadeAnexo } from '../../types/anexos';

export function FinancialAccountFormPage({
  config
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: FinanceiroModuleConfig<any, any, any>;
}) {
  const [pendingAttachmentFiles, setPendingAttachmentFiles] = useState<File[]>([]);
  const tipoEntidade = config.key as TipoEntidadeAnexo;
  const afterSave = useCallback(async (entityId: string) => {
    if (pendingAttachmentFiles.length === 0) return;
    await uploadPendingAttachments(tipoEntidade, entityId, pendingAttachmentFiles);
    setPendingAttachmentFiles([]);
  }, [pendingAttachmentFiles, tipoEntidade]);
  const formOptions = useMemo(() => ({ afterSave }), [afterSave]);
  const form = useFinancialAccountForm(config, formOptions);
  const { id, control, canEdit, loading, errorMessage, handleSubmit, onSubmit } = form;
  const isReceita = config.key === 'contas-receber';

  if (loading) return <PageState state="loading" title="Carregando lançamento..." />;
  if (errorMessage && !id) return <PageState state="error" title="Falha ao carregar lançamento" subtitle={errorMessage} />;

  return (
    <div className="max-w-7xl mx-auto space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
            <GeneralInfoSection form={form} personLabel={config.personLabel} />
            <TermsValueSection form={form} />
            <PaymentSection form={form} />
            <RecurrenceSection form={form} />

            <FormSection title="Rateio por Centro de Custo" eyebrow="Passo 4" icon={<span className="material-symbols-outlined text-2xl">pie_chart</span>}>
              <RateioSection form={form} />
            </FormSection>

            <FormSection title="Observações Adicionais" eyebrow="Passo 5" icon={<span className="material-symbols-outlined text-2xl">notes</span>}>
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
            </FormSection>

            <FormSection title="Anexos" eyebrow="Comprovantes" icon={<span className="material-symbols-outlined text-2xl">attach_file</span>}>
              <AttachmentsSection
                tipoEntidade={tipoEntidade}
                entidadeId={id}
                disabled={!canEdit}
                pendingFiles={pendingAttachmentFiles}
                onPendingFilesChange={setPendingAttachmentFiles}
              />
            </FormSection>
          </div>

          <SummarySidebar form={form} />
        </div>
      </form>
    </div>
  );
}

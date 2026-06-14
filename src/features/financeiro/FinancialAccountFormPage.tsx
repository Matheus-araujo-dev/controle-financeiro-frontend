import { Controller } from 'react-hook-form';
import { FileTextOutlined, PieChartOutlined } from '@ant-design/icons';

import { PageState } from '../../components/states/PageState';
import type { FinanceiroModuleConfig } from './module-config';
import { GeneralInfoSection } from './financial-account-form/GeneralInfoSection';
import { TermsValueSection } from './financial-account-form/TermsValueSection';
import { RecurrenceSection } from './financial-account-form/RecurrenceSection';
import { RateioSection } from './financial-account-form/RateioSection';
import { SummarySidebar } from './financial-account-form/SummarySidebar';
import { AccordionSection } from './financial-account-form/AccordionSection';
import { nativeTextareaClass } from './financial-account-form/field-classes';
import { useFinancialAccountForm } from './financial-account-form/useFinancialAccountForm';

export function FinancialAccountFormPage({
  config
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: FinanceiroModuleConfig<any, any, any>;
}) {
  const form = useFinancialAccountForm(config);
  const { id, control, canEdit, loading, errorMessage, handleSubmit, onSubmit } = form;

  const isEditing = Boolean(id) && id !== 'novo';
  const isReceita = config.key === 'contas-receber';

  if (loading) return <PageState state="loading" title="Carregando lançamento..." />;
  if (errorMessage && !id) return <PageState state="error" title="Falha ao carregar lançamento" subtitle={errorMessage} />;

  return (
    <div className="max-w-7xl mx-auto space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-on-surface-variant font-label text-xs uppercase tracking-[0.2em] mb-2">Operações Financeiras</h2>
          <h1 className="text-4xl font-headline font-extrabold tracking-tight text-on-surface">
            {isEditing ? 'Editar' : 'Criar'}: <span className="text-primary">{config.singularTitle}</span>
          </h1>
        </div>
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
          {/* Main Information Column */}
          <div className="lg:col-span-8 space-y-6">
            <GeneralInfoSection form={form} personLabel={config.personLabel} />
            <TermsValueSection form={form} />
            <RecurrenceSection form={form} />

            <AccordionSection
              icon={<PieChartOutlined />}
              title="Rateio por Centro de Custo"
              subtitle="Dividir o lançamento entre várias contas gerenciais"
            >
              <RateioSection form={form} />
            </AccordionSection>

            <AccordionSection
              icon={<FileTextOutlined />}
              title="Observações Adicionais"
              subtitle="Notas, nota fiscal, motivo do parcelamento"
            >
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
            </AccordionSection>
          </div>

          {/* Sidebar / Actions Column */}
          <SummarySidebar form={form} />
        </div>
      </form>
    </div>
  );
}

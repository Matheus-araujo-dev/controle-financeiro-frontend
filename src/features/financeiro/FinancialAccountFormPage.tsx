import { Controller } from 'react-hook-form';
import { FileTextOutlined } from '@ant-design/icons';

import { PageState } from '../../components/states/PageState';
import type { FinanceiroModuleConfig } from './module-config';
import { GeneralInfoSection } from './financial-account-form/GeneralInfoSection';
import { RecurrenceSection } from './financial-account-form/RecurrenceSection';
import { RateioSection } from './financial-account-form/RateioSection';
import { SummarySidebar } from './financial-account-form/SummarySidebar';
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

  if (loading) return <PageState state="loading" title="Carregando lançamento..." />;
  if (errorMessage && !id) return <PageState state="error" title="Falha ao carregar lançamento" subtitle={errorMessage} />;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-on-surface-variant font-label text-xs uppercase tracking-[0.2em] mb-2">Operações Financeiras</h2>
          <h1 className="text-4xl font-headline font-extrabold tracking-tight text-on-surface">
            {id && id !== 'novo' ? 'Editar' : 'Criar'}: <span className="text-primary">{config.singularTitle}</span>
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Information Column */}
          <div className="lg:col-span-8 space-y-8">
            <GeneralInfoSection form={form} personLabel={config.personLabel} />
            <RecurrenceSection form={form} />
            <RateioSection form={form} />
          </div>

          {/* Sidebar / Actions Column */}
          <SummarySidebar form={form} />
        </div>

        {/* Observation Block */}
        <div className="bg-surface-container-low p-8 rounded-3xl border border-white/5 space-y-4">
          <div className="flex items-center gap-3">
            <FileTextOutlined className="text-on-surface-variant" />
            <h3 className="text-sm font-bold uppercase tracking-widest">Observações Adicionais</h3>
          </div>
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
      </form>
    </div>
  );
}

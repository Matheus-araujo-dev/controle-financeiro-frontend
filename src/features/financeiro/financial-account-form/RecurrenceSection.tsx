import { Controller } from 'react-hook-form';

import { DateInput } from '../../../components/forms/DateInput';
import { ComboBox } from '../../../components/forms/ComboBox';
import { ToggleField } from '../../../components/forms/FormPrimitives';
import {
  errorTextClass,
  fieldLabelClass,
  nativeCompactFieldClass,
  nativeTextareaClass
} from './field-classes';
import { FormSection } from '../../../components/layout';
import type { FinancialAccountFormApi } from './useFinancialAccountForm';
import { handleIntegerPaste, parseIntegerInput, preventScientificNotation } from '../../../shared/number-input';

type RecurrenceSectionProps = {
  form: FinancialAccountFormApi;
};

const tipoDiaOptions = [
  { label: 'Dia Fixo', value: 'DiaFixo' },
  { label: 'Dia Útil', value: 'DiaUtil' }
];

export function RecurrenceSection({ form }: RecurrenceSectionProps) {
  const {
    id,
    control,
    errors,
    canEdit,
    exibeRecorrencia,
    recurringStartDatePreview,
    automaticRecurringStartPreview
  } = form;

  return (
    <FormSection title="Recorrência Automática" eyebrow="Passo 4" icon={<span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>sync</span>}>
      <Controller
        control={control}
        name="ehRecorrente"
        render={({ field }) => (
          <ToggleField
            checked={Boolean(field.value)}
            disabled={!canEdit}
            onChange={field.onChange}
            label={field.value ? 'Recorrência habilitada' : 'Sem recorrência'}
            description="Gerar títulos futuros automaticamente"
          />
        )}
      />

      {exibeRecorrencia ? (
        <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
          <p className="rounded-xl border border-white/5 bg-surface-container px-4 py-3 text-sm text-on-surface-variant">
            {id && recurringStartDatePreview
              ? `Início da série: ${recurringStartDatePreview}.`
              : automaticRecurringStartPreview
                ? `A primeira ocorrência será iniciada automaticamente em ${automaticRecurringStartPreview}.`
                : 'A primeira ocorrência será iniciada em breve.'}
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2.5">
              <label className={fieldLabelClass}>Início da Série</label>
              <Controller
                control={control}
                name="recorrenciaDataInicio"
                render={({ field }) => <DateInput mode="month" value={field.value} onChange={field.onChange} disabled={!canEdit} />}
              />
              {errors.recorrenciaDataInicio ? <span className={errorTextClass}>{errors.recorrenciaDataInicio.message}</span> : null}
            </div>

            <div className="space-y-2.5">
              <label className={fieldLabelClass}>Dia</label>
              <Controller
                control={control}
                name="recorrenciaDiaOrdemMensal"
                render={({ field }) => (
                  <input
                    name={field.name}
                    ref={field.ref}
                    inputMode="numeric"
                    value={String(field.value ?? 1)}
                    onBlur={field.onBlur}
                    onKeyDown={preventScientificNotation}
                    onPaste={handleIntegerPaste}
                    onChange={(event) => field.onChange(parseIntegerInput(event.target.value))}
                    disabled={!canEdit}
                    className={`${nativeCompactFieldClass} [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden`}
                  />
                )}
              />
              {errors.recorrenciaDiaOrdemMensal ? <span className={errorTextClass}>{errors.recorrenciaDiaOrdemMensal.message}</span> : null}
            </div>

            <div className="space-y-2.5">
              <label className={fieldLabelClass}>Tipo de Dia</label>
              <Controller
                control={control}
                name="recorrenciaTipoDia"
                render={({ field }) => (
                  <ComboBox aria-label="Tipo de Dia" value={field.value} disabled={!canEdit} onChange={field.onChange} options={tipoDiaOptions} />
                )}
              />
              {errors.recorrenciaTipoDia ? <span className={errorTextClass}>{errors.recorrenciaTipoDia.message}</span> : null}
            </div>

            <div className="space-y-2.5">
              <label className={fieldLabelClass}>Mês Final</label>
              <Controller
                control={control}
                name="recorrenciaDataFim"
                render={({ field }) => <DateInput mode="month" value={field.value} onChange={field.onChange} disabled={!canEdit} />}
              />
              {errors.recorrenciaDataFim ? <span className={errorTextClass}>{errors.recorrenciaDataFim.message}</span> : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-2.5">
              <label className={fieldLabelClass}>Observação da Recorrência</label>
              <Controller
                control={control}
                name="recorrenciaObservacao"
                render={({ field: { value, ...rest } }) => (
                  <textarea
                    {...rest}
                    value={value ?? ''}
                    rows={4}
                    disabled={!canEdit}
                    placeholder="Observações internas sobre a regra de recorrência."
                    className={nativeTextareaClass}
                  />
                )}
              />
            </div>

            <div className="space-y-3">
              <label className={fieldLabelClass}>Edição Individual</label>
              <Controller
                control={control}
                name="recorrenciaPermiteEdicaoOcorrenciaIndividual"
                render={({ field }) => (
                  <ToggleField
                    checked={Boolean(field.value)}
                    disabled={!canEdit}
                    onChange={field.onChange}
                    label={field.value ? 'Permitido' : 'Bloqueado'}
                    description="Ajuste uma ocorrência sem alterar a série"
                  />
                )}
              />
            </div>
          </div>
        </div>
      ) : null}
    </FormSection>
  );
}

import { Controller } from 'react-hook-form';

import { CurrencyInput } from '../../../shared/CurrencyInput';
import { DateInput } from '../../../components/forms/DateInput';
import { FormSection } from '../../../components/layout';
import { errorTextClass, fieldLabelClass, nativeCompactFieldClass, nativeFieldWithPaddingClass } from './field-classes';
import type { FinancialAccountFormApi } from './useFinancialAccountForm';
import { handleIntegerPaste, parseIntegerInput, preventScientificNotation } from '../../../shared/number-input';

type TermsValueSectionProps = {
  form: FinancialAccountFormApi;
};

export function TermsValueSection({ form }: TermsValueSectionProps) {
  const { id, control, errors, canEdit, watchedValues } = form;

  return (
    <FormSection title="Prazos e Valor" eyebrow="Passo 2" icon={<span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-y-8">
        <div className="space-y-2.5">
          <label className={fieldLabelClass}>Data Emissão</label>
          <Controller
            control={control}
            name="dataEmissao"
            render={({ field }) => <DateInput mode="date" value={field.value} onChange={field.onChange} disabled={!canEdit} />}
          />
          {errors.dataEmissao ? <span className={errorTextClass}>{errors.dataEmissao.message}</span> : null}
        </div>

        <div className="space-y-2.5">
          <label className={fieldLabelClass}>Data Vencimento</label>
          <Controller
            control={control}
            name="dataVencimento"
            render={({ field }) => (
              <div className={errors.dataVencimento ? 'rounded-xl ring-1 ring-error' : ''}>
                <DateInput mode="date" value={field.value} onChange={field.onChange} disabled={!canEdit} />
              </div>
            )}
          />
          {errors.dataVencimento ? <span className={errorTextClass}>{errors.dataVencimento.message}</span> : null}
        </div>

        <div className="space-y-2.5">
          <label className={fieldLabelClass}>Parcelas</label>
          <Controller
            control={control}
            name="quantidadeParcelas"
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
                disabled={Boolean(id) || watchedValues.ehRecorrente || !canEdit}
                className={`${nativeFieldWithPaddingClass} ${errors.quantidadeParcelas ? 'ring-1 ring-error' : ''}`}
              />
            )}
          />
          {errors.quantidadeParcelas ? <span className={errorTextClass}>{errors.quantidadeParcelas.message}</span> : null}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2.5">
          <label className={fieldLabelClass}>Valor Original</label>
          <Controller
            control={control}
            name="valorOriginal"
            render={({ field }) => (
              <CurrencyInput value={field.value} onChange={(val) => field.onChange(val ?? 0)} disabled={!canEdit} className={nativeCompactFieldClass} />
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
    </FormSection>
  );
}

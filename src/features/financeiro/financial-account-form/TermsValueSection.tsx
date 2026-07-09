import { useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';

import { CurrencyInput } from '../../../shared/CurrencyInput';
import { DateInput } from '../../../components/forms/DateInput';
import { FormSection } from '../../../components/layout';
import { errorTextClass, fieldLabelClass, nativeCompactFieldClass, nativeFieldWithPaddingClass } from './field-classes';
import type { FinancialAccountFormApi } from './useFinancialAccountForm';
import { handleIntegerPaste, parseIntegerInput, preventScientificNotation } from '../../../shared/number-input';

type TermsValueSectionProps = {
  form: FinancialAccountFormApi;
  moduloLabel?: string;
};

export function TermsValueSection({ form, moduloLabel = 'pagar' }: TermsValueSectionProps) {
  const { id, control, errors, canEdit, watchedValues, setValue, formaPagamentoBehavior } = form;
  const [jaLiquidada, setJaLiquidada] = useState(false);

  function handleToggleLiquidada(valor: boolean) {
    setJaLiquidada(valor);
    if (valor) {
      const dataAtual = watchedValues.dataVencimento;
      if (dataAtual) setValue('dataLiquidacao', dataAtual);
    } else {
      setValue('dataLiquidacao', '');
    }
  }

  useEffect(() => {
    if (id) return;
    const novoEstado = formaPagamentoBehavior.baixarAutomaticamente;
    setJaLiquidada(novoEstado);
    if (novoEstado) {
      const dataAtual = watchedValues.dataVencimento;
      if (dataAtual) setValue('dataLiquidacao', dataAtual);
    } else {
      setValue('dataLiquidacao', '');
    }
  }, [watchedValues.formaPagamentoId]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleDataChange(novaData: string, fieldOnChange: (v: string) => void) {
    fieldOnChange(novaData);
    if (jaLiquidada) {
      setValue('dataLiquidacao', novaData);
    }
  }

  const labelData = jaLiquidada
    ? moduloLabel === 'receber' ? 'Data de Recebimento' : 'Data de Liquidação'
    : 'Data Vencimento';

  const toggleLabel = moduloLabel === 'receber' ? 'Já recebida?' : 'Já liquidada?';

  return (
    <FormSection title="Prazos e Valor" eyebrow="Passo 2" icon={<span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>}>
      {!id ? (
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={jaLiquidada}
            onClick={() => handleToggleLiquidada(!jaLiquidada)}
            className={[
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
              jaLiquidada ? 'bg-primary' : 'bg-white/15',
            ].join(' ')}
          >
            <span
              className={[
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                jaLiquidada ? 'translate-x-5' : 'translate-x-0',
              ].join(' ')}
            />
          </button>
          <span className="text-sm text-on-surface-variant">{toggleLabel}</span>
          {jaLiquidada ? (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
              {moduloLabel === 'receber' ? 'Recebida' : 'Liquidada'}
            </span>
          ) : null}
        </div>
      ) : null}

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
          <label className={[fieldLabelClass, jaLiquidada ? 'text-primary' : ''].join(' ')}>{labelData}</label>
          <Controller
            control={control}
            name="dataVencimento"
            render={({ field }) => (
              <div className={errors.dataVencimento ? 'rounded-xl ring-1 ring-error' : ''}>
                <DateInput
                  mode="date"
                  value={field.value}
                  onChange={(v) => handleDataChange(v, field.onChange)}
                  disabled={!canEdit}
                />
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

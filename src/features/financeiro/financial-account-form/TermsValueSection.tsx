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

type ParcelamentoMode = 'total' | 'parcela';

export function TermsValueSection({ form, moduloLabel = 'pagar' }: TermsValueSectionProps) {
  const { id, control, errors, canEdit, watchedValues, setValue, formaPagamentoBehavior } = form;
  const [jaLiquidada, setJaLiquidada] = useState(false);
  const [parcelamentoMode, setParcelamentoMode] = useState<ParcelamentoMode>('total');

  const ehCartao = formaPagamentoBehavior.ehCartao;

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
    if (ehCartao) {
      setJaLiquidada(false);
      setValue('dataLiquidacao', '');
      return;
    }
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

  const qtdParcelas = watchedValues.quantidadeParcelas ?? 1;
  const valorOriginal = watchedValues.valorOriginal ?? 0;
  const valorParcela = qtdParcelas > 0 ? valorOriginal / qtdParcelas : 0;

  function handleParcelaModeToggle(mode: ParcelamentoMode) {
    setParcelamentoMode(mode);
  }

  function handleValorOriginalChange(val: number | null) {
    setValue('valorOriginal', val ?? 0);
  }

  function handleValorParcelaChange(val: number | null) {
    const parcela = val ?? 0;
    setValue('valorOriginal', parcela * qtdParcelas);
  }

  return (
    <FormSection title="Prazos e Valor" eyebrow="Passo 3" icon={<span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>}>
      {!id && !ehCartao ? (
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

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {!ehCartao ? (
          <div className="space-y-2.5">
            <label className={fieldLabelClass}>Data Emissão</label>
            <Controller
              control={control}
              name="dataEmissao"
              render={({ field }) => <DateInput mode="date" value={field.value} onChange={field.onChange} disabled={!canEdit} />}
            />
            {errors.dataEmissao ? <span className={errorTextClass}>{errors.dataEmissao.message}</span> : null}
          </div>
        ) : null}

        {!ehCartao ? (
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
        ) : null}

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

        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <label className={fieldLabelClass}>{parcelamentoMode === 'parcela' && qtdParcelas > 1 ? 'Valor Parcela' : qtdParcelas > 1 ? 'Valor Total' : 'Valor'}</label>
            {qtdParcelas > 1 ? (
              <div className="ml-auto flex rounded-lg border border-white/10 bg-surface-container p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => handleParcelaModeToggle('total')}
                  className={['rounded-md px-1.5 py-0.5 transition-colors', parcelamentoMode === 'total' ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-on-surface'].join(' ')}
                  title={`Total ÷ ${qtdParcelas}x`}
                >
                  ÷{qtdParcelas}
                </button>
                <button
                  type="button"
                  onClick={() => handleParcelaModeToggle('parcela')}
                  className={['rounded-md px-1.5 py-0.5 transition-colors', parcelamentoMode === 'parcela' ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-on-surface'].join(' ')}
                  title={`Parcela × ${qtdParcelas}x`}
                >
                  ×{qtdParcelas}
                </button>
              </div>
            ) : null}
          </div>
          {parcelamentoMode === 'total' || qtdParcelas <= 1 ? (
            <Controller
              control={control}
              name="valorOriginal"
              render={({ field }) => (
                <CurrencyInput value={field.value} onChange={handleValorOriginalChange} disabled={!canEdit} className={nativeCompactFieldClass} />
              )}
            />
          ) : (
            <CurrencyInput value={valorParcela} onChange={handleValorParcelaChange} disabled={!canEdit} className={nativeCompactFieldClass} />
          )}
          {qtdParcelas > 1 ? (
            <p className="text-[11px] text-on-surface-variant/70">
              {parcelamentoMode === 'total'
                ? `Parcela: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorParcela)}`
                : `Total: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorOriginal)}`}
            </p>
          ) : null}
        </div>
      </div>
    </FormSection>
  );
}

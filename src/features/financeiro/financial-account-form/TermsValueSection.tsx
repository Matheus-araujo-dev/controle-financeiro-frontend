import { Controller } from 'react-hook-form';
import { CalendarOutlined } from '@ant-design/icons';

import { CurrencyInput } from '../../../shared/CurrencyInput';
import { errorTextClass, fieldLabelClass, nativeDateFieldClass } from './field-classes';
import type { FinancialAccountFormApi } from './useFinancialAccountForm';

type TermsValueSectionProps = {
  form: FinancialAccountFormApi;
};

const currencyFieldClass =
  'financial-summary-inline-input w-full bg-surface-container-highest border-none rounded-2xl px-4 py-3 text-white font-headline';

export function TermsValueSection({ form }: TermsValueSectionProps) {
  const { id, control, errors, canEdit, watchedValues } = form;

  return (
    <div className="bg-surface-container-low p-8 rounded-3xl border border-white/5 space-y-8">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <CalendarOutlined />
        </span>
        <div>
          <h3 className="text-lg font-headline font-bold leading-tight">Prazos e Valor</h3>
          <p className="text-xs text-on-surface-variant">Quando vence e quanto custa</p>
        </div>
        <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Passo 2</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Emission Date */}
        <div className="space-y-2">
          <label className={fieldLabelClass}>Data Emissão</label>
          <Controller
            control={control}
            name="dataEmissao"
            render={({ field }) => (
              <input type="date" {...field} disabled={!canEdit} className={nativeDateFieldClass} />
            )}
          />
          {errors.dataEmissao && <span className={errorTextClass}>{errors.dataEmissao.message}</span>}
        </div>

        {/* Due Date */}
        <div className="space-y-2">
          <label className={fieldLabelClass}>Data Vencimento</label>
          <Controller
            control={control}
            name="dataVencimento"
            render={({ field }) => (
              <input type="date" {...field} disabled={!canEdit} className={nativeDateFieldClass} />
            )}
          />
          {errors.dataVencimento && <span className={errorTextClass}>{errors.dataVencimento.message}</span>}
        </div>

        {/* Installments */}
        <div className="space-y-2">
          <label className={fieldLabelClass}>Parcelas</label>
          <Controller
            control={control}
            name="quantidadeParcelas"
            render={({ field }) => (
              <input
                type="number"
                min={1}
                {...field}
                disabled={Boolean(id) || watchedValues.ehRecorrente || !canEdit}
                className="financial-native-field w-full rounded-2xl px-4 py-3 text-white"
              />
            )}
          />
          {errors.quantidadeParcelas && <span className={errorTextClass}>{errors.quantidadeParcelas.message}</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className={fieldLabelClass}>Valor Original</label>
          <Controller
            control={control}
            name="valorOriginal"
            render={({ field }) => (
              <CurrencyInput
                value={field.value}
                onChange={(val) => field.onChange(val ?? 0)}
                disabled={!canEdit}
                className={currencyFieldClass}
              />
            )}
          />
        </div>
        <div className="space-y-2">
          <label className={fieldLabelClass}>Desconto</label>
          <Controller
            control={control}
            name="valorDesconto"
            render={({ field }) => (
              <CurrencyInput
                value={field.value}
                onChange={(val) => field.onChange(val ?? 0)}
                disabled={!canEdit}
                className={currencyFieldClass}
              />
            )}
          />
        </div>
        <div className="space-y-2">
          <label className={fieldLabelClass}>Juros</label>
          <Controller
            control={control}
            name="valorJuros"
            render={({ field }) => (
              <CurrencyInput
                value={field.value}
                onChange={(val) => field.onChange(val ?? 0)}
                disabled={!canEdit}
                className={currencyFieldClass}
              />
            )}
          />
        </div>
        <div className="space-y-2">
          <label className={fieldLabelClass}>Multa</label>
          <Controller
            control={control}
            name="valorMulta"
            render={({ field }) => (
              <CurrencyInput
                value={field.value}
                onChange={(val) => field.onChange(val ?? 0)}
                disabled={!canEdit}
                className={currencyFieldClass}
              />
            )}
          />
        </div>
      </div>
    </div>
  );
}

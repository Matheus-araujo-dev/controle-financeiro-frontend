import { useState } from 'react';
import { Controller } from 'react-hook-form';

import { formatCurrencyBRL } from '../../../shared/currency';
import { CurrencyInput } from '../../../shared/CurrencyInput';
import { nativeCompactFieldClass, fieldLabelClass } from './field-classes';
import type { FinancialAccountFormApi } from './useFinancialAccountForm';
import { ComboBox } from '../../../components/forms/ComboBox';
import { QuickAddContaGerencialModal } from '../../cadastros/quick-add/QuickAddContaGerencialModal';

type RateioSectionProps = {
  form: FinancialAccountFormApi;
};

export function RateioSection({ form }: RateioSectionProps) {
  const { control, canEdit, fields, append, remove, rateioOptions, totalRateios, valorLiquido, setValue, reloadRateioOptions } = form;
  const [contaGerencialModalIndex, setContaGerencialModalIndex] = useState<number | null>(null);
  const singleRow = fields.length === 1;

  function handleContaGerencialSuccess(newId: string) {
    const index = contaGerencialModalIndex;
    void reloadRateioOptions().then(() => {
      if (index !== null) setValue(`rateios.${index}.contaGerencialId`, newId);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="max-w-md text-xs text-on-surface-variant">
          {singleRow
            ? 'Com uma única conta, o valor acompanha automaticamente o total do lançamento. Adicione linhas para dividir entre centros de custo.'
            : 'Distribua o valor líquido entre as contas gerenciais desejadas.'}
        </p>
        <button
          type="button"
          onClick={() => append({ contaGerencialId: '', valor: 0 })}
          disabled={!canEdit}
          className="text-primary transition-colors hover:text-primary-container disabled:opacity-50"
          title="Adicionar conta ao rateio"
        >
          <span className="material-symbols-outlined text-2xl">add_circle</span>
        </button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-1 items-end gap-4 animate-in fade-in slide-in-from-left-4 duration-300 md:grid-cols-12">
            <div className="space-y-1 md:col-span-7">
              <label className={fieldLabelClass}>Conta Gerencial</label>
              <Controller
                control={control}
                name={`rateios.${index}.contaGerencialId`}
                render={({ field: rField }) => (
                  <ComboBox
                    {...rField}
                    disabled={!canEdit}
                    className={nativeCompactFieldClass}
                    onAddNew={canEdit ? () => setContaGerencialModalIndex(index) : undefined}
                  >
                    <option value="">Selecionar...</option>
                    {rateioOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </ComboBox>
                )}
              />
            </div>

            <div className="space-y-1 md:col-span-4">
              <label className={fieldLabelClass}>Valor</label>
              <Controller
                control={control}
                name={`rateios.${index}.valor`}
                render={({ field: rField }) => (
                  <CurrencyInput
                    value={rField.value}
                    onChange={(val) => rField.onChange(val ?? 0)}
                    disabled={!canEdit || singleRow}
                    className={nativeCompactFieldClass}
                  />
                )}
              />
            </div>

            <div className="pb-1 md:col-span-1">
              <button
                type="button"
                onClick={() => remove(index)}
                disabled={fields.length === 1 || !canEdit}
                className="rounded-xl p-2 text-error transition-all hover:bg-error/10 disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-xl">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-white/5 pt-4">
        <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Total Rateado</span>
        <span className={`font-headline text-lg font-extrabold ${Math.abs(totalRateios - valorLiquido) < 0.01 ? 'text-primary' : 'text-warning'}`}>
          {formatCurrencyBRL(totalRateios)}
        </span>
      </div>

      <QuickAddContaGerencialModal
        open={contaGerencialModalIndex !== null}
        onClose={() => setContaGerencialModalIndex(null)}
        onSuccess={handleContaGerencialSuccess}
      />
    </div>
  );
}

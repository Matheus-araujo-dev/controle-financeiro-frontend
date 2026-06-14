import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { DeleteOutlined, PlusCircleOutlined } from '@ant-design/icons';

import { formatCurrencyBRL } from '../../../shared/currency';
import { CurrencyInput } from '../../../shared/CurrencyInput';
import { nativeCompactFieldClass } from './field-classes';
import type { FinancialAccountFormApi } from './useFinancialAccountForm';
import { SelectWithQuickAdd } from '../../../components/forms/SelectWithQuickAdd';
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
      <div className="flex items-center justify-between">
        <p className="text-xs text-on-surface-variant max-w-md">
          {singleRow
            ? 'Com uma única conta, o valor acompanha automaticamente o total do lançamento. Adicione linhas para dividir entre centros de custo.'
            : 'Distribua o valor líquido entre as contas gerenciais desejadas.'}
        </p>
        <button
          type="button"
          onClick={() => append({ contaGerencialId: '', valor: 0 })}
          disabled={!canEdit}
          className="text-primary hover:text-primary-container transition-colors disabled:opacity-50"
          title="Adicionar conta ao rateio"
        >
          <PlusCircleOutlined className="text-2xl" />
        </button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="md:col-span-7 space-y-1">
              <label className="text-[10px] uppercase font-bold text-on-surface-variant ml-1">Conta Gerencial</label>
              <Controller
                control={control}
                name={`rateios.${index}.contaGerencialId`}
                render={({ field: rField }) => (
                  <SelectWithQuickAdd
                    {...rField}
                    disabled={!canEdit}
                    className={nativeCompactFieldClass}
                    onAddNew={canEdit ? () => setContaGerencialModalIndex(index) : undefined}
                  >
                    <option value="">Selecionar...</option>
                    {rateioOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </SelectWithQuickAdd>
                )}
              />
            </div>
            <div className="md:col-span-4 space-y-1">
              <label className="text-[10px] uppercase font-bold text-on-surface-variant ml-1">Valor</label>
              <Controller
                control={control}
                name={`rateios.${index}.valor`}
                render={({ field: rField }) => (
                  <CurrencyInput
                    value={rField.value}
                    onChange={(val) => rField.onChange(val ?? 0)}
                    disabled={!canEdit || singleRow}
                    className="w-full bg-surface-container-highest border-none rounded-2xl px-4 py-3 text-white text-sm font-headline"
                  />
                )}
              />
            </div>
            <div className="md:col-span-1 pb-1">
              <button
                type="button"
                onClick={() => remove(index)}
                disabled={fields.length === 1 || !canEdit}
                className="p-2 text-error hover:bg-error/10 rounded-xl transition-all disabled:opacity-30"
              >
                <DeleteOutlined style={{ fontSize: '1.25rem' }} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="pt-4 border-t border-white/5 flex justify-between items-center">
        <span className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Total Rateado</span>
        <span className={`text-lg font-headline font-extrabold ${Math.abs(totalRateios - valorLiquido) < 0.01 ? 'text-primary' : 'text-warning'}`}>
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

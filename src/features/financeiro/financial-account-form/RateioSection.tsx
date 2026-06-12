import { Controller } from 'react-hook-form';
import { DeleteOutlined, PieChartOutlined, PlusCircleOutlined } from '@ant-design/icons';

import { formatCurrencyBRL } from '../../../shared/currency';
import { CurrencyInput } from '../../../shared/CurrencyInput';
import { nativeCompactFieldClass } from './field-classes';
import type { FinancialAccountFormApi } from './useFinancialAccountForm';

type RateioSectionProps = {
  form: FinancialAccountFormApi;
};

export function RateioSection({ form }: RateioSectionProps) {
  const { control, canEdit, fields, append, remove, rateioOptions, totalRateios, valorLiquido } = form;

  return (
    <div className="bg-surface-container-low p-8 rounded-3xl border border-white/5 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <PieChartOutlined className="text-primary text-xl" />
          <h3 className="text-xl font-headline font-bold">Rateio por Centro de Custo</h3>
        </div>
        <button
          type="button"
          onClick={() => append({ contaGerencialId: '', valor: 0 })}
          disabled={!canEdit}
          className="text-primary hover:text-primary-container transition-colors disabled:opacity-50"
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
                  <select {...rField} disabled={!canEdit} className={nativeCompactFieldClass}>
                    <option value="">Selecionar...</option>
                    {rateioOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
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
                    disabled={!canEdit}
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
    </div>
  );
}

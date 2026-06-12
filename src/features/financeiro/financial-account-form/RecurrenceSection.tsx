import { Controller } from 'react-hook-form';
import { SyncOutlined } from '@ant-design/icons';

import { toMonthInputValue } from '../../../shared/date';
import {
  errorTextClass,
  fieldLabelClass,
  nativeCompactFieldClass,
  nativeDateFieldClass,
  nativeMonthFieldClass,
  nativeTextareaClass
} from './field-classes';
import type { FinancialAccountFormApi } from './useFinancialAccountForm';

type RecurrenceSectionProps = {
  form: FinancialAccountFormApi;
};

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
    <div className="bg-surface-container-low p-8 rounded-3xl border border-white/5 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <SyncOutlined className="text-primary text-xl" />
          <h3 className="text-xl font-headline font-bold">Recorrência Automática</h3>
        </div>
        <Controller
          control={control}
          name="ehRecorrente"
          render={({ field }) => (
            <button
              type="button"
              disabled={!canEdit}
              onClick={() => field.onChange(!field.value)}
              className={`w-12 h-6 rounded-full transition-all relative ${field.value ? 'bg-primary' : 'bg-surface-container-highest'} ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${field.value ? 'right-1' : 'left-1'}`} />
            </button>
          )}
        />
      </div>

      {exibeRecorrencia && (
        <div className="animate-in fade-in zoom-in-95 duration-300 space-y-6">
          <p className="text-on-surface-variant text-sm bg-white/5 p-4 rounded-xl border border-white/5">
            {id && recurringStartDatePreview
              ? `Início da série: ${recurringStartDatePreview}.`
              : automaticRecurringStartPreview
                ? `A primeira ocorrência será iniciada automaticamente em ${automaticRecurringStartPreview}.`
                : 'A primeira ocorrência será iniciada em breve.'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className={fieldLabelClass}>Início da série</label>
              <Controller
                control={control}
                name="recorrenciaDataInicio"
                render={({ field }) => (
                  <input type="date" {...field} disabled={!canEdit} className={nativeDateFieldClass} />
                )}
              />
              {errors.recorrenciaDataInicio && <span className={errorTextClass}>{errors.recorrenciaDataInicio.message}</span>}
            </div>
            <div className="space-y-2">
              <label className={fieldLabelClass}>Dia</label>
              <Controller
                control={control}
                name="recorrenciaDiaOrdemMensal"
                render={({ field }) => (
                  <input type="number" min={1} max={31} {...field} disabled={!canEdit} className={nativeCompactFieldClass} />
                )}
              />
              {errors.recorrenciaDiaOrdemMensal && <span className={errorTextClass}>{errors.recorrenciaDiaOrdemMensal.message}</span>}
            </div>
            <div className="space-y-2">
              <label className={fieldLabelClass}>Tipo de Dia</label>
              <Controller
                control={control}
                name="recorrenciaTipoDia"
                render={({ field }) => (
                  <select {...field} disabled={!canEdit} className={nativeCompactFieldClass}>
                    <option value="DiaFixo">Dia Fixo</option>
                    <option value="DiaUtil">Dia Útil</option>
                  </select>
                )}
              />
              {errors.recorrenciaTipoDia && <span className={errorTextClass}>{errors.recorrenciaTipoDia.message}</span>}
            </div>
            <div className="space-y-2">
              <label className={fieldLabelClass}>Mês Final</label>
              <Controller
                control={control}
                name="recorrenciaDataFim"
                render={({ field }) => (
                  <input
                    type="month"
                    {...field}
                    value={toMonthInputValue(field.value)}
                    disabled={!canEdit}
                    className={nativeMonthFieldClass}
                  />
                )}
              />
              {errors.recorrenciaDataFim && <span className={errorTextClass}>{errors.recorrenciaDataFim.message}</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px] gap-6">
            <div className="space-y-2">
              <label className={fieldLabelClass}>Observação da recorrência</label>
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
            <div className="space-y-3 rounded-2xl border border-white/8 bg-white/[0.04] px-5 py-4">
              <div>
                <p className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Edição individual
                </p>
                <p className="mt-2 text-xs text-on-surface-variant">
                  Permite ajustar uma ocorrência específica sem alterar toda a série.
                </p>
              </div>
              <Controller
                control={control}
                name="recorrenciaPermiteEdicaoOcorrenciaIndividual"
                render={({ field }) => (
                  <button
                    type="button"
                    disabled={!canEdit}
                    onClick={() => field.onChange(!field.value)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all ${
                      field.value
                        ? 'border-primary/35 bg-primary/10 text-primary'
                        : 'border-white/8 bg-surface-container-highest text-on-surface-variant'
                    } ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className="text-sm font-bold">{field.value ? 'Permitido' : 'Bloqueado'}</span>
                    <span
                      className={`relative h-6 w-12 rounded-full transition-all ${
                        field.value ? 'bg-primary/60' : 'bg-white/10'
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                          field.value ? 'right-1' : 'left-1'
                        }`}
                      />
                    </span>
                  </button>
                )}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

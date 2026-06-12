import { Controller } from 'react-hook-form';
import { CheckCircleOutlined, DollarCircleOutlined } from '@ant-design/icons';
import { Modal } from 'antd';

import { formatCurrencyBRL } from '../../../shared/currency';
import { CurrencyInput } from '../../../shared/CurrencyInput';
import { nativeCompactFieldClass, nativeDateFieldClass } from './field-classes';
import type { FinancialAccountFormApi } from './useFinancialAccountForm';

type SummarySidebarProps = {
  form: FinancialAccountFormApi;
};

export function SummarySidebar({ form }: SummarySidebarProps) {
  const {
    id,
    control,
    canEdit,
    isSubmitting,
    isValid,
    valorLiquido,
    formaPagamentoBehavior,
    formaPagamentoOptions,
    cartaoOptions,
    contaBancariaOptions,
    detailStatus,
    errorMessage,
    onCancel,
    cancelar,
    estornar
  } = form;

  return (
    <div className="lg:col-span-4 space-y-6">
      <div className="bg-surface-container sticky top-24 p-8 rounded-3xl border border-white/10 shadow-2xl space-y-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

        <div className="space-y-6 relative">
          <h3 className="font-headline font-extrabold flex items-center gap-2 text-lg">
            <DollarCircleOutlined className="text-primary" /> Resumo Financeiro
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              <span>Valor Original</span>
              <span className="text-white">
                <Controller
                  control={control}
                  name="valorOriginal"
                  render={({ field }) => (
                    <CurrencyInput
                      value={field.value}
                      onChange={(val) => field.onChange(val ?? 0)}
                      disabled={!canEdit}
                      className="bg-transparent border-none text-right focus:ring-0 p-0 font-headline font-bold text-white w-24"
                    />
                  )}
                />
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Descontos</span>
              <Controller
                control={control}
                name="valorDesconto"
                render={({ field }) => (
                  <CurrencyInput
                    value={field.value}
                    onChange={(val) => field.onChange(val ?? 0)}
                    disabled={!canEdit}
                    className="bg-transparent border-none text-right focus:ring-0 p-0 font-headline text-error w-24"
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Juros / Multa</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/6 bg-surface-container-highest/70 px-3 py-3">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Juros</span>
                  <Controller
                    control={control}
                    name="valorJuros"
                    render={({ field }) => (
                      <CurrencyInput
                        value={field.value}
                        onChange={(val) => field.onChange(val ?? 0)}
                        disabled={!canEdit}
                        className="financial-summary-inline-input bg-transparent border-none text-left focus:ring-0 p-0 font-headline w-full"
                      />
                    )}
                  />
                </div>
                <div className="rounded-2xl border border-white/6 bg-surface-container-highest/70 px-3 py-3">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Multa</span>
                  <Controller
                    control={control}
                    name="valorMulta"
                    render={({ field }) => (
                      <CurrencyInput
                        value={field.value}
                        onChange={(val) => field.onChange(val ?? 0)}
                        disabled={!canEdit}
                        className="financial-summary-inline-input bg-transparent border-none text-left focus:ring-0 p-0 font-headline w-full"
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-2">Valor Líquido Final</p>
              <p className="text-4xl font-headline font-black text-primary neon-glow">{formatCurrencyBRL(valorLiquido)}</p>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-on-surface-variant block ml-1">Forma de Pagamento</label>
              <Controller
                control={control}
                name="formaPagamentoId"
                render={({ field }) => (
                  <select {...field} disabled={!canEdit} className={nativeCompactFieldClass}>
                    <option value="">Selecionar...</option>
                    {formaPagamentoOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                )}
              />
            </div>

            {formaPagamentoBehavior.ehCartao && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] font-bold uppercase text-on-surface-variant block ml-1">Cartão de Crédito</label>
                <Controller
                  control={control}
                  name="cartaoId"
                  render={({ field }) => (
                    <select {...field} disabled={!canEdit} className={nativeCompactFieldClass}>
                      <option value="">Selecionar cartão...</option>
                      {cartaoOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  )}
                />
              </div>
            )}

            {formaPagamentoBehavior.baixarAutomaticamente && (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-300 bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-on-surface-variant block ml-1">Conta para Baixa</label>
                  <Controller
                    control={control}
                    name="contaBancariaId"
                    render={({ field }) => (
                      <select {...field} disabled={!canEdit} className={nativeCompactFieldClass}>
                        <option value="">Selecionar conta...</option>
                        {contaBancariaOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-on-surface-variant block ml-1">Data Liquidação</label>
                  <Controller
                    control={control}
                    name="dataLiquidacao"
                    render={({ field }) => (
                      <input type="date" {...field} disabled={!canEdit} className={nativeDateFieldClass} />
                    )}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-6">
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="w-full py-4 bg-primary text-on-primary rounded-2xl font-headline font-extrabold text-lg shadow-[0_10px_30px_rgba(63,255,139,0.2)] active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
            >
              {id ? 'Atualizar Lançamento' : 'Confirmar Lançamento'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-3 text-on-surface-variant font-bold hover:text-white transition-colors"
            >
              Descartar Alterações
            </button>
          </div>

          {errorMessage && (
            <div className="p-4 bg-error/10 border border-error/20 rounded-2xl text-error text-xs font-bold text-center">
              {errorMessage}
            </div>
          )}
        </div>
      </div>

      {id && (detailStatus === 'PENDENTE' || detailStatus === 'EM_FATURA') && (
        <div className="p-8 bg-surface-container-low rounded-3xl border border-white/5 space-y-4">
          <h4 className="text-sm font-bold uppercase text-on-surface-variant">Ações de Gestão</h4>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => Modal.confirm({
                title: 'Confirmar Cancelamento',
                content: 'Tem certeza que deseja cancelar este lançamento? Esta ação não pode ser desfeita.',
                okText: 'Sim, cancelar',
                okType: 'danger',
                centered: true,
                onOk: cancelar
              })}
              className="w-full py-3 border border-error/30 text-error hover:bg-error/10 rounded-xl font-bold text-xs transition-all"
            >
              CANCELAR TÍTULO
            </button>
          </div>
        </div>
      )}

      {id && detailStatus === 'LIQUIDADA' && (
        <div className="p-8 bg-surface-container-low rounded-3xl border border-white/5 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <CheckCircleOutlined />
            <span className="text-xs font-bold uppercase tracking-widest">Título Liquidado</span>
          </div>
          <button
            type="button"
            onClick={() => Modal.confirm({
              title: 'Estornar Liquidação',
              content: 'Deseja reverter o pagamento deste título?',
              okText: 'Sim, estornar',
              centered: true,
              onOk: estornar
            })}
            className="w-full py-3 border border-warning/30 text-warning hover:bg-warning/10 rounded-xl font-bold text-xs transition-all"
          >
            ESTORNAR PAGAMENTO
          </button>
        </div>
      )}
    </div>
  );
}

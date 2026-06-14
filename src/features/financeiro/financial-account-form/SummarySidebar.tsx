import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { CheckCircleOutlined, DollarCircleOutlined, SafetyOutlined } from '@ant-design/icons';
import { Modal } from 'antd';

import { formatCurrencyBRL } from '../../../shared/currency';
import { nativeDateFieldClass, fieldLabelClass } from './field-classes';
import { SelectWithQuickAdd } from '../../../components/forms/SelectWithQuickAdd';
import { QuickAddFormaPagamentoModal } from '../../cadastros/quick-add/QuickAddFormaPagamentoModal';
import { QuickAddCartaoModal } from '../../cadastros/quick-add/QuickAddCartaoModal';
import { QuickAddContaBancariaModal } from '../../cadastros/quick-add/QuickAddContaBancariaModal';
import type { FinancialAccountFormApi } from './useFinancialAccountForm';

type SummarySidebarProps = {
  form: FinancialAccountFormApi;
};

type QuickAddTarget = 'forma' | 'cartao' | 'conta' | null;

export function SummarySidebar({ form }: SummarySidebarProps) {
  const {
    id,
    control,
    canEdit,
    isSubmitting,
    isValid,
    valorLiquido,
    watchedValues,
    formaPagamentoBehavior,
    formaPagamentoOptions,
    cartaoOptions,
    contaBancariaOptions,
    detailStatus,
    errorMessage,
    setValue,
    onCancel,
    cancelar,
    estornar,
    reloadFormaPagamentoOptions,
    reloadCartaoOptions,
    reloadContaBancariaOptions
  } = form;

  const [quickAdd, setQuickAdd] = useState<QuickAddTarget>(null);

  const valorOriginal = Number(watchedValues.valorOriginal) || 0;
  const valorDesconto = Number(watchedValues.valorDesconto) || 0;
  const valorJurosMulta = (Number(watchedValues.valorJuros) || 0) + (Number(watchedValues.valorMulta) || 0);

  function handleFormaSuccess(newId: string) {
    void reloadFormaPagamentoOptions().then(() => setValue('formaPagamentoId', newId));
  }

  function handleCartaoSuccess(newId: string) {
    void reloadCartaoOptions().then(() => setValue('cartaoId', newId));
  }

  function handleContaSuccess(newId: string) {
    void reloadContaBancariaOptions().then(() => setValue('contaBancariaId', newId));
  }

  return (
    <div className="lg:col-span-4 space-y-6">
      <div className="bg-surface-container sticky top-24 p-8 rounded-3xl border border-white/10 shadow-2xl space-y-7 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

        <div className="relative space-y-7">
          <h3 className="font-headline font-extrabold flex items-center gap-2 text-lg">
            <DollarCircleOutlined className="text-primary" /> Resumo
          </h3>

          {/* Computed net value (read-only) */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-1">Valor Líquido</p>
            <p className="text-4xl font-headline font-black text-primary neon-glow">{formatCurrencyBRL(valorLiquido)}</p>
          </div>

          {/* Breakdown (read-only) */}
          <div className="space-y-3 border-t border-white/10 pt-5">
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Valor original</span>
              <span className="text-white font-headline">{formatCurrencyBRL(valorOriginal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Desconto</span>
              <span className="text-error font-headline">− {formatCurrencyBRL(valorDesconto)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Juros / multa</span>
              <span className="text-white font-headline">+ {formatCurrencyBRL(valorJurosMulta)}</span>
            </div>
          </div>

          {/* Payment method + dependents */}
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className={fieldLabelClass}>Forma de Pagamento</label>
              <Controller
                control={control}
                name="formaPagamentoId"
                render={({ field }) => (
                  <SelectWithQuickAdd
                    {...field}
                    disabled={!canEdit}
                    className="financial-native-field w-full rounded-2xl px-4 py-3 text-sm text-white"
                    onAddNew={canEdit ? () => setQuickAdd('forma') : undefined}
                  >
                    <option value="">Selecionar...</option>
                    {formaPagamentoOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </SelectWithQuickAdd>
                )}
              />
            </div>

            {formaPagamentoBehavior.ehCartao && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                <label className={fieldLabelClass}>Cartão de Crédito</label>
                <Controller
                  control={control}
                  name="cartaoId"
                  render={({ field }) => (
                    <SelectWithQuickAdd
                      {...field}
                      disabled={!canEdit}
                      className="financial-native-field w-full rounded-2xl px-4 py-3 text-sm text-white"
                      onAddNew={canEdit ? () => setQuickAdd('cartao') : undefined}
                    >
                      <option value="">Selecionar cartão...</option>
                      {cartaoOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </SelectWithQuickAdd>
                  )}
                />
              </div>
            )}

            {formaPagamentoBehavior.baixarAutomaticamente && (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-300 bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="space-y-2">
                  <label className={fieldLabelClass}>Conta para Baixa</label>
                  <Controller
                    control={control}
                    name="contaBancariaId"
                    render={({ field }) => (
                      <SelectWithQuickAdd
                        {...field}
                        disabled={!canEdit}
                        className="financial-native-field w-full rounded-2xl px-4 py-3 text-sm text-white"
                        onAddNew={canEdit ? () => setQuickAdd('conta') : undefined}
                      >
                        <option value="">Selecionar conta...</option>
                        {contaBancariaOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </SelectWithQuickAdd>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className={fieldLabelClass}>Data Liquidação</label>
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

          <div className="space-y-4 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="w-full py-4 bg-primary text-on-primary rounded-2xl font-headline font-extrabold text-lg shadow-[0_10px_30px_rgba(63,255,139,0.2)] active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
            >
              {id && id !== 'novo' ? 'Atualizar Lançamento' : 'Confirmar Lançamento'}
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

          <div className="flex items-start gap-2 rounded-2xl bg-white/[0.03] px-4 py-3 text-[11px] text-on-surface-variant">
            <SafetyOutlined className="mt-0.5 text-primary" />
            <span>O valor líquido é calculado automaticamente a partir dos valores informados no Passo 2.</span>
          </div>
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

      <QuickAddFormaPagamentoModal
        open={quickAdd === 'forma'}
        onClose={() => setQuickAdd(null)}
        onSuccess={handleFormaSuccess}
      />
      <QuickAddCartaoModal
        open={quickAdd === 'cartao'}
        onClose={() => setQuickAdd(null)}
        onSuccess={handleCartaoSuccess}
      />
      <QuickAddContaBancariaModal
        open={quickAdd === 'conta'}
        onClose={() => setQuickAdd(null)}
        onSuccess={handleContaSuccess}
      />
    </div>
  );
}

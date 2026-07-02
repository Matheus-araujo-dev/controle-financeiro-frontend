import { useState } from 'react';
import { Controller } from 'react-hook-form';

import { DateInput } from '../../../components/forms/DateInput';
import { ComboBox } from '../../../components/forms/ComboBox';
import { FormSection } from '../../../components/layout';
import { QuickAddCartaoModal } from '../../cadastros/quick-add/QuickAddCartaoModal';
import { QuickAddContaBancariaModal } from '../../cadastros/quick-add/QuickAddContaBancariaModal';
import { QuickAddFormaPagamentoModal } from '../../cadastros/quick-add/QuickAddFormaPagamentoModal';
import { fieldLabelClass } from './field-classes';
import type { FinancialAccountFormApi } from './useFinancialAccountForm';

type QuickAddTarget = 'forma' | 'cartao' | 'conta' | null;

export function PaymentSection({ form }: { form: FinancialAccountFormApi }) {
  const {
    control,
    canEdit,
    formaPagamentoBehavior,
    formaPagamentoOptions,
    cartaoOptions,
    contaBancariaOptions,
    setValue,
    reloadFormaPagamentoOptions,
    reloadCartaoOptions,
    reloadContaBancariaOptions
  } = form;

  const [quickAdd, setQuickAdd] = useState<QuickAddTarget>(null);

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
    <FormSection title="Configuração de Pagamento" eyebrow="Passo 3" icon={<span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className={fieldLabelClass}>Forma de Pagamento</label>
          <Controller
            control={control}
            name="formaPagamentoId"
            render={({ field }) => (
              <ComboBox
                {...field}
                disabled={!canEdit}
                onAddNew={canEdit ? () => setQuickAdd('forma') : undefined}
              >
                <option value="">Selecionar...</option>
                {formaPagamentoOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </ComboBox>
            )}
          />
        </div>

        {formaPagamentoBehavior.ehCartao ? (
          <div className="space-y-2">
            <label className={fieldLabelClass}>Cartão de Crédito</label>
            <Controller
              control={control}
              name="cartaoId"
              render={({ field }) => (
                <ComboBox
                  {...field}
                  disabled={!canEdit}
                  onAddNew={canEdit ? () => setQuickAdd('cartao') : undefined}
                >
                  <option value="">Selecionar cartão...</option>
                  {cartaoOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </ComboBox>
              )}
            />
          </div>
        ) : null}

        {formaPagamentoBehavior.baixarAutomaticamente ? (
          <>
            <div className="space-y-2">
              <label className={fieldLabelClass}>Conta para Baixa</label>
              <Controller
                control={control}
                name="contaBancariaId"
                render={({ field }) => (
                  <ComboBox
                    {...field}
                    disabled={!canEdit}
                    onAddNew={canEdit ? () => setQuickAdd('conta') : undefined}
                  >
                    <option value="">Selecionar conta...</option>
                    {contaBancariaOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </ComboBox>
                )}
              />
            </div>

            <div className="space-y-2">
              <label className={fieldLabelClass}>Data Liquidação</label>
              <Controller
                control={control}
                name="dataLiquidacao"
                render={({ field }) => <DateInput mode="date" value={field.value} onChange={field.onChange} disabled={!canEdit} />}
              />
            </div>
          </>
        ) : null}
      </div>

      <QuickAddFormaPagamentoModal open={quickAdd === 'forma'} onClose={() => setQuickAdd(null)} onSuccess={handleFormaSuccess} />
      <QuickAddCartaoModal open={quickAdd === 'cartao'} onClose={() => setQuickAdd(null)} onSuccess={handleCartaoSuccess} />
      <QuickAddContaBancariaModal open={quickAdd === 'conta'} onClose={() => setQuickAdd(null)} onSuccess={handleContaSuccess} />
    </FormSection>
  );
}

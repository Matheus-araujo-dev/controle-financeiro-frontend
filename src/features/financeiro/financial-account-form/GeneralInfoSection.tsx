import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { CreditCardOutlined, FileTextOutlined, InfoCircleOutlined, SearchOutlined } from '@ant-design/icons';

import { formatMonthYearBR } from '../../../shared/date';
import { buildCardInvoiceLink } from './card-invoice';
import { errorTextClass, fieldLabelClass, nativeFieldWithPaddingClass } from './field-classes';
import type { FinancialAccountFormApi } from './useFinancialAccountForm';
import { SelectWithQuickAdd } from '../../../components/forms/SelectWithQuickAdd';
import { QuickAddPessoaModal } from '../../cadastros/quick-add/QuickAddPessoaModal';
import { QuickAddContaGerencialModal } from '../../cadastros/quick-add/QuickAddContaGerencialModal';

type GeneralInfoSectionProps = {
  form: FinancialAccountFormApi;
  personLabel: string;
};

type PessoaTarget = 'pessoaId' | 'responsavelId' | null;

export function GeneralInfoSection({ form, personLabel }: GeneralInfoSectionProps) {
  const {
    control,
    errors,
    canEdit,
    origemCompraPlanejadaId,
    cardInvoicePreview,
    pessoaOptions,
    rateioOptions,
    setValue,
    reloadPessoaOptions,
    reloadRateioOptions
  } = form;

  const [pessoaModalTarget, setPessoaModalTarget] = useState<PessoaTarget>(null);
  const [contaGerencialModalOpen, setContaGerencialModalOpen] = useState(false);

  function handlePessoaSuccess(newId: string) {
    const target = pessoaModalTarget; // capture before modal closes and resets state
    void reloadPessoaOptions().then(() => {
      if (target) setValue(target, newId);
    });
  }

  function handleContaGerencialSuccess(newId: string) {
    void reloadRateioOptions().then(() => {
      setValue('rateios.0.contaGerencialId', newId);
    });
  }

  return (
    <div className="bg-surface-container-low p-8 rounded-3xl border border-white/5 space-y-8">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <FileTextOutlined />
        </span>
        <div>
          <h3 className="text-lg font-headline font-bold leading-tight">Informações do Título</h3>
          <p className="text-xs text-on-surface-variant">O que é este lançamento e a quem se refere</p>
        </div>
        <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Passo 1</span>
      </div>

      {origemCompraPlanejadaId && (
        <div className="bg-tertiary/10 border border-tertiary/20 p-4 rounded-2xl flex gap-3 text-tertiary">
          <InfoCircleOutlined className="mt-1" />
          <div>
            <p className="text-sm font-bold">Lançamento derivado de compra planejada</p>
            <p className="text-xs opacity-80">Os campos foram pré-preenchidos. Complete os dados antes de salvar.</p>
          </div>
        </div>
      )}

      {cardInvoicePreview && (
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl space-y-3">
          <div className="flex gap-3 text-primary">
            <CreditCardOutlined className="mt-1 text-lg" />
            <div>
              <p className="text-sm font-bold">
                Direcionado para fatura {formatMonthYearBR(cardInvoicePreview.competencia)}
              </p>
              <p className="text-xs opacity-80">
                {`${cardInvoicePreview.cartaoNome ?? 'Cartão selecionado'} • fechamento ${cardInvoicePreview.dataFechamento} • vencimento ${cardInvoicePreview.dataVencimento}`}
              </p>
            </div>
          </div>
          <Link
            to={buildCardInvoiceLink(cardInvoicePreview)}
            className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline"
          >
            Abrir fatura prevista <SearchOutlined />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Description */}
        <div className="md:col-span-2 space-y-2">
          <label className={fieldLabelClass}>Descrição</label>
          <Controller
            control={control}
            name="descricao"
            render={({ field }) => (
              <div className="space-y-1">
                <input
                  {...field}
                  disabled={!canEdit}
                  className={`w-full bg-surface-container-highest border-none rounded-2xl px-4 py-4 focus:ring-1 transition-all text-white placeholder:text-on-surface-variant/40 ${errors.descricao ? 'ring-1 ring-error' : 'focus:ring-primary/40'}`}
                  placeholder="Ex: Aluguel Mensal"
                />
                {errors.descricao && <span className={errorTextClass}>{errors.descricao.message}</span>}
              </div>
            )}
          />
        </div>

        {/* Managerial account (category) */}
        <div className="md:col-span-2 space-y-2">
          <label className={fieldLabelClass}>Categoria · conta gerencial</label>
          <Controller
            control={control}
            name="rateios.0.contaGerencialId"
            render={({ field }) => (
              <SelectWithQuickAdd
                {...field}
                disabled={!canEdit}
                className={nativeFieldWithPaddingClass}
                onAddNew={canEdit ? () => setContaGerencialModalOpen(true) : undefined}
              >
                <option value="">Selecionar categoria...</option>
                {rateioOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </SelectWithQuickAdd>
            )}
          />
          <p className="text-[11px] text-on-surface-variant/70 ml-1">
            Para dividir entre várias contas, use o rateio por centro de custo abaixo.
          </p>
        </div>

        {/* Person */}
        <div className="space-y-2">
          <label className={fieldLabelClass}>{personLabel}</label>
          <Controller
            control={control}
            name="pessoaId"
            render={({ field }) => (
              <div className="space-y-1">
                <SelectWithQuickAdd
                  {...field}
                  disabled={!canEdit}
                  className={nativeFieldWithPaddingClass}
                  onAddNew={canEdit ? () => setPessoaModalTarget('pessoaId') : undefined}
                >
                  <option value="">Selecionar...</option>
                  {pessoaOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </SelectWithQuickAdd>
                {errors.pessoaId && <span className={errorTextClass}>{errors.pessoaId.message}</span>}
              </div>
            )}
          />
        </div>

        {/* Responsible */}
        <div className="space-y-2">
          <label className={fieldLabelClass}>Responsável</label>
          <Controller
            control={control}
            name="responsavelId"
            render={({ field }) => (
              <div className="space-y-1">
                <SelectWithQuickAdd
                  {...field}
                  disabled={!canEdit}
                  className={nativeFieldWithPaddingClass}
                  onAddNew={canEdit ? () => setPessoaModalTarget('responsavelId') : undefined}
                >
                  <option value="">Selecionar...</option>
                  {pessoaOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </SelectWithQuickAdd>
                {errors.responsavelId && <span className={errorTextClass}>{errors.responsavelId.message}</span>}
              </div>
            )}
          />
        </div>

        {/* Document Number */}
        <div className="md:col-span-2 space-y-2">
          <label className={fieldLabelClass}>Nº Documento</label>
          <Controller
            control={control}
            name="numeroDocumento"
            render={({ field: { value, ...rest } }) => (
              <input
                {...rest}
                value={value ?? ''}
                disabled={!canEdit}
                className={nativeFieldWithPaddingClass}
                placeholder="000.000"
              />
            )}
          />
        </div>
      </div>

      <QuickAddPessoaModal
        open={pessoaModalTarget !== null}
        onClose={() => setPessoaModalTarget(null)}
        onSuccess={handlePessoaSuccess}
      />
      <QuickAddContaGerencialModal
        open={contaGerencialModalOpen}
        onClose={() => setContaGerencialModalOpen(false)}
        onSuccess={handleContaGerencialSuccess}
      />
    </div>
  );
}

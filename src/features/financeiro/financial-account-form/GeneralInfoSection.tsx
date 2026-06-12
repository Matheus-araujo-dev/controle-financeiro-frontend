import { Controller } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { CreditCardOutlined, InfoCircleOutlined, SearchOutlined } from '@ant-design/icons';

import { formatMonthYearBR } from '../../../shared/date';
import { buildCardInvoiceLink } from './card-invoice';
import { errorTextClass, fieldLabelClass, nativeDateFieldClass, nativeFieldWithPaddingClass } from './field-classes';
import type { FinancialAccountFormApi } from './useFinancialAccountForm';

type GeneralInfoSectionProps = {
  form: FinancialAccountFormApi;
  personLabel: string;
};

export function GeneralInfoSection({ form, personLabel }: GeneralInfoSectionProps) {
  const {
    id,
    control,
    errors,
    canEdit,
    watchedValues,
    origemCompraPlanejadaId,
    cardInvoicePreview,
    pessoaOptions
  } = form;

  return (
    <div className="bg-surface-container-low p-8 rounded-3xl border border-white/5 space-y-8">
      <div className="flex items-center gap-3">
        <span className="w-1.5 h-6 bg-primary rounded-full"></span>
        <h3 className="text-xl font-headline font-bold">Informações do Título</h3>
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

        {/* Person */}
        <div className="space-y-2">
          <label className={fieldLabelClass}>{personLabel}</label>
          <Controller
            control={control}
            name="pessoaId"
            render={({ field }) => (
              <div className="space-y-1">
                <select {...field} disabled={!canEdit} className={nativeFieldWithPaddingClass}>
                  <option value="">Selecionar...</option>
                  {pessoaOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
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
                <select {...field} disabled={!canEdit} className={nativeFieldWithPaddingClass}>
                  <option value="">Selecionar...</option>
                  {pessoaOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                {errors.responsavelId && <span className={errorTextClass}>{errors.responsavelId.message}</span>}
              </div>
            )}
          />
        </div>

        {/* Document Number */}
        <div className="space-y-2">
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
                className={nativeFieldWithPaddingClass}
              />
            )}
          />
          {errors.quantidadeParcelas && <span className={errorTextClass}>{errors.quantidadeParcelas.message}</span>}
        </div>

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
      </div>
    </div>
  );
}

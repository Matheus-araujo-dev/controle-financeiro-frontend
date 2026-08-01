import { useEffect, useRef, useState } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { agenteApi } from '../../../services/http/agente-api';

import { formatDateBR, formatMonthYearBR } from '../../../shared/date';
import { buildCardInvoiceLink } from './card-invoice';
import { errorTextClass, fieldLabelClass, nativeFieldWithPaddingClass } from './field-classes';
import type { FinancialAccountFormApi } from './useFinancialAccountForm';
import { ComboBox } from '../../../components/forms/ComboBox';
import { FormSection } from '../../../components/layout';
import { QuickAddPessoaModal } from '../../cadastros/quick-add/QuickAddPessoaModal';
import { QuickAddContaGerencialModal } from '../../cadastros/quick-add/QuickAddContaGerencialModal';
import { ResponsaveisChipsSection } from './ResponsaveisChipsSection';

type GeneralInfoSectionProps = {
  form: FinancialAccountFormApi;
  personLabel: string;
  personRole: 'pagador' | 'recebedor';
};

type PessoaTarget = 'pessoaId' | null;

export function GeneralInfoSection({ form, personLabel, personRole }: GeneralInfoSectionProps) {
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
  const [contaGerencialModalOpen, setContaGerencialModalOpen] = useState<boolean>(false);
  const [aiSugestao, setAiSugestao] = useState<{ id: string; descricao: string; confianca: number } | null>(null);
  const aiDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const descricaoWatched = useWatch({ control, name: 'descricao' });
  const categoriaAtual = useWatch({ control, name: 'rateios.0.contaGerencialId' });
  const pessoaWatched = useWatch({ control, name: 'pessoaId' });
  const responsavelAtual = useWatch({ control, name: 'responsavelId' });
  const responsaveisAdicionaisAtual = useWatch({ control, name: 'responsaveisAdicionaisIds' }) ?? [];
  const lastAutoFilledContaRef = useRef<string | null>(null);
  const lastAutoFilledResponsavelRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pessoaWatched) return;
    const pessoa = pessoaOptions.find((o) => o.value === pessoaWatched);
    // personRole='recebedor' → conta a pagar (despesa); personRole='pagador' → conta a receber (receita)
    const contaId = personRole === 'pagador' ? pessoa?.contaGerencialReceitaId : pessoa?.contaGerencialDespesaId;
    const manuallyChanged = categoriaAtual && categoriaAtual !== lastAutoFilledContaRef.current;
    if (manuallyChanged) return;
    if (contaId) {
      setValue('rateios.0.contaGerencialId', contaId);
      lastAutoFilledContaRef.current = contaId;
    } else {
      if (categoriaAtual === lastAutoFilledContaRef.current) {
        setValue('rateios.0.contaGerencialId', '');
      }
      lastAutoFilledContaRef.current = null;
    }
  }, [pessoaWatched, pessoaOptions, categoriaAtual, personRole, setValue]);

  useEffect(() => {
    if (!categoriaAtual) return;
    const option = rateioOptions.find((o) => o.value === categoriaAtual);
    const responsavelId = option?.responsavelPadraoId;
    if (!responsavelId) return;
    // Skip auto-fill when there are multiple responsáveis (user is managing chips manually)
    if (responsaveisAdicionaisAtual.length > 0) return;
    const manuallyChanged = responsavelAtual && responsavelAtual !== lastAutoFilledResponsavelRef.current;
    if (manuallyChanged) return;
    setValue('responsavelId', responsavelId);
    lastAutoFilledResponsavelRef.current = responsavelId;
  }, [categoriaAtual, rateioOptions, responsavelAtual, responsaveisAdicionaisAtual, setValue]);

  useEffect(() => {
    if (aiDebounceRef.current) clearTimeout(aiDebounceRef.current);
    setAiSugestao(null);
    if (!descricaoWatched || descricaoWatched.length < 4 || !canEdit) return;

    aiDebounceRef.current = setTimeout(() => {
      agenteApi
        .categorizar([descricaoWatched])
        .then((resp) => {
          const item = resp.itens[0];
          if (item?.contaGerencialId && item.confianca >= 0.65) {
            setAiSugestao({
              id: item.contaGerencialId,
              descricao: item.contaGerencialDescricao ?? '',
              confianca: item.confianca
            });
          }
        })
        .catch(() => {
          // Sugestão automática não bloqueia o preenchimento manual.
        });
    }, 800);

    return () => {
      if (aiDebounceRef.current) clearTimeout(aiDebounceRef.current);
    };
  }, [descricaoWatched, canEdit]);

  function handlePessoaSuccess(newId: string) {
    void reloadPessoaOptions().then(() => {
      if (pessoaModalTarget) setValue(pessoaModalTarget, newId);
    });
  }

  function handleContaGerencialSuccess(newId: string) {
    void reloadRateioOptions().then(() => {
      setValue('rateios.0.contaGerencialId', newId);
    });
  }

  return (
    <FormSection title="Informações do Título" eyebrow="Passo 1" icon={<span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>}>
      {origemCompraPlanejadaId ? (
        <div className="flex gap-3 rounded-2xl border border-tertiary/20 bg-tertiary/10 p-4 text-tertiary">
          <span className="material-symbols-outlined mt-1" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
          <div>
            <p className="text-sm font-bold">Lançamento derivado de compra planejada</p>
            <p className="text-xs opacity-80">Os campos foram pré-preenchidos. Complete os dados antes de salvar.</p>
          </div>
        </div>
      ) : null}

      {cardInvoicePreview ? (
        <div className="mb-2 overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container">
          {/* Header */}
          <div className="flex items-center justify-center gap-2 border-b border-outline-variant/15 bg-surface-container-high px-4 py-2.5">
            <span
              className="text-base leading-none text-primary material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              credit_card
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest leading-none text-on-surface-variant">
              Direcionado para fatura
            </span>
          </div>

          {/* Body */}
          <div className="px-4 py-3 space-y-3">
            <p className="font-headline text-lg font-bold text-on-surface leading-none">
              {formatMonthYearBR(cardInvoicePreview.competencia)}
            </p>

            <div className="grid grid-cols-3 gap-x-4 gap-y-2">
              {[
                { label: 'Cartão', value: cardInvoicePreview.cartaoNome ?? '—' },
                { label: 'Fechamento', value: formatDateBR(cardInvoicePreview.dataFechamento) },
                { label: 'Vencimento', value: formatDateBR(cardInvoicePreview.dataVencimento) },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">{item.label}</p>
                  <p className="mt-0.5 text-xs font-semibold text-on-surface truncate">{item.value}</p>
                </div>
              ))}
            </div>

            <Link
              to={buildCardInvoiceLink(cardInvoicePreview)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
              style={{ color: 'var(--color-on-surface-variant)' }}
            >
              <span className="material-symbols-outlined text-sm leading-none">open_in_new</span>
              Abrir fatura prevista
            </Link>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-2 md:col-span-3">
          <label className={fieldLabelClass}>Descrição</label>
          <Controller
            control={control}
            name="descricao"
            render={({ field }) => (
              <div className="space-y-1">
                <input
                  {...field}
                  disabled={!canEdit}
                  className={`${nativeFieldWithPaddingClass} ${errors.descricao ? 'ring-1 ring-error' : ''}`}
                  placeholder="Ex: Aluguel mensal"
                />
                {errors.descricao ? <span className={errorTextClass}>{errors.descricao.message}</span> : null}
              </div>
            )}
          />
        </div>

        <div className="space-y-2">
          <label className={fieldLabelClass}>{personLabel}</label>
          <Controller
            control={control}
            name="pessoaId"
            render={({ field }) => (
              <div className="space-y-1">
                <div className={errors.pessoaId ? 'rounded-xl ring-1 ring-error' : ''}>
                  <ComboBox
                    {...field}
                    disabled={!canEdit}
                    onAddNew={canEdit ? () => setPessoaModalTarget('pessoaId') : undefined}
                  >
                    <option value="">Selecionar...</option>
                    {pessoaOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </ComboBox>
                </div>
                {errors.pessoaId ? <span className={errorTextClass}>{errors.pessoaId.message}</span> : null}
              </div>
            )}
          />
        </div>

        <div className="space-y-2">
          <label className={fieldLabelClass}>Categoria · conta gerencial</label>
          <Controller
            control={control}
            name="rateios.0.contaGerencialId"
            render={({ field }) => (
              <ComboBox
                {...field}
                disabled={!canEdit}
                onAddNew={canEdit ? () => setContaGerencialModalOpen(true) : undefined}
                placeholder="Selecionar categoria..."
                options={rateioOptions}
              />
            )}
          />

          {aiSugestao && !categoriaAtual ? (
            <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/8 px-3 py-2 animate-in fade-in duration-300">
              <span className="material-symbols-outlined text-sm text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
              <span className="flex-1 text-xs font-medium text-primary">
                IA sugere: <strong>{aiSugestao.descricao}</strong>
                <span className="ml-1 opacity-60">({Math.round(aiSugestao.confianca * 100)}%)</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setValue('rateios.0.contaGerencialId', aiSugestao.id);
                  setAiSugestao(null);
                }}
                className="rounded-lg bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary transition-colors hover:bg-primary/25"
              >
                Usar
              </button>
            </div>
          ) : null}

          <p className="ml-1 text-[11px] text-on-surface-variant/70">
            Para dividir entre várias contas, use o rateio por centro de custo abaixo.
          </p>
        </div>

        <div className="space-y-2">
          <ResponsaveisChipsSection form={form} personRole={personRole} />
        </div>
      </div>

      <QuickAddPessoaModal
        open={pessoaModalTarget !== null}
        onClose={() => setPessoaModalTarget(null)}
        onSuccess={handlePessoaSuccess}
        defaultRole={personRole}
      />
      <QuickAddContaGerencialModal open={contaGerencialModalOpen} onClose={() => setContaGerencialModalOpen(false)} onSuccess={handleContaGerencialSuccess} />
    </FormSection>
  );
}

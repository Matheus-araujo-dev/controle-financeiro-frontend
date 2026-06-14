import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { BankOutlined, CreditCardOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { AxiosError } from 'axios';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { PageState } from '../../components/states/PageState';
import { applyServerValidationErrors } from '../../services/forms/applyServerValidationErrors';
import { CurrencyInput } from '../../shared/CurrencyInput';
import { formatCurrencyBRL } from '../../shared/currency';
import type { ApiErrorResponse } from '../../types/api';
import type { CartaoPayload } from '../../types/cadastros';
import { cartoesModuleConfig, type SelectOption } from './module-config';

const brandSuggestions = ['Visa', 'Mastercard', 'Elo', 'American Express', 'Hipercard'];

function getContaBancariaField() {
  return cartoesModuleConfig.fields.find((field) => field.name === 'contaBancariaPagamentoPadraoId');
}

function getMaskedFinal(value?: string) {
  const digits = (value ?? '').replace(/\D/g, '').slice(0, 4);

  if (!digits) {
    return '4242';
  }

  return digits.padStart(4, '0');
}

function getBrandLabel(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized.toUpperCase() : 'BANDEIRA';
}

function normalizeNumberField(value: string) {
  if (value.trim() === '') {
    return Number.NaN;
  }

  return Number(value);
}

function getSelectedBankLabel(options: SelectOption[], value?: string | null) {
  if (!value) {
    return 'Sem conta vinculada';
  }

  return options.find((option) => option.value === value)?.label ?? 'Conta nao encontrada';
}

export function CartoesFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(Boolean(id));
  const [loadError, setLoadError] = useState<string>();
  const [submitError, setSubmitError] = useState<string>();
  const [contasBancarias, setContasBancarias] = useState<SelectOption[]>([]);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<CartaoPayload>({
    resolver: zodResolver(cartoesModuleConfig.schema as any) as never,
    defaultValues: cartoesModuleConfig.defaultValues,
    mode: 'onChange'
  });

  const watchedValues = useWatch({ control });

  useEffect(() => {
    async function loadOptions() {
      const contaField = getContaBancariaField();

      if (!contaField?.loadOptions) {
        setContasBancarias([]);
        return;
      }

      try {
        setContasBancarias(await contaField.loadOptions());
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Falha ao carregar contas bancarias.');
      }
    }

    void loadOptions();
  }, []);

  useEffect(() => {
    if (!id) {
      reset(cartoesModuleConfig.defaultValues);
      setLoading(false);
      return;
    }

    async function loadDetail() {
      setLoading(true);
      setLoadError(undefined);

      try {
        const detail = await cartoesModuleConfig.detail(id!);
        reset(cartoesModuleConfig.toFormValues(detail));
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Falha ao carregar cartao.');
      } finally {
        setLoading(false);
      }
    }

    void loadDetail();
  }, [id, reset]);

  const resumo = useMemo(
    () => ({
      nome: watchedValues.nome?.trim() || 'Seu cartao principal',
      bandeira: getBrandLabel(watchedValues.bandeira),
      final: getMaskedFinal(watchedValues.numeroFinal),
      fechamento:
        typeof watchedValues.diaFechamentoFatura === 'number' && Number.isFinite(watchedValues.diaFechamentoFatura)
          ? `Dia ${String(watchedValues.diaFechamentoFatura).padStart(2, '0')}`
          : 'Sem definicao',
      vencimento:
        typeof watchedValues.diaVencimentoFatura === 'number' && Number.isFinite(watchedValues.diaVencimentoFatura)
          ? `Dia ${String(watchedValues.diaVencimentoFatura).padStart(2, '0')}`
          : 'Sem definicao',
      limite:
        watchedValues.limiteCredito === null || watchedValues.limiteCredito === undefined
          ? 'Sem limite individual'
          : formatCurrencyBRL(watchedValues.limiteCredito),
      contaBancaria: getSelectedBankLabel(contasBancarias, watchedValues.contaBancariaPagamentoPadraoId),
      ativo: Boolean(watchedValues.ativo)
    }),
    [contasBancarias, watchedValues]
  );

  async function onSubmit(values: CartaoPayload) {
    setSubmitError(undefined);

    try {
      if (id) {
        await cartoesModuleConfig.update(id, values);
      } else {
        await cartoesModuleConfig.create(values);
      }

      navigate(cartoesModuleConfig.routeBase);
    } catch (error) {
      const apiError = error as AxiosError<ApiErrorResponse>;
      const validationErrors = apiError.response?.data?.errors;

      if (validationErrors) {
        applyServerValidationErrors(validationErrors, (field, message) =>
          setError(field as keyof CartaoPayload, {
            type: 'server',
            message
          })
        );
        return;
      }

      setSubmitError(error instanceof Error ? error.message : 'Falha ao salvar cartao.');
    }
  }

  if (loading) {
    return <PageState state="loading" title="Carregando cartao" />;
  }

  if (loadError) {
    return <PageState state="error" title="Falha ao carregar cartao" subtitle={loadError} />;
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-8 px-1 2xl:px-4">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary/80">Cadastros</p>
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-on-surface sm:text-5xl">
              {id ? 'Atualizar cartao' : 'Adicionar cartao'}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-on-surface-variant sm:text-base">
              Ajuste fechamento, vencimento, limite e conta bancaria padrao sem mudar a regra operacional do cadastro.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(cartoesModuleConfig.routeBase)}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] px-5 py-3 text-sm font-bold text-on-surface transition hover:border-white/15 hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="cartoes-form"
            disabled={isSubmitting}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-black text-[#062412] shadow-[0_18px_40px_rgba(63,255,139,0.18)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Salvando...' : id ? 'Salvar alteracoes' : 'Salvar cartao'}
          </button>
        </div>
      </section>

      <form
        id="cartoes-form"
        onSubmit={handleSubmit(onSubmit)}
        className="grid w-full min-w-0 gap-8 xl:grid-cols-[minmax(360px,0.72fr)_minmax(0,1.48fr)] 2xl:gap-10 2xl:grid-cols-[minmax(390px,0.7fr)_minmax(0,1.6fr)]"
      >
        <div className="min-w-0 space-y-6 2xl:space-y-7">
          <section className="relative overflow-hidden rounded-[32px] border border-white/8 bg-[linear-gradient(140deg,rgba(24,24,24,0.98),rgba(9,9,9,0.96))] p-7 shadow-[0_28px_80px_rgba(0,0,0,0.34)] xl:p-8 2xl:p-9">
            <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
            <div className="absolute bottom-0 right-0 h-28 w-28 rounded-full bg-tertiary/10 blur-3xl" aria-hidden="true" />

            <div className="relative flex min-h-[264px] flex-col justify-between 2xl:min-h-[288px]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Neon Ledger</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-on-surface-variant">Preview operacional</p>
                </div>
                <span className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xl text-on-surface-variant">
                  <CreditCardOutlined />
                </span>
              </div>

              <div className="space-y-5">
                <div className="flex items-center gap-3 2xl:gap-4">
                  <div className="h-10 w-14 rounded-xl border border-primary/25 bg-primary/12 2xl:h-11 2xl:w-16" />
                  <div className="text-lg font-black tracking-[0.34em] text-on-surface 2xl:text-xl">
                    •••• •••• •••• {resumo.final}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 2xl:gap-5">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">Titular</p>
                    <p className="mt-2 text-sm font-bold uppercase tracking-[0.08em] text-on-surface">{resumo.nome}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">Bandeira</p>
                    <p className="mt-2 text-sm font-bold uppercase tracking-[0.08em] text-primary">{resumo.bandeira}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/8 bg-surface-container-low p-6 shadow-[0_20px_60px_rgba(0,0,0,0.24)] 2xl:p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="mt-1 rounded-2xl border border-primary/20 bg-primary/12 p-3 text-primary">
                  <SafetyCertificateOutlined />
                </span>
                <div>
                  <h2 className="text-lg font-black text-on-surface">Status do cartao</h2>
                  <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                    Defina se o cartao fica disponivel para uso operacional no fluxo de compras e faturas.
                  </p>
                </div>
              </div>

              <Controller
                control={control}
                name="ativo"
                render={({ field }) => (
                  <label className="inline-flex cursor-pointer items-center gap-3">
                    <span className={`text-xs font-bold uppercase tracking-[0.2em] ${field.value ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {field.value ? 'Ativo' : 'Inativo'}
                    </span>
                    <span className="relative inline-flex h-8 w-16 items-center rounded-full bg-white/[0.08]">
                      <input
                        type="checkbox"
                        checked={Boolean(field.value)}
                        onChange={(event) => field.onChange(event.target.checked)}
                        className="peer sr-only"
                      />
                      <span className="absolute inset-0 rounded-full bg-white/[0.06] transition peer-checked:bg-primary/30" />
                      <span className="absolute left-1 h-6 w-6 rounded-full bg-white transition peer-checked:translate-x-8 peer-checked:bg-primary" />
                    </span>
                  </label>
                )}
              />
            </div>
          </section>

          <section className="rounded-[28px] border border-white/8 bg-surface-container-low p-6 shadow-[0_20px_60px_rgba(0,0,0,0.24)] 2xl:p-7">
            <div className="flex items-start gap-3">
              <span className="mt-1 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-on-surface">
                <BankOutlined />
              </span>
              <div>
                <h2 className="text-lg font-black text-on-surface">Resumo de configuracao</h2>
                <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                  A vinculacao da conta bancaria padrao facilita o pagamento e a conciliacao da fatura no fechamento.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Fechamento</span>
                <span className="text-sm font-bold text-on-surface">{resumo.fechamento}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Vencimento</span>
                <span className="text-sm font-bold text-on-surface">{resumo.vencimento}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Limite individual</span>
                <span className="text-sm font-bold text-primary">{resumo.limite}</span>
              </div>
              <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Conta bancaria padrao</p>
                <p className="mt-2 text-sm font-bold text-on-surface">{resumo.contaBancaria}</p>
              </div>
            </div>

            {submitError ? (
              <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/8 px-4 py-3 text-sm font-bold text-red-300">
                {submitError}
              </div>
            ) : null}
          </section>
        </div>

        <section className="min-w-0 rounded-[32px] border border-white/8 bg-surface-container-low p-6 shadow-[0_28px_80px_rgba(0,0,0,0.28)] sm:p-8 2xl:p-10">
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary/80">Parametros do cartao</p>
            <h2 className="text-2xl font-black tracking-tight text-on-surface">Dados principais</h2>
            <p className="max-w-3xl text-sm leading-6 text-on-surface-variant">
              O cadastro continua com as mesmas validacoes e integracoes. A atualizacao aqui e apenas visual.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Nome do cartao</label>
              <Controller
                control={control}
                name="nome"
                render={({ field }) => (
                    <input
                      {...field}
                      value={field.value ?? ''}
                      aria-label="Nome do cartao"
                      placeholder="Ex: Bradesco Smiles"
                    className="h-14 w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 text-sm font-medium text-on-surface outline-none transition placeholder:text-on-surface-variant/45 focus:border-primary/30"
                  />
                )}
              />
              {errors.nome ? <p className="px-1 text-xs font-bold text-red-300">{errors.nome.message}</p> : null}
            </div>

            <div className="space-y-2">
              <label className="px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Bandeira</label>
              <Controller
                control={control}
                name="bandeira"
                render={({ field }) => (
                  <>
                    <input
                      {...field}
                      value={field.value ?? ''}
                      aria-label="Bandeira"
                      list="cartoes-brand-suggestions"
                      placeholder="Visa, Mastercard, Elo..."
                      className="h-14 w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 text-sm font-medium text-on-surface outline-none transition placeholder:text-on-surface-variant/45 focus:border-primary/30"
                    />
                    <datalist id="cartoes-brand-suggestions">
                      {brandSuggestions.map((brand) => (
                        <option key={brand} value={brand} />
                      ))}
                    </datalist>
                  </>
                )}
              />
              {errors.bandeira ? <p className="px-1 text-xs font-bold text-red-300">{errors.bandeira.message}</p> : null}
            </div>

            <div className="space-y-2">
              <label className="px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Numero final</label>
              <Controller
                control={control}
                name="numeroFinal"
                render={({ field }) => (
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black tracking-[0.28em] text-on-surface-variant/60">
                      ••••
                    </span>
                    <input
                      {...field}
                      value={field.value ?? ''}
                      aria-label="Numero final"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="4242"
                      onChange={(event) => field.onChange(event.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="h-14 w-full rounded-2xl border border-white/8 bg-white/[0.03] pl-16 pr-4 text-sm font-medium text-on-surface outline-none transition placeholder:text-on-surface-variant/45 focus:border-primary/30"
                    />
                  </div>
                )}
              />
              {errors.numeroFinal ? <p className="px-1 text-xs font-bold text-red-300">{errors.numeroFinal.message}</p> : null}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Conta bancaria padrao</label>
              <Controller
                control={control}
                name="contaBancariaPagamentoPadraoId"
                render={({ field }) => (
                  <select
                    aria-label="Conta bancaria padrao"
                    value={field.value ?? ''}
                    onChange={(event) => field.onChange(event.target.value)}
                    className="h-14 w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 text-sm font-medium text-on-surface outline-none transition focus:border-primary/30"
                  >
                    <option value="">Nao vincular agora</option>
                    {contasBancarias.map((option) => (
                      <option key={String(option.value)} value={String(option.value)}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.contaBancariaPagamentoPadraoId ? (
                <p className="px-1 text-xs font-bold text-red-300">{errors.contaBancariaPagamentoPadraoId.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Dia de fechamento</label>
              <Controller
                control={control}
                name="diaFechamentoFatura"
                render={({ field }) => (
                  <input
                    type="number"
                    aria-label="Dia de fechamento"
                    min={1}
                    max={31}
                    step={1}
                    value={Number.isFinite(field.value) ? field.value : ''}
                    onChange={(event) => field.onChange(normalizeNumberField(event.target.value))}
                    placeholder="05"
                    className="h-14 w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 text-sm font-medium text-on-surface outline-none transition placeholder:text-on-surface-variant/45 focus:border-primary/30"
                  />
                )}
              />
              {errors.diaFechamentoFatura ? (
                <p className="px-1 text-xs font-bold text-red-300">{errors.diaFechamentoFatura.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Dia de vencimento</label>
              <Controller
                control={control}
                name="diaVencimentoFatura"
                render={({ field }) => (
                  <input
                    type="number"
                    aria-label="Dia de vencimento"
                    min={1}
                    max={31}
                    step={1}
                    value={Number.isFinite(field.value) ? field.value : ''}
                    onChange={(event) => field.onChange(normalizeNumberField(event.target.value))}
                    placeholder="12"
                    className="h-14 w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 text-sm font-medium text-on-surface outline-none transition placeholder:text-on-surface-variant/45 focus:border-primary/30"
                  />
                )}
              />
              {errors.diaVencimentoFatura ? (
                <p className="px-1 text-xs font-bold text-red-300">{errors.diaVencimentoFatura.message}</p>
              ) : null}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Limite individual</label>
              <Controller
                control={control}
                name="limiteCredito"
                render={({ field }) => (
                  <CurrencyInput
                    value={typeof field.value === 'number' ? field.value : null}
                    onChange={(value) => field.onChange(value)}
                    aria-label="Limite individual"
                    placeholder="R$ 0,00"
                    className="h-14 rounded-2xl border border-white/8 bg-white/[0.03] px-4 text-sm font-medium text-on-surface outline-none transition placeholder:text-on-surface-variant/45 focus:border-primary/30"
                  />
                )}
              />
              {errors.limiteCredito ? <p className="px-1 text-xs font-bold text-red-300">{errors.limiteCredito.message}</p> : null}
            </div>
          </div>

          <div className="mt-8 rounded-[24px] border border-primary/12 bg-primary/[0.05] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary/85">Dica operacional</p>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">
              Quando houver conta bancaria padrao, o modulo de faturas consegue orientar melhor o fluxo de pagamento e a conciliacao sem alterar a regra atual de negocio.
            </p>
          </div>
        </section>
      </form>
    </div>
  );
}

export default CartoesFormPage;

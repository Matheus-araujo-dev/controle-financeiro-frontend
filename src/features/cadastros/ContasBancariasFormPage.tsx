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
import { formatDateBR } from '../../shared/date';
import type { ApiErrorResponse } from '../../types/api';
import type { ContaBancariaPayload } from '../../types/cadastros';
import { contasBancariasModuleConfig } from './module-config';

const bankSuggestions = ['Bradesco', 'Itau', 'Nubank', 'Santander', 'Banco Inter', 'Caixa', 'Banco do Brasil'];
const accountTypeSuggestions = ['Corrente', 'Poupanca', 'Investimento', 'Salario'];

function getBankLabel(value?: string | null) {
  return value?.trim() || 'Banco nao definido';
}

function getAccountTypeLabel(value?: string | null) {
  return value?.trim() || 'Sem tipologia';
}

function getAccountIdentifier(agency?: string | null, accountNumber?: string | null) {
  if (agency && accountNumber) {
    return `${agency} / ${accountNumber}`;
  }

  return accountNumber || agency || 'Sem numeracao';
}

function getStatusLabel(active: boolean) {
  return active ? 'Status Ativo' : 'Status Inativo';
}

export function ContasBancariasFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(Boolean(id));
  const [loadError, setLoadError] = useState<string>();
  const [submitError, setSubmitError] = useState<string>();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ContaBancariaPayload>({
    resolver: zodResolver(contasBancariasModuleConfig.schema as any) as never,
    defaultValues: contasBancariasModuleConfig.defaultValues,
    mode: 'onChange'
  });

  const watchedValues = useWatch({ control });
  const sharedLimitEnabled = watchedValues.limiteCartoesCompartilhado !== null;

  useEffect(() => {
    if (!id) {
      reset(contasBancariasModuleConfig.defaultValues);
      setLoading(false);
      return;
    }

    async function loadDetail() {
      setLoading(true);
      setLoadError(undefined);

      try {
        const detail = await contasBancariasModuleConfig.detail(id!);
        reset(contasBancariasModuleConfig.toFormValues(detail));
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Falha ao carregar conta bancaria.');
      } finally {
        setLoading(false);
      }
    }

    void loadDetail();
  }, [id, reset]);

  const resumo = useMemo(
    () => ({
      nome: watchedValues.nome?.trim() || 'Conta principal',
      banco: getBankLabel(watchedValues.banco),
      tipoConta: getAccountTypeLabel(watchedValues.tipoConta),
      identificacao: getAccountIdentifier(watchedValues.agencia, watchedValues.numeroConta),
      saldoInicial: formatCurrencyBRL(watchedValues.saldoInicial ?? 0),
      dataSaldoInicial: watchedValues.dataSaldoInicial ? formatDateBR(watchedValues.dataSaldoInicial) : 'Sem data definida',
      limiteCompartilhado:
        watchedValues.limiteCartoesCompartilhado === null
          ? 'Nao configurado'
          : formatCurrencyBRL(watchedValues.limiteCartoesCompartilhado),
      ativo: Boolean(watchedValues.ativo)
    }),
    [watchedValues]
  );

  async function onSubmit(values: ContaBancariaPayload) {
    setSubmitError(undefined);

    try {
      if (id) {
        await contasBancariasModuleConfig.update(id, values);
      } else {
        await contasBancariasModuleConfig.create(values);
      }

      navigate(contasBancariasModuleConfig.routeBase);
    } catch (error) {
      const apiError = error as AxiosError<ApiErrorResponse>;
      const validationErrors = apiError.response?.data?.errors;

      if (validationErrors) {
        applyServerValidationErrors(validationErrors, (field, message) =>
          setError(field as keyof ContaBancariaPayload, {
            type: 'server',
            message
          })
        );
        return;
      }

      setSubmitError(error instanceof Error ? error.message : 'Falha ao salvar conta bancaria.');
    }
  }

  function handleSharedLimitToggle(enabled: boolean) {
    setValue('limiteCartoesCompartilhado', enabled ? watchedValues.limiteCartoesCompartilhado ?? 0 : null, {
      shouldValidate: true,
      shouldDirty: true
    });
  }

  if (loading) {
    return <PageState state="loading" title="Carregando conta bancaria" />;
  }

  if (loadError) {
    return <PageState state="error" title="Falha ao carregar conta bancaria" subtitle={loadError} />;
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-8 2xl:gap-10">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-on-surface-variant">
            <span>Contas</span>
            <span>/</span>
            <span className="text-primary">{id ? 'Editar cadastro' : 'Novo cadastro'}</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-on-surface sm:text-5xl">Cadastro de Conta Bancaria</h1>
            <p className="max-w-4xl text-sm leading-6 text-on-surface-variant sm:text-base">
              Configure os parametros da conta sem alterar integracoes nem contratos do modulo de cadastros.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(contasBancariasModuleConfig.routeBase)}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] px-5 py-3 text-sm font-bold text-on-surface transition hover:border-white/15 hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="contas-bancarias-form"
            disabled={isSubmitting}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-black text-[#062412] shadow-[0_18px_40px_rgba(63,255,139,0.18)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Salvando...' : id ? 'Salvar alteracoes' : 'Salvar conta'}
          </button>
        </div>
      </section>

      <form
        id="contas-bancarias-form"
        onSubmit={handleSubmit(onSubmit)}
        className="grid w-full min-w-0 gap-8 xl:grid-cols-[minmax(0,1.58fr)_minmax(360px,0.78fr)] 2xl:gap-10 2xl:grid-cols-[minmax(0,1.66fr)_minmax(380px,0.8fr)]"
      >
        <section className="min-w-0 space-y-6">
          <section className="rounded-[32px] border border-white/8 bg-[linear-gradient(140deg,rgba(24,24,24,0.98),rgba(9,9,9,0.96))] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.34)] sm:p-8 2xl:p-10">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/8 pb-4">
                <span className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary">
                  <BankOutlined />
                </span>
                <div>
                  <h2 className="text-xl font-black text-on-surface">Dados Identificadores</h2>
                  <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                    Defina nome, banco, agencia e numero da conta que sera usada no fluxo financeiro.
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="nome" className="px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                    Nome da conta
                  </label>
                  <Controller
                    control={control}
                    name="nome"
                    render={({ field }) => (
                      <input
                        {...field}
                        id="nome"
                        aria-label="Nome da conta"
                        value={field.value ?? ''}
                        placeholder="Ex: Conta Corrente Principal"
                        className="h-14 w-full rounded-2xl border border-white/8 bg-surface-container px-4 text-sm font-medium text-on-surface outline-none transition placeholder:text-on-surface-variant/45 focus:border-primary/25"
                      />
                    )}
                  />
                  {errors.nome ? <p className="px-1 text-xs font-bold text-red-300">{errors.nome.message}</p> : null}
                </div>

                <div className="space-y-2">
                  <label htmlFor="banco" className="px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                    Banco
                  </label>
                  <Controller
                    control={control}
                    name="banco"
                    render={({ field }) => (
                      <>
                        <input
                          {...field}
                          id="banco"
                          aria-label="Banco"
                          list="contas-bancarias-bank-suggestions"
                          value={field.value ?? ''}
                          placeholder="Selecione a instituicao"
                          className="h-14 w-full rounded-2xl border border-white/8 bg-surface-container px-4 text-sm font-medium text-on-surface outline-none transition placeholder:text-on-surface-variant/45 focus:border-primary/25"
                        />
                        <datalist id="contas-bancarias-bank-suggestions">
                          {bankSuggestions.map((option) => (
                            <option key={option} value={option} />
                          ))}
                        </datalist>
                      </>
                    )}
                  />
                  {errors.banco ? <p className="px-1 text-xs font-bold text-red-300">{errors.banco.message}</p> : null}
                </div>

                <div className="space-y-2">
                  <label htmlFor="agencia" className="px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                    Agencia
                  </label>
                  <Controller
                    control={control}
                    name="agencia"
                    render={({ field }) => (
                      <input
                        {...field}
                        id="agencia"
                        aria-label="Agencia"
                        value={field.value ?? ''}
                        placeholder="0000"
                        className="h-14 w-full rounded-2xl border border-white/8 bg-surface-container px-4 text-sm font-medium text-on-surface outline-none transition placeholder:text-on-surface-variant/45 focus:border-primary/25"
                      />
                    )}
                  />
                  {errors.agencia ? <p className="px-1 text-xs font-bold text-red-300">{errors.agencia.message}</p> : null}
                </div>

                <div className="space-y-2">
                  <label htmlFor="numeroConta" className="px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                    Numero da conta
                  </label>
                  <Controller
                    control={control}
                    name="numeroConta"
                    render={({ field }) => (
                      <input
                        {...field}
                        id="numeroConta"
                        aria-label="Numero da conta"
                        value={field.value ?? ''}
                        placeholder="00000-0"
                        className="h-14 w-full rounded-2xl border border-white/8 bg-surface-container px-4 text-sm font-medium text-on-surface outline-none transition placeholder:text-on-surface-variant/45 focus:border-primary/25"
                      />
                    )}
                  />
                  {errors.numeroConta ? <p className="px-1 text-xs font-bold text-red-300">{errors.numeroConta.message}</p> : null}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-white/8 bg-surface-container-low p-6 shadow-[0_28px_80px_rgba(0,0,0,0.28)] sm:p-8 2xl:p-10">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/8 pb-4">
                <span className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary">
                  <CreditCardOutlined />
                </span>
                <div>
                  <h2 className="text-xl font-black text-on-surface">Parametros Financeiros</h2>
                  <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                    Configure tipo da conta, saldo inicial, data-base e disponibilidade operacional.
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <label className="px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Tipo da conta</label>
                  <Controller
                    control={control}
                    name="tipoConta"
                    render={({ field }) => (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                          {accountTypeSuggestions.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => field.onChange(option)}
                              className={`min-h-12 rounded-xl px-3 text-xs font-black uppercase tracking-[0.16em] transition ${
                                field.value === option
                                  ? 'border border-primary/30 bg-primary/10 text-primary'
                                  : 'border border-white/8 bg-surface-container text-on-surface-variant hover:text-on-surface'
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>

                        <input
                          list="contas-bancarias-type-suggestions"
                          aria-label="Tipo da conta"
                          value={field.value ?? ''}
                          onChange={(event) => field.onChange(event.target.value)}
                          placeholder="Defina ou selecione o tipo"
                          className="h-14 w-full rounded-2xl border border-white/8 bg-surface-container px-4 text-sm font-medium text-on-surface outline-none transition placeholder:text-on-surface-variant/45 focus:border-primary/25"
                        />
                        <datalist id="contas-bancarias-type-suggestions">
                          {accountTypeSuggestions.map((option) => (
                            <option key={option} value={option} />
                          ))}
                        </datalist>
                      </div>
                    )}
                  />
                  {errors.tipoConta ? <p className="px-1 text-xs font-bold text-red-300">{errors.tipoConta.message}</p> : null}
                </div>

                <div className="space-y-2">
                  <span className="px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Status da conta</span>
                  <Controller
                    control={control}
                    name="ativo"
                    render={({ field }) => (
                      <label className="flex min-h-[56px] cursor-pointer items-center justify-between rounded-2xl border border-white/8 bg-surface-container px-4">
                        <span className={`text-sm font-bold ${field.value ? 'text-primary' : 'text-on-surface-variant'}`}>
                          {getStatusLabel(Boolean(field.value))}
                        </span>
                        <span className="relative inline-flex h-7 w-14 items-center rounded-full bg-white/[0.08]">
                          <input
                            type="checkbox"
                            checked={Boolean(field.value)}
                            onChange={(event) => field.onChange(event.target.checked)}
                            className="peer sr-only"
                          />
                          <span className="absolute inset-0 rounded-full bg-white/[0.06] transition peer-checked:bg-primary/30" />
                          <span className="absolute left-1 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-7 peer-checked:bg-primary" />
                        </span>
                      </label>
                    )}
                  />
                  {errors.ativo ? <p className="px-1 text-xs font-bold text-red-300">{errors.ativo.message}</p> : null}
                </div>

                <div className="space-y-2">
                  <label htmlFor="saldoInicial" className="px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                    Saldo inicial
                  </label>
                  <Controller
                    control={control}
                    name="saldoInicial"
                    render={({ field }) => (
                      <CurrencyInput
                        id="saldoInicial"
                        aria-label="Saldo inicial"
                        value={typeof field.value === 'number' ? field.value : 0}
                        onChange={(value) => field.onChange(value ?? 0)}
                        placeholder="R$ 0,00"
                        className="h-14 rounded-2xl border border-white/8 bg-surface-container px-4 text-sm font-medium text-on-surface outline-none transition placeholder:text-on-surface-variant/45 focus:border-primary/25"
                      />
                    )}
                  />
                  {errors.saldoInicial ? <p className="px-1 text-xs font-bold text-red-300">{errors.saldoInicial.message}</p> : null}
                </div>

                <div className="space-y-2">
                  <label htmlFor="dataSaldoInicial" className="px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                    Data do saldo inicial
                  </label>
                  <Controller
                    control={control}
                    name="dataSaldoInicial"
                    render={({ field }) => (
                      <input
                        {...field}
                        id="dataSaldoInicial"
                        type="date"
                        aria-label="Data do saldo inicial"
                        value={field.value ?? ''}
                        className="h-14 w-full rounded-2xl border border-white/8 bg-surface-container px-4 text-sm font-medium text-on-surface outline-none transition focus:border-primary/25"
                      />
                    )}
                  />
                  {errors.dataSaldoInicial ? (
                    <p className="px-1 text-xs font-bold text-red-300">{errors.dataSaldoInicial.message}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        </section>

        <div className="min-w-0 space-y-6">
          <section className="rounded-[28px] border border-white/8 bg-surface-container-low p-6 shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="mt-1 rounded-2xl border border-primary/20 bg-primary/12 p-3 text-primary">
                  <CreditCardOutlined />
                </span>
                <div>
                  <h2 className="text-lg font-black text-on-surface">Limite Compartilhado</h2>
                  <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                    Controle o pool de limite usado pelos cartoes vinculados a esta conta bancaria.
                  </p>
                </div>
              </div>

              <label className="inline-flex cursor-pointer items-center gap-3">
                <span className={`text-xs font-bold uppercase tracking-[0.2em] ${sharedLimitEnabled ? 'text-primary' : 'text-on-surface-variant'}`}>
                  {sharedLimitEnabled ? 'Ativo' : 'Inativo'}
                </span>
                <span className="relative inline-flex h-8 w-16 items-center rounded-full bg-white/[0.08]">
                  <input
                    type="checkbox"
                    checked={sharedLimitEnabled}
                    onChange={(event) => handleSharedLimitToggle(event.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="absolute inset-0 rounded-full bg-white/[0.06] transition peer-checked:bg-primary/30" />
                  <span className="absolute left-1 h-6 w-6 rounded-full bg-white transition peer-checked:translate-x-8 peer-checked:bg-primary" />
                </span>
              </label>
            </div>

            <div className="mt-6 rounded-[24px] border border-white/6 bg-white/[0.03] p-5">
              {sharedLimitEnabled ? (
                <div className="space-y-2">
                  <label className="px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                    Limite compartilhado
                  </label>
                  <Controller
                    control={control}
                    name="limiteCartoesCompartilhado"
                    render={({ field }) => (
                      <CurrencyInput
                        aria-label="Limite compartilhado"
                        value={typeof field.value === 'number' ? field.value : null}
                        onChange={(value) => field.onChange(value)}
                        placeholder="R$ 0,00"
                        className="h-14 rounded-2xl border border-white/8 bg-surface-container px-4 text-sm font-medium text-on-surface outline-none transition placeholder:text-on-surface-variant/45 focus:border-primary/25"
                      />
                    )}
                  />
                  {errors.limiteCartoesCompartilhado ? (
                    <p className="px-1 text-xs font-bold text-red-300">{errors.limiteCartoesCompartilhado.message}</p>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm leading-6 text-on-surface-variant">
                  Quando desligado, os cartoes vinculados nao usam pool compartilhado de limite nesta conta.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/8 bg-surface-container-low p-6 shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
            <div className="flex items-start gap-3">
              <span className="mt-1 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-on-surface">
                <BankOutlined />
              </span>
              <div>
                <h2 className="text-lg font-black text-on-surface">Resumo Operacional</h2>
                <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                  Confira como o cadastro sera exibido nas leituras de saldo, pagamentos e conciliacao.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Conta</p>
                <p className="mt-2 text-sm font-black text-on-surface">{resumo.nome}</p>
                <p className="mt-1 text-xs text-on-surface-variant">{resumo.identificacao}</p>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Banco</span>
                <span className="text-sm font-bold text-on-surface">{resumo.banco}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Tipo</span>
                <span className="text-sm font-bold text-on-surface">{resumo.tipoConta}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Saldo inicial</span>
                <span className="text-sm font-bold text-primary">{resumo.saldoInicial}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Data base</span>
                <span className="text-sm font-bold text-on-surface">{resumo.dataSaldoInicial}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Limite</span>
                <span className="text-sm font-bold text-on-surface">{resumo.limiteCompartilhado}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Status</span>
                <span className={`text-sm font-bold ${resumo.ativo ? 'text-primary' : 'text-on-surface-variant'}`}>
                  {getStatusLabel(resumo.ativo)}
                </span>
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[28px] border border-white/8 bg-[radial-gradient(circle_at_top_right,rgba(63,255,139,0.12),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-primary">
                <SafetyCertificateOutlined />
                Dica de seguranca
              </div>
              <h2 className="mt-5 text-xl font-black text-on-surface">Conexao Segura</h2>
              <p className="mt-3 text-sm leading-6 text-on-surface-variant">
                O cadastro bancario fica protegido no mesmo fluxo de autenticacao e validacao usado pelo restante do painel.
              </p>
            </div>
          </section>

          {submitError ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/8 px-4 py-3 text-sm font-bold text-red-300">
              {submitError}
            </div>
          ) : null}
        </div>
      </form>
    </div>
  );
}

export default ContasBancariasFormPage;

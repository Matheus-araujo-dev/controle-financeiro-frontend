import { useCallback, useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AxiosError } from 'axios';

import { applyServerValidationErrors } from '../../../services/forms/applyServerValidationErrors';
import type { ApiErrorResponse } from '../../../types/api';
import type {
  FinanceiroModuleConfig,
  FinanceiroFormValues
} from '../module-config';
import { calculateValorLiquido, resolveFormaPagamentoBehavior } from '../module-config';
import { financialAccountFormSchema } from '../schemas';
import { formatMonthYearBR } from '../../../shared/date';
import { extractCardInvoicePreview, type CardInvoicePreview } from './card-invoice';

export function normalizeRecurringFormValues(values: FinanceiroFormValues): FinanceiroFormValues {
  if (!values.ehRecorrente || values.quantidadeParcelas === 1) {
    return values;
  }

  return {
    ...values,
    quantidadeParcelas: 1
  };
}

type FinancialAccountFormOptions = {
  afterSave?: (entityId: string, detail: unknown) => Promise<void>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useFinancialAccountForm(config: FinanceiroModuleConfig<any, any, any>, options: FinancialAccountFormOptions = {}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(Boolean(id));
  const [errorMessage, setErrorMessage] = useState<string>();
  const [detailStatus, setDetailStatus] = useState<string>();
  const [actionLoading, setActionLoading] = useState(false);
  const [cardInvoicePreview, setCardInvoicePreview] = useState<CardInvoicePreview>();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors, isSubmitting, isValid, touchedFields }
  } = useForm<FinanceiroFormValues>({
    resolver: zodResolver(financialAccountFormSchema),
    defaultValues: normalizeRecurringFormValues(config.defaultValues),
    mode: 'onChange'
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'rateios'
  });

  const [
    valorOriginal,
    valorDesconto,
    valorJuros,
    valorMulta,
    quantidadeParcelas,
    rateios,
    formaPagamentoId,
    origemCompraPlanejadaIdValue,
    ehRecorrente,
    recorrenciaDataInicio,
    dataEmissao,
    dataVencimento,
    recorrenciaTipoDia,
    recorrenciaDiaOrdemMensal
  ] = useWatch({
    control,
    name: [
      'valorOriginal',
      'valorDesconto',
      'valorJuros',
      'valorMulta',
      'quantidadeParcelas',
      'rateios',
      'formaPagamentoId',
      'origemCompraPlanejadaId',
      'ehRecorrente',
      'recorrenciaDataInicio',
      'dataEmissao',
      'dataVencimento',
      'recorrenciaTipoDia',
      'recorrenciaDiaOrdemMensal'
    ]
  });
  const watchedValues = useMemo(() => ({
    valorOriginal,
    valorDesconto,
    valorJuros,
    valorMulta,
    quantidadeParcelas,
    rateios: rateios ?? [],
    formaPagamentoId,
    origemCompraPlanejadaId: origemCompraPlanejadaIdValue,
    ehRecorrente,
    recorrenciaDataInicio,
    dataEmissao,
    dataVencimento,
    recorrenciaTipoDia,
    recorrenciaDiaOrdemMensal
  }) as FinanceiroFormValues, [
    valorOriginal,
    valorDesconto,
    valorJuros,
    valorMulta,
    quantidadeParcelas,
    rateios,
    formaPagamentoId,
    origemCompraPlanejadaIdValue,
    ehRecorrente,
    recorrenciaDataInicio,
    dataEmissao,
    dataVencimento,
    recorrenciaTipoDia,
    recorrenciaDiaOrdemMensal
  ]);

  const {
    data: pessoaOptions = [],
    isLoading: pessoaOptionsLoading,
    error: pessoaOptionsError,
    refetch: refetchPessoaOptions
  } = useQuery({
    queryKey: ['financeiro-form-options', config.key, 'pessoas'],
    queryFn: config.loadPessoaOptions
  });
  const {
    data: formaPagamentoOptions = [],
    isLoading: formaPagamentoOptionsLoading,
    error: formaPagamentoOptionsError,
    refetch: refetchFormaPagamentoOptions
  } = useQuery({
    queryKey: ['financeiro-form-options', config.key, 'formas-pagamento'],
    queryFn: config.loadFormaPagamentoOptions
  });
  const {
    data: contaBancariaOptions = [],
    isLoading: contaBancariaOptionsLoading,
    error: contaBancariaOptionsError,
    refetch: refetchContaBancariaOptions
  } = useQuery({
    queryKey: ['financeiro-form-options', config.key, 'contas-bancarias'],
    queryFn: config.loadContaBancariaOptions
  });
  const {
    data: cartaoOptions = [],
    isLoading: cartaoOptionsLoading,
    error: cartaoOptionsError,
    refetch: refetchCartaoOptions
  } = useQuery({
    queryKey: ['financeiro-form-options', config.key, 'cartoes'],
    queryFn: config.loadCartaoOptions
  });
  const {
    data: rateioOptions = [],
    isLoading: rateioOptionsLoading,
    error: rateioOptionsError,
    refetch: refetchRateioOptions
  } = useQuery({
    queryKey: ['financeiro-form-options', config.key, 'rateios'],
    queryFn: config.loadRateioOptions
  });

  const optionsLoading = pessoaOptionsLoading || formaPagamentoOptionsLoading || contaBancariaOptionsLoading || cartaoOptionsLoading || rateioOptionsLoading;
  const optionsError = pessoaOptionsError ?? formaPagamentoOptionsError ?? contaBancariaOptionsError ?? cartaoOptionsError ?? rateioOptionsError;

  const valorLiquido = useMemo(() => calculateValorLiquido(watchedValues), [watchedValues]);
  const totalRateios = useMemo(
    () => (watchedValues.rateios.length === 1 ? valorLiquido : watchedValues.rateios.reduce((total, item) => total + (Number(item.valor) || 0), 0)),
    [valorLiquido, watchedValues.rateios]
  );
  const formaPagamentoBehavior = useMemo(
    () => resolveFormaPagamentoBehavior(watchedValues.formaPagamentoId, formaPagamentoOptions),
    [watchedValues.formaPagamentoId, formaPagamentoOptions]
  );
  const origemCompraPlanejadaId = useMemo(
    () => watchedValues.origemCompraPlanejadaId?.trim(),
    [watchedValues.origemCompraPlanejadaId]
  );
  const exibeRecorrencia = watchedValues.ehRecorrente;
  const canEdit = detailStatus !== 'LIQUIDADA' && detailStatus !== 'CANCELADA';

  const recurringStartDatePreview = useMemo(
    () => (watchedValues.recorrenciaDataInicio ? formatMonthYearBR(watchedValues.recorrenciaDataInicio) : null),
    [watchedValues.recorrenciaDataInicio]
  );

  const automaticRecurringStartPreview = useMemo(() => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(watchedValues.dataEmissao);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (!year || !month) return null;
    const nextMonth = new Date(year, month, 1);
    return `${String(nextMonth.getMonth() + 1).padStart(2, '0')}/${nextMonth.getFullYear()}`;
  }, [watchedValues.dataEmissao]);

  useEffect(() => {
    if (id || !watchedValues.ehRecorrente || watchedValues.recorrenciaTipoDia !== 'DiaFixo') return;
    if (touchedFields.recorrenciaDiaOrdemMensal) return;
    const [year, month, day] = watchedValues.dataVencimento.split('-').map(Number);
    if (!year || !month || !day || watchedValues.recorrenciaDiaOrdemMensal === day) return;
    setValue('recorrenciaDiaOrdemMensal', day, { shouldValidate: true, shouldDirty: false, shouldTouch: false });
  }, [id, setValue, touchedFields.recorrenciaDiaOrdemMensal, watchedValues.dataVencimento, watchedValues.ehRecorrente, watchedValues.recorrenciaDiaOrdemMensal, watchedValues.recorrenciaTipoDia]);

  useEffect(() => {
    if (!watchedValues.ehRecorrente || watchedValues.quantidadeParcelas === 1) return;
    setValue('quantidadeParcelas', 1, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
  }, [setValue, watchedValues.ehRecorrente, watchedValues.quantidadeParcelas]);

  // With a single rateio line, its value always equals the net amount, so keep it in sync automatically.
  useEffect(() => {
    if (watchedValues.rateios.length !== 1) return;
    const current = Number(watchedValues.rateios[0]?.valor) || 0;
    if (Math.abs(current - valorLiquido) < 0.005) return;
    setValue('rateios.0.valor', valorLiquido, { shouldValidate: true, shouldDirty: true });
  }, [setValue, valorLiquido, watchedValues.rateios]);


  useEffect(() => {
    const entityId = id;
    if (!entityId) {
      if (!config.resolveCreateDefaults) reset(normalizeRecurringFormValues(config.defaultValues));
      setDetailStatus(undefined);
      setCardInvoicePreview(undefined);
      return;
    }

    async function loadDetail(currentId: string) {
      setLoading(true);
      setErrorMessage(undefined);
      try {
        const detail = await config.detail(currentId);
        reset(normalizeRecurringFormValues(config.toFormValues(detail)));
        setDetailStatus(detail.statusCodigo);
        setCardInvoicePreview(extractCardInvoicePreview(detail));
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar o lançamento.');
      } finally {
        setLoading(false);
      }
    }
    void loadDetail(entityId);
  }, [config, id, reset]);

  useEffect(() => {
    if (id || !config.resolveCreateDefaults) return;
    let isCancelled = false;
    async function loadCreateDefaults() {
      setLoading(true);
      setErrorMessage(undefined);
      try {
        const prefill = await config.resolveCreateDefaults?.(searchParams);
        if (isCancelled) return;
        setCardInvoicePreview(undefined);
        reset(normalizeRecurringFormValues({ ...config.defaultValues, ...prefill }));
      } catch (error) {
        if (isCancelled) return;
        setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar o lançamento.');
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }
    void loadCreateDefaults();
    return () => { isCancelled = true; };
  }, [config, id, reset, searchParams]);

  const onCancel = useCallback(() => navigate(config.routeBase), [navigate, config.routeBase]);

  const onSubmit = useCallback(
    async (values: FinanceiroFormValues) => {
      try {
        if (id) {
          const updated = await config.update(id, values);
          await options.afterSave?.(id, updated);
          navigate(config.routeBase);
          return;
        } else {
          const created = await config.create(values);
          if (created?.id) {
            await options.afterSave?.(created.id, created);
          }
          const preview = extractCardInvoicePreview(created);
          if (created?.id && preview) {
            navigate(`${config.routeBase}/${created.id}`);
            return;
          }
        }
        navigate(config.routeBase);
      } catch (error) {
        const apiError = error as AxiosError<ApiErrorResponse>;
        const validationErrors = apiError.response?.data?.errors;
        if (validationErrors) {
          applyServerValidationErrors(validationErrors, (field, message) =>
            setError(field as keyof FinanceiroFormValues, { type: 'server', message })
          );
          return;
        }
        setErrorMessage(error instanceof Error ? error.message : 'Falha ao salvar o lançamento.');
      }
    },
    [id, config, navigate, setError, options]
  );

  const cancelar = useCallback(async () => {
    if (!id || !config.cancelar) return;
    setActionLoading(true);
    setErrorMessage(undefined);
    try {
      await config.cancelar(id);
      navigate(config.routeBase);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao cancelar o lançamento.');
    } finally {
      setActionLoading(false);
    }
  }, [id, config, navigate]);

  const estornar = useCallback(async () => {
    if (!id || !config.estornar) return;
    setActionLoading(true);
    setErrorMessage(undefined);
    try {
      await config.estornar(id);
      const detail = await config.detail(id);
      reset(config.toFormValues(detail));
      setDetailStatus(detail.statusCodigo);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao estornar o lançamento.');
    } finally {
      setActionLoading(false);
    }
  }, [id, config, reset]);

  const reloadPessoaOptions = useCallback(async () => {
    await refetchPessoaOptions();
  }, [refetchPessoaOptions]);

  const reloadFormaPagamentoOptions = useCallback(async () => {
    await refetchFormaPagamentoOptions();
  }, [refetchFormaPagamentoOptions]);

  const reloadContaBancariaOptions = useCallback(async () => {
    await refetchContaBancariaOptions();
  }, [refetchContaBancariaOptions]);

  const reloadCartaoOptions = useCallback(async () => {
    await refetchCartaoOptions();
  }, [refetchCartaoOptions]);

  const reloadRateioOptions = useCallback(async () => {
    await refetchRateioOptions();
  }, [refetchRateioOptions]);

  return {
    id,
    control,
    handleSubmit,
    errors,
    isSubmitting,
    isValid,
    fields,
    append,
    remove,
    watchedValues,
    valorLiquido,
    totalRateios,
    formaPagamentoBehavior,
    origemCompraPlanejadaId,
    exibeRecorrencia,
    canEdit,
    recurringStartDatePreview,
    automaticRecurringStartPreview,
    loading: loading || optionsLoading,
    errorMessage: errorMessage ?? (optionsError instanceof Error ? optionsError.message : undefined),
    detailStatus,
    actionLoading,
    cardInvoicePreview,
    pessoaOptions,
    formaPagamentoOptions,
    contaBancariaOptions,
    cartaoOptions,
    rateioOptions,
    setValue,
    onCancel,
    onSubmit,
    cancelar,
    estornar,
    reloadPessoaOptions,
    reloadFormaPagamentoOptions,
    reloadContaBancariaOptions,
    reloadCartaoOptions,
    reloadRateioOptions
  };
}

export type FinancialAccountFormApi = ReturnType<typeof useFinancialAccountForm>;

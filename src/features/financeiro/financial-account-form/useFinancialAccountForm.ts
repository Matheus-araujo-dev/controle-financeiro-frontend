import { useCallback, useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AxiosError } from 'axios';

import { applyServerValidationErrors } from '../../../services/forms/applyServerValidationErrors';
import type { ApiErrorResponse } from '../../../types/api';
import type {
  FinanceiroModuleConfig,
  FinanceiroFormValues,
  FormaPagamentoOption,
  SelectOption
} from '../module-config';
import type { ComboBoxOption } from '../../../components/forms/ComboBox';
import { calculateValorLiquido, resolveFormaPagamentoBehavior } from '../module-config';
import { financialAccountFormSchema } from '../schemas';
import { formatMonthYearBR } from '../../../shared/date';
import { extractCardInvoicePreview, type CardInvoicePreview } from './card-invoice';
import type { CancelarContaPagarPayload } from '../../../types/financeiro';

export function normalizeRecurringFormValues(values: FinanceiroFormValues): FinanceiroFormValues {
  if (!values.ehRecorrente || values.quantidadeParcelas === 1) {
    return values;
  }

  return {
    ...values,
    quantidadeParcelas: 1
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useFinancialAccountForm(config: FinanceiroModuleConfig<any, any, any>) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(Boolean(id));
  const [errorMessage, setErrorMessage] = useState<string>();
  const [pessoaOptions, setPessoaOptions] = useState<SelectOption[]>([]);
  const [responsavelOptions, setResponsavelOptions] = useState<SelectOption[]>([]);
  const [formaPagamentoOptions, setFormaPagamentoOptions] = useState<FormaPagamentoOption[]>([]);
  const [contaBancariaOptions, setContaBancariaOptions] = useState<SelectOption[]>([]);
  const [cartaoOptions, setCartaoOptions] = useState<SelectOption[]>([]);
  const [rateioOptions, setRateioOptions] = useState<ComboBoxOption[]>([]);
  const [detailStatus, setDetailStatus] = useState<string>();
  const [actionLoading, setActionLoading] = useState(false);
  const [cardInvoicePreview, setCardInvoicePreview] = useState<CardInvoicePreview>();
  const [grupoParcelamentoId, setGrupoParcelamentoId] = useState<string | null | undefined>(undefined);
  const [numeroParcela, setNumeroParcela] = useState<number | undefined>(undefined);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
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

  const watchedValues = watch();
  const watchedRateios = useWatch({ control, name: 'rateios' }) ?? [];

  const valorLiquido = useMemo(() => calculateValorLiquido(watchedValues), [watchedValues]);
  const totalRateios = useMemo(
    () => (watchedRateios.length === 1 ? valorLiquido : watchedRateios.reduce((total, item) => total + (Number(item?.valor) || 0), 0)),
    [valorLiquido, watchedRateios]
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
    if (watchedRateios.length !== 1) return;
    const current = Number(watchedRateios[0]?.valor) || 0;
    if (Math.abs(current - valorLiquido) < 0.005) return;
    setValue('rateios.0.valor', valorLiquido, { shouldValidate: true, shouldDirty: true });
  }, [setValue, valorLiquido, watchedRateios]);

  useEffect(() => {
    if (!formaPagamentoBehavior.ehCartao) return;
    if (!watchedValues.dataCompra) {
      setValue('dataCompra', new Date().toISOString().split('T')[0], { shouldValidate: false, shouldDirty: false });
    }
  }, [formaPagamentoBehavior.ehCartao, setValue]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    async function loadOptions() {
      const [pessoas, responsaveis, formas, contas, cartoes, rateios] = await Promise.all([
        config.loadPessoaOptions(),
        config.loadResponsavelOptions(),
        config.loadFormaPagamentoOptions(),
        config.loadContaBancariaOptions(),
        config.loadCartaoOptions(),
        config.loadRateioOptions()
      ]);
      setPessoaOptions(pessoas);
      setResponsavelOptions(responsaveis);
      setFormaPagamentoOptions(formas);
      setContaBancariaOptions(contas);
      setCartaoOptions(cartoes);
      setRateioOptions(rateios);
    }
    void loadOptions();
  }, [config]);

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
        if ('grupoParcelamentoId' in detail) {
          setGrupoParcelamentoId((detail as Record<string, unknown>).grupoParcelamentoId as string | null);
          setNumeroParcela((detail as Record<string, unknown>).numeroParcela as number | undefined);
        }
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
          await config.update(id, values);
          navigate(config.routeBase);
          return;
        } else {
          const created = await config.create(values);
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
    [id, config, navigate, setError]
  );

  const cancelar = useCallback(async (options?: CancelarContaPagarPayload) => {
    if (!id || !config.cancelar) return;
    setActionLoading(true);
    setErrorMessage(undefined);
    try {
      await config.cancelar(id, options);
      navigate(config.routeBase);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao cancelar o lancamento.');
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
    const options = await config.loadPessoaOptions();
    setPessoaOptions(options);
  }, [config]);

  const reloadResponsavelOptions = useCallback(async () => {
    const options = await config.loadResponsavelOptions();
    setResponsavelOptions(options);
  }, [config]);

  const reloadFormaPagamentoOptions = useCallback(async () => {
    const options = await config.loadFormaPagamentoOptions();
    setFormaPagamentoOptions(options);
  }, [config]);

  const reloadContaBancariaOptions = useCallback(async () => {
    const options = await config.loadContaBancariaOptions();
    setContaBancariaOptions(options);
  }, [config]);

  const reloadCartaoOptions = useCallback(async () => {
    const options = await config.loadCartaoOptions();
    setCartaoOptions(options);
  }, [config]);

  const reloadRateioOptions = useCallback(async () => {
    const options = await config.loadRateioOptions();
    setRateioOptions(options);
  }, [config]);

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
    loading,
    errorMessage,
    detailStatus,
    actionLoading,
    cardInvoicePreview,
    pessoaOptions,
    responsavelOptions,
    formaPagamentoOptions,
    contaBancariaOptions,
    cartaoOptions,
    rateioOptions,
    setValue,
    onCancel,
    onSubmit,
    grupoParcelamentoId,
    numeroParcela,
    cancelar,
    estornar,
    reloadPessoaOptions,
    reloadResponsavelOptions,
    reloadFormaPagamentoOptions,
    reloadContaBancariaOptions,
    reloadCartaoOptions,
    reloadRateioOptions
  };
}

export type FinancialAccountFormApi = ReturnType<typeof useFinancialAccountForm>;

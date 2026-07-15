import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AxiosError } from 'axios';

import { applyServerValidationErrors } from '../../../services/forms/applyServerValidationErrors';
import { isFaturaIndisponivelError, getApiErrorMessage } from '../../../services/http/api-error';
import type { ApiErrorResponse } from '../../../types/api';
import type {
  FinanceiroModuleConfig,
  FinanceiroFormValues,
  FormaPagamentoOption,
  RateioOption,
  SelectOption
} from '../module-config';
import { calculateValorLiquido, resolveFormaPagamentoBehavior } from '../module-config';
import { financialAccountFormSchema } from '../schemas';
import { formatMonthYearBR } from '../../../shared/date';
import { extractCardInvoicePreview, type CardInvoicePreview } from './card-invoice';
import type { CancelarContaPagarPayload, ContaVinculadaResumo } from '../../../types/financeiro';
import type { DuplicateItemSummary } from '../financial-rules';
import { financeiroApi } from '../../../services/http/financeiro-api';
import { contasPagarModuleConfig, contasReceberModuleConfig } from '../module-config';
import { formatCurrencyBRL } from '../../../shared/currency';
import { formatDateBR } from '../../../shared/date';

export type PropagationDiff = {
  key: 'descricao' | 'dataVencimento' | 'valor';
  label: string;
  from: string;
  to: string;
};

export type PendingPropagation = {
  diff: PropagationDiff[];
  applyValues: Pick<FinanceiroFormValues, 'descricao' | 'dataVencimento' | 'valorOriginal' | 'valorDesconto' | 'valorJuros' | 'valorMulta'>;
};
import type { QuickLaunchInitialValues } from '../../../components/quick-launch/QuickLaunchButton';

function buildPropagationDiff(orig: FinanceiroFormValues, next: FinanceiroFormValues): PropagationDiff[] {
  const diff: PropagationDiff[] = [];
  if (orig.descricao !== next.descricao) {
    diff.push({ key: 'descricao', label: 'Descrição', from: orig.descricao, to: next.descricao });
  }
  if (orig.dataVencimento !== next.dataVencimento) {
    diff.push({ key: 'dataVencimento', label: 'Vencimento', from: formatDateBR(orig.dataVencimento), to: formatDateBR(next.dataVencimento) });
  }
  const origLiquido = calculateValorLiquido(orig);
  const nextLiquido = calculateValorLiquido(next);
  if (Math.abs(origLiquido - nextLiquido) >= 0.005) {
    diff.push({ key: 'valor', label: 'Valor líquido', from: formatCurrencyBRL(origLiquido), to: formatCurrencyBRL(nextLiquido) });
  }
  return diff;
}

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
  const [rateioOptions, setRateioOptions] = useState<RateioOption[]>([]);
  const [detailStatus, setDetailStatus] = useState<string>();
  const [detailFaturaStatus, setDetailFaturaStatus] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [cardInvoicePreview, setCardInvoicePreview] = useState<CardInvoicePreview>();
  const [grupoParcelamentoId, setGrupoParcelamentoId] = useState<string | null | undefined>(undefined);
  const [numeroParcela, setNumeroParcela] = useState<number | undefined>(undefined);
  const [pendingValues, setPendingValues] = useState<FinanceiroFormValues | null>(null);
  const [pendingDuplicateValues, setPendingDuplicateValues] = useState<FinanceiroFormValues | null>(null);
  const [duplicateItems, setDuplicateItems] = useState<DuplicateItemSummary[] | null>(null);
  const [pendingFaturaIndisponivelValues, setPendingFaturaIndisponivelValues] = useState<FinanceiroFormValues | null>(null);
  const [faturaIndisponivelMessage, setFaturaIndisponivelMessage] = useState<string | null>(null);
  const [gerarReembolso, setGerarReembolso] = useState(false);
  const [reembolsoData, setReembolsoData] = useState<QuickLaunchInitialValues | null>(null);
  const [contaVinculada, setContaVinculada] = useState<ContaVinculadaResumo | null>(null);
  const [pendingPropagation, setPendingPropagation] = useState<PendingPropagation | null>(null);
  const originalValuesRef = useRef<FinanceiroFormValues | null>(null);

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
  const faturaLocked = detailFaturaStatus === 'FECHADA' || detailFaturaStatus === 'PAGA';
  const canEdit = detailStatus !== 'LIQUIDADA' && detailStatus !== 'CANCELADA' && !faturaLocked;
  const canAlterarFuturas = Boolean(id) && exibeRecorrencia && canEdit && Boolean(config.alterarFuturas);

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
    const today = new Date().toISOString().split('T')[0];
    if (!watchedValues.dataCompra) {
      setValue('dataCompra', today, { shouldValidate: false, shouldDirty: false });
    }
    // Para cartão, sincroniza dataVencimento = dataCompra (o sistema usará a fatura correspondente)
    const dataRef = watchedValues.dataCompra || today;
    if (watchedValues.dataVencimento !== dataRef) {
      setValue('dataVencimento', dataRef, { shouldValidate: true, shouldDirty: false });
    }
  }, [formaPagamentoBehavior.ehCartao, watchedValues.dataCompra, setValue]); // eslint-disable-line react-hooks/exhaustive-deps

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
      setDetailFaturaStatus(null);
      setCardInvoicePreview(undefined);
      return;
    }

    async function loadDetail(currentId: string) {
      setLoading(true);
      setErrorMessage(undefined);
      try {
        const detail = await config.detail(currentId);
        const formValues = normalizeRecurringFormValues(config.toFormValues(detail));
        reset(formValues);
        originalValuesRef.current = formValues;
        setDetailStatus(detail.statusCodigo);
        setDetailFaturaStatus('statusFaturaCartao' in detail ? (detail as Record<string, unknown>).statusFaturaCartao as string | null : null);
        setCardInvoicePreview(extractCardInvoicePreview(detail));
        setContaVinculada((detail as Record<string, unknown>).contaVinculada as ContaVinculadaResumo | null ?? null);
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

  const doCreate = useCallback(
    async (values: FinanceiroFormValues, opts?: { forcarProximaFatura?: boolean }) => {
      try {
        const created = await config.create(values, opts);
        if (gerarReembolso) {
          const isPagar = config.key === 'contas-pagar';
          const detail = created as Record<string, unknown>;
          setReembolsoData({
            tipo: isPagar ? 'receber' : 'pagar',
            pessoaId: (isPagar ? detail.recebedorId : detail.pagadorId) as string | undefined,
            responsavelId: (isPagar ? detail.responsavelCompraId : detail.responsavelId) as string | undefined,
            valor: (detail.valorLiquido as number) ?? 0,
            dataVencimento: (detail.dataVencimento as string) ?? undefined,
            descricao: `Reembolso: ${(detail.descricao as string) ?? ''}`,
            contaVinculadaOrigemId: (detail.id as string) ?? undefined
          });
          return;
        }
        const preview = extractCardInvoicePreview(created);
        if (created?.id && preview) {
          navigate(`${config.routeBase}/${created.id}`);
          return;
        }
        navigate(config.routeBase);
      } catch (error) {
        if (isFaturaIndisponivelError(error)) {
          setPendingFaturaIndisponivelValues(values);
          setFaturaIndisponivelMessage(getApiErrorMessage(error));
          return;
        }
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
    [config, gerarReembolso, navigate, setError]
  );

  const clearReembolso = useCallback(() => {
    setReembolsoData(null);
    navigate(config.routeBase);
  }, [navigate, config.routeBase]);

  const onSubmit = useCallback(
    async (values: FinanceiroFormValues) => {
      if (id && canAlterarFuturas) {
        setPendingValues(values);
        return;
      }
      try {
        if (id) {
          await config.update(id, values);
          const orig = originalValuesRef.current;
          if (contaVinculada && orig) {
            const diff = buildPropagationDiff(orig, values);
            if (diff.length > 0) {
              setPendingPropagation({
                diff,
                applyValues: {
                  descricao: values.descricao,
                  dataVencimento: values.dataVencimento,
                  valorOriginal: values.valorOriginal,
                  valorDesconto: values.valorDesconto,
                  valorJuros: values.valorJuros,
                  valorMulta: values.valorMulta
                }
              });
              return;
            }
          }
          navigate(config.routeBase);
          return;
        } else {
          if (config.checkDuplicate) {
            const duplicates = await config.checkDuplicate(values.descricao, values.dataVencimento, values.pessoaId, values.valorOriginal);
            if (duplicates) {
              setDuplicateItems(duplicates);
              setPendingDuplicateValues(values);
              return;
            }
          }
          await doCreate(values);
        }
      } catch (error) {
        if (isFaturaIndisponivelError(error)) {
          setPendingFaturaIndisponivelValues(values);
          setFaturaIndisponivelMessage(getApiErrorMessage(error));
          return;
        }
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
    [id, canAlterarFuturas, config, navigate, setError, doCreate]
  );

  const createDespiteDuplicate = useCallback(async () => {
    if (!pendingDuplicateValues) return;
    const values = pendingDuplicateValues;
    setPendingDuplicateValues(null);
    setDuplicateItems(null);
    await doCreate(values);
  }, [pendingDuplicateValues, doCreate]);

  const cancelDuplicateCheck = useCallback(() => {
    setPendingDuplicateValues(null);
    setDuplicateItems(null);
  }, []);

  const handleSaveError = useCallback(
    (error: unknown) => {
      const apiError = error as AxiosError<ApiErrorResponse>;
      const validationErrors = apiError.response?.data?.errors;
      if (validationErrors) {
        applyServerValidationErrors(validationErrors, (field, message) =>
          setError(field as keyof FinanceiroFormValues, { type: 'server', message })
        );
      } else {
        setErrorMessage(error instanceof Error ? error.message : 'Falha ao salvar o lançamento.');
      }
      setPendingValues(null);
    },
    [setError]
  );

  const confirmarProximaFatura = useCallback(async () => {
    if (!pendingFaturaIndisponivelValues) return;
    const values = pendingFaturaIndisponivelValues;
    setPendingFaturaIndisponivelValues(null);
    setFaturaIndisponivelMessage(null);
    if (id) {
      try {
        await config.update(id, values, { forcarProximaFatura: true });
        navigate(config.routeBase);
      } catch (error) {
        handleSaveError(error);
      }
    } else {
      await doCreate(values, { forcarProximaFatura: true });
    }
  }, [pendingFaturaIndisponivelValues, id, config, navigate, doCreate, handleSaveError]);

  const cancelarFaturaIndisponivel = useCallback(() => {
    setPendingFaturaIndisponivelValues(null);
    setFaturaIndisponivelMessage(null);
  }, []);

  const onConfirmApenas = useCallback(async () => {
    if (!id || !pendingValues) return;
    try {
      await config.update(id, pendingValues);
      navigate(config.routeBase);
    } catch (error) {
      handleSaveError(error);
    }
  }, [id, pendingValues, config, navigate, handleSaveError]);

  const onConfirmAlterarFuturas = useCallback(async () => {
    if (!id || !pendingValues || !config.alterarFuturas) return;
    try {
      await config.alterarFuturas(id, pendingValues);
      navigate(config.routeBase);
    } catch (error) {
      handleSaveError(error);
    }
  }, [id, pendingValues, config, navigate, handleSaveError]);

  const clearPendingScope = useCallback(() => setPendingValues(null), []);

  const cancelar = useCallback(async (options?: CancelarContaPagarPayload & { cancelarContaVinculada?: boolean }) => {
    if (!id || !config.cancelar) return;
    setActionLoading(true);
    setErrorMessage(undefined);
    try {
      const { cancelarContaVinculada: cancelVinculada, ...cancelOptions } = options ?? {};
      await config.cancelar(id, cancelOptions);
      if (cancelVinculada && contaVinculada) {
        if (contaVinculada.tipo === 'Pagar') {
          await financeiroApi.contasPagar.cancelar(contaVinculada.id);
        } else {
          await financeiroApi.contasReceber.cancelar(contaVinculada.id);
        }
      }
      navigate(config.routeBase);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao cancelar o lançamento.');
    } finally {
      setActionLoading(false);
    }
  }, [id, config, contaVinculada, navigate]);

  const estornar = useCallback(async () => {
    if (!id || !config.estornar) return;
    setActionLoading(true);
    setErrorMessage(undefined);
    try {
      await config.estornar(id);
      const detail = await config.detail(id);
      reset(config.toFormValues(detail));
      setDetailStatus(detail.statusCodigo);
      setDetailFaturaStatus('statusFaturaCartao' in detail ? (detail as Record<string, unknown>).statusFaturaCartao as string | null : null);
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

  const propagarParaVinculada = useCallback(async () => {
    if (!contaVinculada || !pendingPropagation) return;
    setActionLoading(true);
    try {
      const isPagarVinculada = contaVinculada.tipo === 'Pagar';
      const vinculadaConfig = isPagarVinculada ? contasPagarModuleConfig : contasReceberModuleConfig;
      const vinculadaDet = await (isPagarVinculada
        ? financeiroApi.contasPagar.obterPorId(contaVinculada.id)
        : financeiroApi.contasReceber.obterPorId(contaVinculada.id));
      const vinculadaValues = vinculadaConfig.toFormValues(vinculadaDet as never);
      const mergedValues: FinanceiroFormValues = { ...vinculadaValues, ...pendingPropagation.applyValues };
      await vinculadaConfig.update(contaVinculada.id, mergedValues);
    } finally {
      setActionLoading(false);
    }
    setPendingPropagation(null);
    navigate(config.routeBase);
  }, [contaVinculada, pendingPropagation, navigate, config.routeBase]);

  const dismissPropagation = useCallback(() => {
    setPendingPropagation(null);
    navigate(config.routeBase);
  }, [navigate, config.routeBase]);

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
    canAlterarFuturas,
    recurringStartDatePreview,
    automaticRecurringStartPreview,
    loading,
    errorMessage,
    detailStatus,
    detailFaturaStatus,
    faturaLocked,
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
    pendingValues,
    onConfirmApenas,
    onConfirmAlterarFuturas,
    clearPendingScope,
    grupoParcelamentoId,
    numeroParcela,
    cancelar,
    estornar,
    pendingDuplicateValues,
    duplicateItems,
    createDespiteDuplicate,
    cancelDuplicateCheck,
    pendingFaturaIndisponivelValues,
    faturaIndisponivelMessage,
    confirmarProximaFatura,
    cancelarFaturaIndisponivel,
    reloadPessoaOptions,
    reloadResponsavelOptions,
    reloadFormaPagamentoOptions,
    reloadContaBancariaOptions,
    reloadCartaoOptions,
    reloadRateioOptions,
    gerarReembolso,
    setGerarReembolso,
    reembolsoData,
    clearReembolso,
    contaVinculada,
    pendingPropagation,
    propagarParaVinculada,
    dismissPropagation
  };
}

export type FinancialAccountFormApi = ReturnType<typeof useFinancialAccountForm>;

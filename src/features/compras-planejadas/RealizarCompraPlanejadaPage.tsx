import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { AxiosError } from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { DateInput } from '../../components/forms/DateInput';
import { ComboBox } from '../../components/forms/ComboBox';
import {
  FieldError,
  FormActionPanel,
  formFieldClass,
  formLabelClass,
  formTextAreaClass
} from '../../components/forms/FormPrimitives';
import { FormSection } from '../../components/layout';
import { PageState } from '../../components/states/PageState';
import { Button } from '../../components/ui/Button';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { comprasPlanejadasApi } from '../../services/http/compras-planejadas-api';
import { applyServerValidationErrors } from '../../services/forms/applyServerValidationErrors';
import { formatCurrencyBRL } from '../../shared/currency';
import { formatDateBR } from '../../shared/date';
import type { ApiErrorResponse } from '../../types/api';
import type { CartaoResumo, ContaBancariaResumo, FormaPagamentoResumo, PessoaResumo } from '../../types/cadastros';
import type { CompraPlanejadaDetalhe } from '../../types/compras-planejadas';
import { realizarCompraPlanejadaSchema } from './schemas';

type RealizarCompraPlanejadaFormValues = {
  dataCompra: string;
  dataVencimento: string;
  recebedorId: string;
  formaPagamentoId: string;
  cartaoId: string;
  contaBancariaId: string;
  quantidadeParcelas: number;
  numeroDocumento: string;
  descricao: string;
  observacao: string;
  formaEhCartao: boolean;
  formaBaixarAutomaticamente: boolean;
  compraParcelavel: boolean;
};

interface SelectOption {
  label: string;
  value: string;
}

interface FormaPagamentoOption extends SelectOption {
  ehCartao: boolean;
  baixarAutomaticamente: boolean;
}

interface CartaoOption extends SelectOption {
  diaFechamentoFatura: number;
  diaVencimentoFatura: number;
}

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function buildPessoaOption(item: PessoaResumo): SelectOption {
  return { label: item.nome, value: item.id };
}

function buildFormaPagamentoOption(item: FormaPagamentoResumo): FormaPagamentoOption {
  return {
    label: item.nome,
    value: item.id,
    ehCartao: item.ehCartao,
    baixarAutomaticamente: item.baixarAutomaticamente
  };
}

function buildContaBancariaOption(item: ContaBancariaResumo): SelectOption {
  return { label: `${item.nome} - ${item.banco}`, value: item.id };
}

function buildCartaoOption(item: CartaoResumo): CartaoOption {
  return {
    label: `${item.nome} - final ${item.numeroFinal}`,
    value: item.id,
    diaFechamentoFatura: item.diaFechamentoFatura,
    diaVencimentoFatura: item.diaVencimentoFatura
  };
}

function formatCompetenciaMes(data: string) {
  const [year, month] = data.split('-');
  return `${month}/${year}`;
}

function createSafeDate(year: number, month: number, day: number) {
  return new Date(year, month - 1, Math.min(day, new Date(year, month, 0).getDate()));
}

function toIsoDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function distribuirParcelas(valorTotal: number, quantidadeParcelas: number) {
  if (quantidadeParcelas < 1) return [];
  const totalEmCentavos = Math.round(valorTotal * 100);
  const baseEmCentavos = Math.floor(totalEmCentavos / quantidadeParcelas);
  const restanteEmCentavos = totalEmCentavos % quantidadeParcelas;
  return Array.from({ length: quantidadeParcelas }, (_, index) => {
    const centavos = baseEmCentavos + (index === quantidadeParcelas - 1 ? restanteEmCentavos : 0);
    return centavos / 100;
  });
}

function calcularCompetenciaFatura(dataCompra: string, diaFechamento: number, diaVencimento: number, parcelaIndex = 0) {
  const [year, month, day] = dataCompra.split('-').map(Number);
  if (!year || !month || !day) return null;
  const compra = new Date(year, month - 1 + parcelaIndex, day);
  let competenciaYear = compra.getFullYear();
  let competenciaMonth = compra.getMonth() + 1;
  if (compra.getDate() > diaFechamento) {
    const nextMonth = new Date(compra.getFullYear(), compra.getMonth() + 1, 1);
    competenciaYear = nextMonth.getFullYear();
    competenciaMonth = nextMonth.getMonth() + 1;
  }
  const fechamento = createSafeDate(competenciaYear, competenciaMonth, diaFechamento);
  let vencimento = createSafeDate(competenciaYear, competenciaMonth, diaVencimento);
  if (vencimento <= fechamento) {
    const nextMonth = new Date(competenciaYear, competenciaMonth, 1);
    vencimento = createSafeDate(nextMonth.getFullYear(), nextMonth.getMonth() + 1, diaVencimento);
  }
  return {
    competencia: `${competenciaYear}-${String(competenciaMonth).padStart(2, '0')}`,
    vencimento: toIsoDate(vencimento)
  };
}

export function RealizarCompraPlanejadaPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [detail, setDetail] = useState<CompraPlanejadaDetalhe | null>(null);
  const [pessoaOptions, setPessoaOptions] = useState<SelectOption[]>([]);
  const [formaPagamentoOptions, setFormaPagamentoOptions] = useState<FormaPagamentoOption[]>([]);
  const [contaBancariaOptions, setContaBancariaOptions] = useState<SelectOption[]>([]);
  const [cartaoOptions, setCartaoOptions] = useState<CartaoOption[]>([]);

  const {
    control,
    handleSubmit,
    setError,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting, isValid }
  } = useForm<RealizarCompraPlanejadaFormValues>({
    resolver: zodResolver(realizarCompraPlanejadaSchema),
    defaultValues: {
      dataCompra: getTodayIsoDate(),
      dataVencimento: '',
      recebedorId: '',
      formaPagamentoId: '',
      cartaoId: '',
      contaBancariaId: '',
      quantidadeParcelas: 1,
      numeroDocumento: '',
      descricao: '',
      observacao: '',
      formaEhCartao: false,
      formaBaixarAutomaticamente: false,
      compraParcelavel: false
    },
    mode: 'onChange'
  });

  const watchedValues = watch();
  const formaSelecionada = useMemo(
    () => formaPagamentoOptions.find((item) => item.value === watchedValues.formaPagamentoId) ?? null,
    [formaPagamentoOptions, watchedValues.formaPagamentoId]
  );
  const cartaoSelecionado = useMemo(
    () => cartaoOptions.find((item) => item.value === watchedValues.cartaoId) ?? null,
    [cartaoOptions, watchedValues.cartaoId]
  );
  const formaEhCartao = Boolean(formaSelecionada?.ehCartao);
  const formaBaixarAutomaticamente = Boolean(formaSelecionada?.baixarAutomaticamente && !formaSelecionada?.ehCartao);

  const previsaoParcelasCartao = useMemo(() => {
    if (!formaEhCartao || !cartaoSelecionado || !watchedValues.dataCompra) return [];

    const quantidade = Math.max(1, watchedValues.quantidadeParcelas || 1);
    const valoresParcelas = distribuirParcelas(detail?.valorEstimado ?? 0, quantidade);

    return Array.from({ length: quantidade }, (_, index) => {
      const competencia = calcularCompetenciaFatura(
        watchedValues.dataCompra,
        cartaoSelecionado.diaFechamentoFatura,
        cartaoSelecionado.diaVencimentoFatura,
        index
      );

      if (!competencia) return null;

      return {
        ...competencia,
        valorParcela: valoresParcelas[index] ?? 0
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null);
  }, [cartaoSelecionado, detail?.valorEstimado, formaEhCartao, watchedValues.dataCompra, watchedValues.quantidadeParcelas]);

  useEffect(() => {
    if (watchedValues.formaEhCartao !== formaEhCartao) {
      setValue('formaEhCartao', formaEhCartao, { shouldValidate: true, shouldDirty: false });
    }
    if (watchedValues.formaBaixarAutomaticamente !== formaBaixarAutomaticamente) {
      setValue('formaBaixarAutomaticamente', formaBaixarAutomaticamente, { shouldValidate: true, shouldDirty: false });
    }

    if (formaEhCartao) {
      if (watchedValues.contaBancariaId) setValue('contaBancariaId', '', { shouldValidate: true, shouldDirty: true });
      if (watchedValues.dataVencimento) setValue('dataVencimento', '', { shouldValidate: true, shouldDirty: true });
      if (watchedValues.quantidadeParcelas < 1) setValue('quantidadeParcelas', 1, { shouldValidate: true, shouldDirty: true });
      return;
    }

    if (watchedValues.cartaoId) setValue('cartaoId', '', { shouldValidate: true, shouldDirty: true });
    if (watchedValues.quantidadeParcelas !== 1) setValue('quantidadeParcelas', 1, { shouldValidate: true, shouldDirty: true });

    if (formaBaixarAutomaticamente) {
      setValue('dataVencimento', '', { shouldValidate: true, shouldDirty: true });
      return;
    }

    if (!watchedValues.dataVencimento && watchedValues.dataCompra) {
      setValue('dataVencimento', watchedValues.dataCompra, { shouldValidate: true, shouldDirty: false });
    }
  }, [
    formaBaixarAutomaticamente,
    formaEhCartao,
    setValue,
    watchedValues.dataCompra,
    watchedValues.dataVencimento,
    watchedValues.quantidadeParcelas,
    watchedValues.formaEhCartao,
    watchedValues.formaBaixarAutomaticamente,
    watchedValues.contaBancariaId,
    watchedValues.cartaoId
  ]);

  useEffect(() => {
    if (!detail) return;
    setValue('compraParcelavel', detail.parcelavel, { shouldValidate: true, shouldDirty: false });
  }, [detail, setValue]);

  useEffect(() => {
    if (!id) {
      setErrorMessage('Compra planejada não informada.');
      setLoading(false);
      return;
    }

    let isCancelled = false;
    async function load(compraId: string) {
      setLoading(true);
      setErrorMessage(undefined);
      try {
        const [compra, pessoas, formas, contas, cartoes] = await Promise.all([
          comprasPlanejadasApi.obterPorId(compraId),
          cadastrosApi.pessoas.listar({ page: 1, pageSize: 200, search: '', ativo: true }),
          cadastrosApi.formasPagamento.listar({ page: 1, pageSize: 200, search: '', ativo: true }),
          cadastrosApi.contasBancarias.listar({ page: 1, pageSize: 200, search: '', ativo: true }),
          cadastrosApi.cartoes.listar({ page: 1, pageSize: 200, search: '', ativo: true })
        ]);

        if (isCancelled) return;
        setDetail(compra);
        setPessoaOptions(pessoas.items.map(buildPessoaOption));
        setFormaPagamentoOptions(formas.items.map(buildFormaPagamentoOption));
        setContaBancariaOptions(contas.items.map(buildContaBancariaOption));
        setCartaoOptions(cartoes.items.map(buildCartaoOption));

        reset({
          dataCompra: compra.dataDesejada ? compra.dataDesejada.split('T')[0] : getTodayIsoDate(),
          dataVencimento: compra.dataDesejada ? compra.dataDesejada.split('T')[0] : '',
          recebedorId: '',
          formaPagamentoId: '',
          cartaoId: '',
          contaBancariaId: '',
          quantidadeParcelas: compra.parcelavel ? (compra.quantidadeParcelasDesejada ?? 1) : 1,
          numeroDocumento: '',
          descricao: compra.titulo,
          observacao: compra.observacao ?? '',
          formaEhCartao: false,
          formaBaixarAutomaticamente: false,
          compraParcelavel: compra.parcelavel
        });
      } catch (error) {
        if (isCancelled) return;
        setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar a compra planejada.');
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }
    void load(id);
    return () => {
      isCancelled = true;
    };
  }, [id, reset]);

  async function onSubmit(values: RealizarCompraPlanejadaFormValues) {
    if (!id) return;
    setErrorMessage(undefined);
    try {
      await comprasPlanejadasApi.realizar(id, {
        dataCompra: values.dataCompra,
        dataVencimento: values.dataVencimento || null,
        recebedorId: values.recebedorId,
        formaPagamentoId: values.formaPagamentoId,
        cartaoId: values.cartaoId || null,
        contaBancariaId: values.contaBancariaId || null,
        quantidadeParcelas: values.quantidadeParcelas,
        numeroDocumento: values.numeroDocumento,
        descricao: values.descricao,
        observacao: values.observacao
      });
      navigate('/compras-planejadas');
    } catch (error) {
      const apiError = error as AxiosError<ApiErrorResponse>;
      const validationErrors = apiError.response?.data?.errors;
      if (validationErrors) {
        applyServerValidationErrors(validationErrors, (field, message) =>
          setError(field as keyof RealizarCompraPlanejadaFormValues, { type: 'server', message })
        );
        setErrorMessage(apiError.response?.data?.message);
        return;
      }
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao realizar a compra planejada.');
    }
  }

  if (loading) return <PageState state="loading" title="Carregando execução" />;
  if (errorMessage && !detail) return <PageState state="error" title="Erro ao carregar" subtitle={errorMessage} />;
  if (!detail) return <PageState state="empty" title="Não encontrado" subtitle="O registro solicitado não existe mais." />;

  const jaRealizada = detail.status !== 'Planejada' || detail.contaPagarGeradaId;

  return (
    <div className="mx-auto max-w-7xl space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-end">
        <div className="flex items-center gap-4 rounded-3xl border border-outline-variant/15 bg-surface-container-low p-4 shadow-inner">
          <div className="rounded-full bg-primary/10 p-3">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              stars
            </span>
          </div>
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Item Planejado</span>
            <span className="block font-headline text-xl font-bold text-primary">{detail.titulo}</span>
          </div>
        </div>
      </div>

      {jaRealizada ? (
        <FormSection className="items-center text-center" icon={<span className="material-symbols-outlined text-3xl">check_circle</span>}>
          <div className="space-y-4">
            <div>
              <h2 className="font-headline text-2xl font-bold">Compra já realizada</h2>
              <p className="mx-auto mt-2 max-w-md text-on-surface-variant">
                Esta compra planejada já foi convertida em lançamento financeiro e não pode ser realizada novamente.
              </p>
            </div>
            {detail.contaPagarGeradaId ? (
              <Button type="button" onClick={() => navigate(`/contas-pagar/${detail.contaPagarGeradaId}`)} className="mt-4">
                Abrir conta a pagar gerada
              </Button>
            ) : null}
          </div>
        </FormSection>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-7 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-7">
            <FormSection title="Realizar Compra" eyebrow="Passo 1" icon={<span className="material-symbols-outlined text-2xl">shopping_bag</span>}>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className={formLabelClass}>Data da Compra</label>
                  <Controller
                    control={control}
                    name="dataCompra"
                    render={({ field }) => <DateInput ariaLabel="Data da Compra" value={field.value} onChange={field.onChange} />}
                  />
                  <FieldError message={errors.dataCompra?.message} />
                </div>

                <div className="space-y-2">
                  <label className={formLabelClass}>Forma de Pagamento</label>
                  <Controller
                    control={control}
                    name="formaPagamentoId"
                    render={({ field }) => (
                      <ComboBox
                        aria-label="Forma de Pagamento"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        options={formaPagamentoOptions}
                        placeholder="Selecione..."
                      />
                    )}
                  />
                  <FieldError message={errors.formaPagamentoId?.message} />
                </div>
              </div>
            </FormSection>

            <FormSection
              title="Liquidação e Beneficiário"
              eyebrow="Passo 2"
              icon={<span className="material-symbols-outlined text-2xl">account_balance_wallet</span>}
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {formaEhCartao ? (
                  <>
                    <div className="space-y-2">
                      <label className={formLabelClass}>Cartão</label>
                      <Controller
                        control={control}
                        name="cartaoId"
                        render={({ field }) => (
                          <ComboBox
                            aria-label="Cartão"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            options={cartaoOptions}
                            placeholder="Selecione o cartão..."
                          />
                        )}
                      />
                      <FieldError message={errors.cartaoId?.message} />
                    </div>

                    <div className="space-y-2">
                      <label className={formLabelClass}>Parcelas</label>
                      <Controller
                        control={control}
                        name="quantidadeParcelas"
                        render={({ field }) => (
                          <input
                            {...field}
                            aria-label="Parcelas"
                            type="number"
                            min={1}
                            max={detail.parcelavel ? 48 : 1}
                            onChange={(event) => field.onChange(Number(event.target.value))}
                            className={formFieldClass}
                          />
                        )}
                      />
                      <FieldError message={errors.quantidadeParcelas?.message} />
                    </div>
                  </>
                ) : null}

                {!formaEhCartao && formaBaixarAutomaticamente ? (
                  <div className="space-y-2 md:col-span-2">
                    <label className={formLabelClass}>Conta para Baixa Automática</label>
                    <Controller
                      control={control}
                      name="contaBancariaId"
                      render={({ field }) => (
                        <ComboBox
                          aria-label="Conta para Baixa Automática"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          options={contaBancariaOptions}
                          placeholder="Selecione a conta..."
                        />
                      )}
                    />
                    <FieldError message={errors.contaBancariaId?.message} />
                  </div>
                ) : null}

                {!formaEhCartao && !formaBaixarAutomaticamente ? (
                  <div className="space-y-2 md:col-span-2">
                    <label className={formLabelClass}>Vencimento da Conta</label>
                    <Controller
                      control={control}
                      name="dataVencimento"
                      render={({ field }) => <DateInput ariaLabel="Vencimento da Conta" value={field.value} onChange={field.onChange} />}
                    />
                    <FieldError message={errors.dataVencimento?.message} />
                  </div>
                ) : null}

                <div className="space-y-2 md:col-span-2">
                  <label className={formLabelClass}>Beneficiário / Recebedor</label>
                  <Controller
                    control={control}
                    name="recebedorId"
                    render={({ field }) => (
                      <ComboBox
                        aria-label="Beneficiário / Recebedor"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        options={pessoaOptions}
                        placeholder="Selecione quem recebeu..."
                      />
                    )}
                  />
                  <FieldError message={errors.recebedorId?.message} />
                </div>
              </div>
            </FormSection>

            <FormSection title="Dados Financeiros" eyebrow="Passo 3" icon={<span className="material-symbols-outlined text-2xl">receipt_long</span>}>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className={formLabelClass}>Descrição Financeira</label>
                  <Controller
                    control={control}
                    name="descricao"
                    render={({ field }) => <input {...field} aria-label="Descrição Financeira" className={formFieldClass} placeholder="Descreva a transação..." />}
                  />
                  <FieldError message={errors.descricao?.message} />
                </div>

                <div className="space-y-2">
                  <label className={formLabelClass}>Nº Documento</label>
                  <Controller
                    control={control}
                    name="numeroDocumento"
                    render={({ field }) => <input {...field} aria-label="Nº Documento" className={formFieldClass} placeholder="NF-e, Recibo, etc..." />}
                  />
                  <FieldError message={errors.numeroDocumento?.message} />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className={formLabelClass}>Observações Adicionais</label>
                  <Controller
                    control={control}
                    name="observacao"
                    render={({ field }) => (
                      <textarea
                        {...field}
                        aria-label="Observações Adicionais"
                        rows={3}
                        className={formTextAreaClass}
                        placeholder="Notas internas ou detalhes técnicos..."
                      />
                    )}
                  />
                  <FieldError message={errors.observacao?.message} />
                </div>
              </div>
            </FormSection>

            {formaEhCartao && cartaoSelecionado && previsaoParcelasCartao.length > 0 ? (
              <FormSection
                title="Planejamento da Fatura"
                eyebrow={`Fechamento dia ${cartaoSelecionado.diaFechamentoFatura} - Vencimento dia ${cartaoSelecionado.diaVencimentoFatura}`}
                icon={<span className="material-symbols-outlined text-2xl">calendar_month</span>}
              >
                <div className="mb-6 flex justify-end">
                  <span className="rounded-full bg-primary/20 px-3 py-1 text-[10px] font-black uppercase text-primary">{previsaoParcelasCartao.length}X Parcelado</span>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {previsaoParcelasCartao.map((item, index) => (
                    <div key={index} className="rounded-2xl border border-white/5 bg-surface-container p-4 shadow-sm transition-all hover:border-primary/30">
                      <div className="mb-2 flex items-start justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{index + 1}ª Parcela</span>
                        <span className="font-black text-primary">{formatCurrencyBRL(item.valorParcela)}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
                          <span className="material-symbols-outlined text-[14px] text-on-surface-variant">calendar_month</span>
                          {formatCompetenciaMes(item.competencia)}
                        </div>
                        <div className="ml-5 text-[10px] text-on-surface-variant">Venc: {formatDateBR(item.vencimento)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </FormSection>
            ) : null}
          </div>

          <div className="lg:col-span-5">
            <FormActionPanel
              title="Pronto para confirmar?"
              eyebrow="Checkout financeiro"
              icon={<span className="material-symbols-outlined font-bold text-2xl">check_circle</span>}
              items={[
                { label: 'Compra', value: detail.titulo },
                { label: 'Valor Planejado', value: formatCurrencyBRL(detail.valorEstimado), accent: true },
                { label: 'Responsável', value: detail.responsavelNome },
                { label: 'Fluxo Gerado', value: formaEhCartao ? 'Fatura cartão' : formaBaixarAutomaticamente ? 'Baixa imediata' : 'Conta a pagar' }
              ]}
              submitLabel="Confirmar Compra"
              submitDisabled={!isValid || isSubmitting}
              submitting={isSubmitting}
              error={errorMessage}
              onCancel={() => navigate('/compras-planejadas')}
            />
          </div>
        </form>
      )}
    </div>
  );
}

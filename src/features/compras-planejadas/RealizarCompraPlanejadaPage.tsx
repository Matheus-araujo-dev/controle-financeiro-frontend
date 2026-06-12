import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { AxiosError } from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { PageState } from '../../components/states/PageState';
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
    label: `${item.nome} • final ${item.numeroFinal}`,
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
  }, [formaBaixarAutomaticamente, formaEhCartao, setValue, watchedValues.dataCompra, watchedValues.dataVencimento, watchedValues.quantidadeParcelas, watchedValues.formaEhCartao, watchedValues.formaBaixarAutomaticamente, watchedValues.contaBancariaId, watchedValues.cartaoId]);

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
          dataCompra: (compra.dataDesejada ? compra.dataDesejada.split('T')[0] : getTodayIsoDate()),
          dataVencimento: (compra.dataDesejada ? compra.dataDesejada.split('T')[0] : ''),
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
    return () => { isCancelled = true; };
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
    <>
      <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 text-on-surface-variant text-xs uppercase tracking-widest font-bold mb-2 font-['Inter']">
              <span>Planejamento</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-primary" style={{ textShadow: '0 0 10px rgba(63, 255, 139, 0.3)' }}>Efetivar Compra</span>
            </div>
            <h1 className="font-headline font-extrabold text-4xl text-on-background tracking-tighter">Realizar Compra</h1>
            <p className="text-on-surface-variant font-body text-lg mt-2 font-['Inter']">Converta sua intenção de compra em um registro financeiro real.</p>
          </div>
          <div className="flex items-center gap-4 bg-surface-container-low p-4 rounded-3xl border border-outline-variant/15 shadow-inner">
            <div className="bg-primary/10 p-3 rounded-full">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
            </div>
            <div>
              <span className="block text-[10px] text-on-surface-variant font-bold uppercase tracking-wider font-['Inter']">Item Planejado</span>
              <span className="block font-headline font-bold text-xl text-primary">{detail.titulo}</span>
            </div>
          </div>
        </div>

        {jaRealizada ? (
          <div className="bg-surface-container-low rounded-3xl p-8 border border-primary/20 flex flex-col items-center text-center space-y-4">
             <div className="w-16 h-16 bg-primary/10 flex items-center justify-center rounded-full text-primary">
               <span className="material-symbols-outlined text-4xl">check_circle</span>
             </div>
             <div>
               <h2 className="text-2xl font-headline font-bold">Compra já realizada</h2>
               <p className="text-on-surface-variant mt-2 max-w-md mx-auto font-['Inter']">
                 Esta compra planejada já foi convertida em lançamento financeiro e não pode ser realizada novamente.
               </p>
             </div>
             {detail.contaPagarGeradaId && (
               <button
                 onClick={() => navigate(`/contas-pagar/${detail.contaPagarGeradaId}`)}
                 className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl mt-4 hover:scale-[1.02] transition-all font-['Inter']"
               >
                 Abrir conta a pagar gerada
               </button>
             )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Purchase Form */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-surface-container rounded-[2rem] p-8 shadow-2xl relative overflow-hidden ring-1 ring-white/5 font-['Inter']">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Data da Compra */}
                    <div className="space-y-3">
                      <label className="font-label font-bold text-[11px] uppercase tracking-widest text-on-surface-variant ml-1">Data da Compra</label>
                      <Controller
                        control={control}
                        name="dataCompra"
                        render={({ field }) => (
                          <div className="relative group">
                            <input
                              {...field}
                              aria-label="Data da Compra"
                              className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-5 text-on-surface focus:ring-2 focus:ring-primary/40 transition-all outline-none [color-scheme:dark]"
                              type="date"
                            />
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none group-focus-within:text-primary transition-colors">calendar_today</span>
                          </div>
                        )}
                      />
                      {errors.dataCompra && <p className="text-error text-[10px] font-bold uppercase ml-1">{errors.dataCompra.message}</p>}
                    </div>

                    {/* Forma de Pagamento */}
                    <div className="space-y-3">
                      <label className="font-label font-bold text-[11px] uppercase tracking-widest text-on-surface-variant ml-1">Forma de Pagamento</label>
                      <Controller
                        control={control}
                        name="formaPagamentoId"
                        render={({ field }) => (
                          <div className="relative group">
                            <select
                              {...field}
                              aria-label="Forma de Pagamento"
                              className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-5 text-on-surface focus:ring-2 focus:ring-primary/40 transition-all outline-none appearance-none cursor-pointer"
                            >
                              <option value="">Selecione...</option>
                              {formaPagamentoOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none group-focus-within:text-primary transition-colors">expand_more</span>
                          </div>
                        )}
                      />
                      {errors.formaPagamentoId && <p className="text-error text-[10px] font-bold uppercase ml-1">{errors.formaPagamentoId.message}</p>}
                    </div>
                  </div>

                  {/* Contextual Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {formaEhCartao && (
                      <>
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                          <label className="font-label font-bold text-[11px] uppercase tracking-widest text-on-surface-variant ml-1">Cartão</label>
                          <Controller
                            control={control}
                            name="cartaoId"
                            render={({ field }) => (
                              <div className="relative group">
                                <select
                                  {...field}
                                  aria-label="Cartão"
                                  className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-5 text-on-surface focus:ring-2 focus:ring-primary/40 transition-all outline-none appearance-none cursor-pointer font-bold"
                                >
                                  <option value="">Selecione o cartão...</option>
                                  {cartaoOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none group-focus-within:text-primary transition-colors">credit_card</span>
                              </div>
                            )}
                          />
                        </div>
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                          <label className="font-label font-bold text-[11px] uppercase tracking-widest text-on-surface-variant ml-1">Parcelas</label>
                          <Controller
                            control={control}
                            name="quantidadeParcelas"
                            render={({ field }) => (
                              <input
                                {...field}
                                aria-label="Parcelas"
                                className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-5 text-on-surface focus:ring-2 focus:ring-primary/40 transition-all outline-none font-bold"
                                type="number"
                                min={1}
                                max={detail.parcelavel ? 48 : 1}
                                onChange={e => field.onChange(Number(e.target.value))}
                              />
                            )}
                          />
                        </div>
                      </>
                    )}

                    {!formaEhCartao && formaBaixarAutomaticamente && (
                      <div className="md:col-span-2 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="font-label font-bold text-[11px] uppercase tracking-widest text-on-surface-variant ml-1">Conta para Baixa Automática</label>
                        <Controller
                          control={control}
                          name="contaBancariaId"
                          render={({ field }) => (
                            <div className="relative group">
                              <select
                                {...field}
                                aria-label="Conta para Baixa Automática"
                                className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-5 text-on-surface focus:ring-2 focus:ring-primary/40 transition-all outline-none appearance-none cursor-pointer"
                              >
                                <option value="">Selecione a conta...</option>
                                {contaBancariaOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                              </select>
                              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none group-focus-within:text-primary transition-colors">account_balance</span>
                            </div>
                          )}
                        />
                      </div>
                    )}

                    {!formaEhCartao && !formaBaixarAutomaticamente && (
                      <div className="md:col-span-2 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="font-label font-bold text-[11px] uppercase tracking-widest text-on-surface-variant ml-1">Vencimento da Conta</label>
                        <Controller
                          control={control}
                          name="dataVencimento"
                          render={({ field }) => (
                            <div className="relative group">
                              <input
                                {...field}
                                aria-label="Vencimento da Conta"
                                className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-5 text-on-surface focus:ring-2 focus:ring-primary/40 transition-all outline-none [color-scheme:dark]"
                                type="date"
                              />
                              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none group-focus-within:text-primary transition-colors">pending_actions</span>
                            </div>
                          )}
                        />
                      </div>
                    )}
                  </div>

                  {/* Recebedor */}
                  <div className="space-y-3">
                    <label className="font-label font-bold text-[11px] uppercase tracking-widest text-on-surface-variant ml-1">Beneficiário / Recebedor</label>
                    <Controller
                      control={control}
                      name="recebedorId"
                      render={({ field }) => (
                        <div className="relative group">
                          <select
                            {...field}
                            aria-label="Beneficiário / Recebedor"
                            className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-5 text-on-surface focus:ring-2 focus:ring-primary/40 transition-all outline-none appearance-none cursor-pointer"
                          >
                            <option value="">Selecione quem recebeu...</option>
                            {pessoaOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none group-focus-within:text-primary transition-colors">person</span>
                        </div>
                      )}
                    />
                    {errors.recebedorId && <p className="text-error text-[10px] font-bold uppercase ml-1">{errors.recebedorId.message}</p>}
                  </div>

                  {/* Descrição & Documento */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="font-label font-bold text-[11px] uppercase tracking-widest text-on-surface-variant ml-1">Descrição Financeira</label>
                      <Controller
                        control={control}
                        name="descricao"
                        render={({ field }) => (
                          <input
                            {...field}
                            aria-label="Descrição Financeira"
                            className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-5 text-on-surface focus:ring-2 focus:ring-primary/40 transition-all outline-none"
                            placeholder="Descreva a transação..."
                          />
                        )}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="font-label font-bold text-[11px] uppercase tracking-widest text-on-surface-variant ml-1">Nº Documento</label>
                      <Controller
                        control={control}
                        name="numeroDocumento"
                        render={({ field }) => (
                          <input
                            {...field}
                            aria-label="Nº Documento"
                            className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-5 text-on-surface focus:ring-2 focus:ring-primary/40 transition-all outline-none"
                            placeholder="NF-e, Recibo, etc..."
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="font-label font-bold text-[11px] uppercase tracking-widest text-on-surface-variant ml-1">Observações Adicionais</label>
                    <Controller
                      control={control}
                      name="observacao"
                      render={({ field }) => (
                        <textarea
                          {...field}
                          aria-label="Observações Adicionais"
                          className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-5 text-on-surface focus:ring-2 focus:ring-primary/40 transition-all outline-none resize-none"
                          rows={3}
                          placeholder="Notas internas ou detalhes técnicos..."
                        />
                      )}
                    />
                  </div>

                  {errorMessage && (
                    <div className="p-4 bg-error/10 border border-error/20 rounded-2xl flex items-center gap-3 text-error animate-in zoom-in-95 duration-300">
                      <span className="material-symbols-outlined text-sm">warning</span>
                      <p className="text-xs font-bold uppercase tracking-tight">{errorMessage}</p>
                    </div>
                  )}
                </form>
              </div>

              {/* Installment Planner (Card Only) */}
              {formaEhCartao && cartaoSelecionado && previsaoParcelasCartao.length > 0 && (
                <section className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant/10 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-500 font-['Inter']">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="font-headline font-bold text-lg">Planejamento da Fatura</h3>
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mt-1">
                        Fechamento dia {cartaoSelecionado.diaFechamentoFatura} • Vencimento dia {cartaoSelecionado.diaVencimentoFatura}
                      </p>
                    </div>
                    <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase">{previsaoParcelasCartao.length}X Parcelado</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {previsaoParcelasCartao.map((item, index) => (
                      <div key={index} className="bg-surface-container p-4 rounded-2xl border border-white/5 shadow-sm group hover:border-primary/30 transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{index + 1}ª Parcela</span>
                          <span className="text-primary font-black">{formatCurrencyBRL(item.valorParcela)}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-on-surface text-xs font-bold">
                            <span className="material-symbols-outlined text-[14px] text-on-surface-variant">calendar_month</span>
                            {formatCompetenciaMes(item.competencia)}
                          </div>
                          <div className="text-[10px] text-on-surface-variant ml-5">
                            Venc: {formatDateBR(item.vencimento)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right Column / Summary */}
            <div className="space-y-8 lg:sticky lg:top-28 h-fit font-['Inter']">
              <section className="bg-surface-container rounded-[2rem] p-8 shadow-2xl border border-outline-variant/15 ring-1 ring-white/5">
                <h3 className="font-headline font-bold text-xl mb-6 tracking-tight text-white uppercase">Checkout Financeiro</h3>

                <div className="space-y-4 mb-10">
                  <div className="flex justify-between items-center py-4 px-2 border-b border-outline-variant/10">
                    <span className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">Valor Planejado</span>
                    <span className="text-on-surface font-headline font-bold text-lg">{formatCurrencyBRL(detail.valorEstimado)}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 px-2 border-b border-outline-variant/10">
                    <span className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">Responsável</span>
                    <span className="text-on-surface font-bold text-sm">{detail.responsavelNome}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 px-2">
                    <span className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">Fluxo Gerado</span>
                    <span className="bg-primary/10 text-primary text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-tighter ring-1 ring-primary/20">
                      {formaEhCartao ? 'FATURA CARTÃO' : formaBaixarAutomaticamente ? 'BAIXA IMEDIATA' : 'CONTA A PAGAR'}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={handleSubmit(onSubmit)}
                    disabled={!isValid || isSubmitting}
                    className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-black py-5 rounded-2xl shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-tighter text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined font-bold">check_circle</span>
                    {isSubmitting ? 'EFETIVANDO...' : 'CONFIRMAR COMPRA'}
                  </button>
                  <button
                    onClick={() => navigate('/compras-planejadas')}
                    className="w-full text-on-surface-variant font-bold py-3 hover:text-white transition-all text-[11px] uppercase tracking-[0.2em]"
                  >
                    CANCELAR
                  </button>
                </div>
              </section>

              {/* Decorative Visual Insight */}
              <div className="bg-[#1a1a1a]/40 backdrop-blur-xl rounded-[2rem] overflow-hidden shadow-2xl border border-outline-variant/10 ring-1 ring-white/5">
                <div className="h-40 w-full overflow-hidden relative">
                  <img
                    alt="Workstation"
                    className="w-full h-full object-cover brightness-75 group-hover:scale-110 transition-transform duration-1000"
                    src="https://images.unsplash.com/photo-1547082299-de196ea013d6?q=80&w=2070&auto=format&fit=crop"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent"></div>
                </div>
                <div className="p-8 -mt-8 relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-primary text-lg">analytics</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-primary">Inteligência Preditiva</span>
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Esta compra será alocada na conta gerencial <span className="text-white font-bold">{detail.contaGerencialDescricao}</span>.
                    Certifique-se de que os dados financeiros estão corretos antes da confirmação.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

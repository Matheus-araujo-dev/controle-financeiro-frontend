import { useCallback, useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { DateInput } from '../../components/forms/DateInput';
import { ComboBox, type ComboBoxOption } from '../../components/forms/ComboBox';
import { PageState } from '../../components/states/PageState';
import { FormSection } from '../../components/layout';
import { CurrencyInput } from '../../shared/CurrencyInput';
import { filterContaGerencialLancavel, mapContaGerencialSelectOptions } from '../../shared/conta-gerencial';
import { formatCurrencyBRL } from '../../shared/currency';
import { formatDateBR } from '../../shared/date';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { comprasPlanejadasApi } from '../../services/http/compras-planejadas-api';
import { applyServerValidationErrors } from '../../services/forms/applyServerValidationErrors';
import type { ApiErrorResponse } from '../../types/api';
import type { CompraPlanejadaPayload } from '../../types/compras-planejadas';
import { compraPlanejadaSchema } from './schemas';
import { QuickAddContaGerencialModal } from '../cadastros/quick-add/QuickAddContaGerencialModal';
import { QuickAddPessoaModal } from '../cadastros/quick-add/QuickAddPessoaModal';

type SelectOption = ComboBoxOption;

const prioridadeOptions: SelectOption[] = [
  { label: 'Baixa', value: 'Baixa' },
  { label: 'Média (Padrão)', value: 'Media' },
  { label: 'Alta / Crítica', value: 'Alta' }
];

const statusOptions: SelectOption[] = [
  { label: 'Planejada', value: 'Planejada' },
  { label: 'Comprada', value: 'Comprada' },
  { label: 'Cancelada', value: 'Cancelada' }
];

const defaultValues: CompraPlanejadaPayload = {
  titulo: '',
  descricao: '',
  valorEstimado: 0,
  dataDesejada: '',
  prioridade: 'Media',
  status: 'Planejada',
  parcelavel: false,
  quantidadeParcelasDesejada: null,
  contaGerencialId: '',
  responsavelId: '',
  link: '',
  observacao: ''
};

const labelClassName = 'block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1';
const fieldClassName =
  'cf-form-control w-full bg-surface-container border-none rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/40 transition-all font-medium placeholder:text-outline/40 outline-none';
const textAreaClassName = `${fieldClassName} resize-none`;

export function NovaCompraPlanejadaPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const [submitError, setSubmitError] = useState<string>();
  const [contaGerencialOptions, setContaGerencialOptions] = useState<SelectOption[]>([]);
  const [responsavelOptions, setResponsavelOptions] = useState<SelectOption[]>([]);
  const [contaGerencialModalOpen, setContaGerencialModalOpen] = useState(false);
  const [responsavelModalOpen, setResponsavelModalOpen] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting, isValid }
  } = useForm<CompraPlanejadaPayload>({
    resolver: zodResolver(compraPlanejadaSchema),
    defaultValues,
    mode: 'onChange'
  });

  const watchedValues = useWatch({ control });
  const parcelavel = Boolean(watchedValues.parcelavel);

  const reloadContaGerencialOptions = useCallback(async () => {
    const response = await cadastrosApi.contasGerenciais.listar({
      page: 1,
      pageSize: 100,
      search: '',
      tipo: 'Despesa',
      aceitaLancamentos: true
    });
    setContaGerencialOptions(mapContaGerencialSelectOptions(filterContaGerencialLancavel(response.items)));
  }, []);

  const reloadResponsavelOptions = useCallback(async () => {
    const response = await cadastrosApi.pessoas.listar({ page: 1, pageSize: 100, search: '', ativo: true });
    setResponsavelOptions(response.items.map((item) => ({ label: item.nome, value: item.id })));
  }, []);

  useEffect(() => {
    async function loadOptions() {
      setLoading(true);
      setLoadError(undefined);
      try {
        const [contasGerenciais, responsaveis] = await Promise.all([
          cadastrosApi.contasGerenciais.listar({
            page: 1,
            pageSize: 100,
            search: '',
            tipo: 'Despesa',
            aceitaLancamentos: true
          }),
          cadastrosApi.pessoas.listar({
            page: 1,
            pageSize: 100,
            search: '',
            ativo: true
          })
        ]);

        setContaGerencialOptions(mapContaGerencialSelectOptions(filterContaGerencialLancavel(contasGerenciais.items)));
        setResponsavelOptions(responsaveis.items.map((item) => ({ label: item.nome, value: item.id })));
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Falha ao carregar dados de apoio.');
      } finally {
        setLoading(false);
      }
    }

    void loadOptions();
  }, []);

  const resumo = useMemo(
    () => ({
      titulo: watchedValues.titulo?.trim() || 'Nova compra planejada',
      valor: watchedValues.valorEstimado ?? 0,
      dataDesejada: watchedValues.dataDesejada ? formatDateBR(watchedValues.dataDesejada) : 'Sem data definida',
      parcelas: watchedValues.parcelavel
        ? watchedValues.quantidadeParcelasDesejada ?? 'Parcelamento em aberto'
        : 'Pagamento único'
    }),
    [
      watchedValues.dataDesejada,
      watchedValues.parcelavel,
      watchedValues.quantidadeParcelasDesejada,
      watchedValues.titulo,
      watchedValues.valorEstimado
    ]
  );

  async function onSubmit(values: CompraPlanejadaPayload) {
    setSubmitError(undefined);
    try {
      await comprasPlanejadasApi.criar({
        ...values,
        descricao: values.descricao.trim(),
        link: values.link.trim(),
        observacao: values.observacao.trim()
      });
      navigate('/compras-planejadas');
    } catch (err) {
      const apiError = err as AxiosError<ApiErrorResponse>;
      const validationErrors = apiError.response?.data?.errors;
      if (validationErrors) {
        applyServerValidationErrors(validationErrors, (field, message) =>
          setError(field as keyof CompraPlanejadaPayload, {
            type: 'server',
            message
          })
        );
        return;
      }
      setSubmitError(err instanceof Error ? err.message : 'Falha ao salvar a compra planejada.');
    }
  }

  if (loading) {
    return <PageState state="loading" title="Carregando planejamento" />;
  }

  if (loadError) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <PageState state="error" title="Falha ao carregar" subtitle={loadError} />
      </div>
    );
  }

  return (
    <>
      <div className="compra-planejada-form-page max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-24">
          <div className="lg:col-span-7 space-y-8">
            <FormSection className="relative overflow-hidden" icon={<span className="material-symbols-outlined text-2xl">shopping_bag</span>}>
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <span className="material-symbols-outlined text-8xl">shopping_bag</span>
              </div>
              <div className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className={labelClassName}>Título da Compra</label>
                    <Controller
                      control={control}
                      name="titulo"
                      render={({ field }) => (
                        <input
                          {...field}
                          aria-label="Título da Compra"
                          className={fieldClassName}
                          placeholder="Ex: Upgrade MacBook Pro M3"
                          type="text"
                        />
                      )}
                    />
                    {errors.titulo && <p className="text-error text-xs ml-1 font-bold">{errors.titulo.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className={labelClassName}>Descrição Detalhada</label>
                    <Controller
                      control={control}
                      name="descricao"
                      render={({ field }) => (
                        <textarea
                          {...field}
                          aria-label="Descrição Detalhada"
                          className={textAreaClassName}
                          placeholder="Descreva os detalhes técnicos ou o motivo estratégico desta aquisição..."
                          rows={3}
                        />
                      )}
                    />
                    {errors.descricao && <p className="text-error text-xs ml-1 font-bold">{errors.descricao.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className={labelClassName}>Valor Estimado (R$)</label>
                    <Controller
                      control={control}
                      name="valorEstimado"
                      render={({ field }) => (
                        <CurrencyInput
                          aria-label="Valor Estimado (R$)"
                          className={`${fieldClassName} text-primary font-headline font-bold text-xl`}
                          placeholder="R$ 0,00"
                          value={field.value}
                          onChange={(value) => field.onChange(value ?? 0)}
                        />
                      )}
                    />
                    {errors.valorEstimado && <p className="text-error text-xs ml-1 font-bold">{errors.valorEstimado.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className={labelClassName}>Data Desejada</label>
                    <Controller
                      control={control}
                      name="dataDesejada"
                      render={({ field }) => (
                        <DateInput ariaLabel="Data Desejada" value={field.value} onChange={field.onChange} />
                      )}
                    />
                    {errors.dataDesejada && <p className="text-error text-xs ml-1 font-bold">{errors.dataDesejada.message}</p>}
                  </div>
                </div>
              </div>
            </FormSection>

            <FormSection title="Classificação Técnica" icon={<span className="material-symbols-outlined text-2xl">analytics</span>}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={labelClassName}>Prioridade</label>
                  <Controller
                    control={control}
                    name="prioridade"
                    render={({ field }) => (
                      <ComboBox
                        aria-label="Prioridade"
                        value={field.value}
                        onChange={field.onChange}
                        options={prioridadeOptions}
                      />
                    )}
                  />
                  {errors.prioridade && <p className="text-error text-xs ml-1 font-bold">{errors.prioridade.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className={labelClassName}>Status do Planejamento</label>
                  <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                      <ComboBox aria-label="Status do Planejamento" value={field.value} onChange={field.onChange} options={statusOptions} />
                    )}
                  />
                  {errors.status && <p className="text-error text-xs ml-1 font-bold">{errors.status.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className={labelClassName}>Conta Gerencial</label>
                  <Controller
                    control={control}
                    name="contaGerencialId"
                    render={({ field }) => (
                      <ComboBox
                        aria-label="Conta Gerencial"
                        value={field.value}
                        onChange={field.onChange}
                        onAddNew={() => setContaGerencialModalOpen(true)}
                        options={contaGerencialOptions}
                      />
                    )}
                  />
                  {errors.contaGerencialId && <p className="text-error text-xs ml-1 font-bold">{errors.contaGerencialId.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className={labelClassName}>Responsável</label>
                  <Controller
                    control={control}
                    name="responsavelId"
                    render={({ field }) => (
                      <ComboBox
                        aria-label="Responsável"
                        value={field.value}
                        onChange={field.onChange}
                        onAddNew={() => setResponsavelModalOpen(true)}
                        options={responsavelOptions}
                      />
                    )}
                  />
                  {errors.responsavelId && <p className="text-error text-xs ml-1 font-bold">{errors.responsavelId.message}</p>}
                </div>
              </div>
            </FormSection>

            <FormSection title="Configurações de Fluxo" eyebrow="Fluxo" icon={<span className="material-symbols-outlined text-2xl">sync_alt</span>}>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-surface-container rounded-2xl ring-1 ring-white/5">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">credit_score</span>
                    <div>
                      <p className="text-sm font-bold text-on-surface">Parcelável</p>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-tighter">Habilitar desdobramento</p>
                    </div>
                  </div>
                  <Controller
                    control={control}
                    name="parcelavel"
                    render={({ field }) => (
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          aria-label="Parcelável"
                          className="sr-only peer"
                          checked={Boolean(field.value)}
                          onChange={(event) => field.onChange(event.target.checked)}
                        />
                        <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                      </label>
                    )}
                  />
                </div>

                {parcelavel && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className={labelClassName}>Parcelas Desejadas</label>
                    <Controller
                      control={control}
                      name="quantidadeParcelasDesejada"
                      render={({ field }) => (
                        <input
                          aria-label="Parcelas Desejadas"
                          className={fieldClassName}
                          type="number"
                          min={2}
                          placeholder="2"
                          value={field.value ?? ''}
                          onChange={(event) => field.onChange(event.target.value ? Number(event.target.value) : null)}
                        />
                      )}
                    />
                    {errors.quantidadeParcelasDesejada && (
                      <p className="text-error text-xs ml-1 font-bold">{errors.quantidadeParcelasDesejada.message}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <label className={labelClassName}>Link de Referência</label>
                  <Controller
                    control={control}
                    name="link"
                    render={({ field }) => (
                      <div className="cf-form-control flex items-center bg-surface-container rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/40 transition-all ring-1 ring-white/5">
                        <span className="pl-4 pr-2 text-on-surface-variant">
                          <span className="material-symbols-outlined text-sm">link</span>
                        </span>
                        <input
                          {...field}
                          aria-label="Link de Referência"
                          className="w-full bg-transparent border-none px-2 py-3 text-on-surface text-sm focus:ring-0 font-medium placeholder:text-outline/40 outline-none"
                          placeholder="https://..."
                          type="url"
                        />
                      </div>
                    )}
                  />
                  {errors.link && <p className="text-error text-xs ml-1 font-bold">{errors.link.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className={labelClassName}>Observações Internas</label>
                  <Controller
                    control={control}
                    name="observacao"
                    render={({ field }) => (
                      <textarea
                        {...field}
                        aria-label="Observações Internas"
                        className={textAreaClassName}
                        placeholder="Notas sobre cotações, variações de preço ou fornecedores sugeridos..."
                        rows={4}
                      />
                    )}
                  />
                  {errors.observacao && <p className="text-error text-xs ml-1 font-bold">{errors.observacao.message}</p>}
                </div>
              </div>
            </FormSection>
          </div>

          <div className="lg:col-span-5 space-y-8">
            <FormSection
              className="sticky top-28"
              title="Pronto para salvar?"
              eyebrow="Resumo Estratégico"
              icon={<span className="material-symbols-outlined font-bold text-2xl">rocket_launch</span>}
              compact
            >
              <div className="space-y-3 mb-8">
                <div className="flex justify-between items-baseline p-4 bg-surface-container rounded-2xl border border-white/5">
                  <span className="text-xs text-on-surface-variant font-medium">Título</span>
                  <strong className="text-on-surface truncate ml-4 max-w-[60%] text-right font-headline">{resumo.titulo}</strong>
                </div>
                <div className="flex justify-between items-baseline p-4 bg-surface-container rounded-2xl border border-white/5">
                  <span className="text-xs text-on-surface-variant font-medium">Valor Estimado</span>
                  <strong className="text-primary font-headline text-lg">{formatCurrencyBRL(resumo.valor)}</strong>
                </div>
                <div className="flex justify-between items-baseline p-4 bg-surface-container rounded-2xl border border-white/5">
                  <span className="text-xs text-on-surface-variant font-medium">Previsão</span>
                  <strong className="text-on-surface font-headline">{resumo.dataDesejada}</strong>
                </div>
                <div className="flex justify-between items-baseline p-4 bg-surface-container rounded-2xl border border-white/5">
                  <span className="text-xs text-on-surface-variant font-medium">Estratégia</span>
                  <strong className="text-on-surface font-headline uppercase text-[10px] tracking-widest">{String(resumo.parcelas)}</strong>
                </div>
              </div>

              {submitError && (
                <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-2xl flex items-center gap-3 text-error">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  <p className="text-xs font-bold">{submitError}</p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className="w-full bg-primary/15 hover:bg-primary/25 text-primary border border-primary/40 font-black py-4 rounded-2xl active:scale-95 transition-all shadow-[0_0_20px_rgba(63,255,139,0.15)] uppercase tracking-tighter text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Salvando...' : 'Confirmar Planejamento'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/compras-planejadas')}
                  className="w-full bg-surface-container text-on-surface-variant font-bold py-3 rounded-2xl hover:text-white transition-all text-xs uppercase tracking-widest"
                >
                  Cancelar e Voltar
                </button>
              </div>
            </FormSection>
          </div>
        </form>
      </div>

      <QuickAddContaGerencialModal
        open={contaGerencialModalOpen}
        onClose={() => setContaGerencialModalOpen(false)}
        defaultTipo="Despesa"
        onSuccess={(newId) => {
          void reloadContaGerencialOptions().then(() => setValue('contaGerencialId', newId));
        }}
      />
      <QuickAddPessoaModal
        open={responsavelModalOpen}
        onClose={() => setResponsavelModalOpen(false)}
        onSuccess={(newId) => {
          void reloadResponsavelOptions().then(() => setValue('responsavelId', newId));
        }}
      />
    </>
  );
}

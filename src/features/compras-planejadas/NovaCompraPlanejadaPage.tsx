import { useCallback, useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { PageState } from '../../components/states/PageState';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { comprasPlanejadasApi } from '../../services/http/compras-planejadas-api';
import { applyServerValidationErrors } from '../../services/forms/applyServerValidationErrors';
import type { ApiErrorResponse } from '../../types/api';
import type { CompraPlanejadaPayload } from '../../types/compras-planejadas';
import { compraPlanejadaSchema } from './schemas';
import { mapContaGerencialSelectOptions } from '../../shared/conta-gerencial';
import { formatCurrencyBRL } from '../../shared/currency';
import { formatDateBR } from '../../shared/date';
import { SelectWithQuickAdd } from '../../components/forms/SelectWithQuickAdd';
import { QuickAddContaGerencialModal } from '../cadastros/quick-add/QuickAddContaGerencialModal';
import { QuickAddPessoaModal } from '../cadastros/quick-add/QuickAddPessoaModal';

interface SelectOption {
  label: string;
  value: string;
}

const prioridadeOptions: SelectOption[] = [
  { label: 'Baixa', value: 'Baixa' },
  { label: 'Média (Padrão)', value: 'Media' },
  { label: 'Alta', value: 'Alta' },
  { label: 'Crítica / Urgente', value: 'Alta' }
];

const statusOptions: SelectOption[] = [
  { label: 'Em Pesquisa', value: 'Planejada' },
  { label: 'Aguardando Saldo', value: 'Planejada' },
  { label: 'Aprovado', value: 'Planejada' }
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
      page: 1, pageSize: 100, search: '', tipo: 'Despesa', aceitaLancamentos: true
    });
    setContaGerencialOptions(
      mapContaGerencialSelectOptions(response.items.filter((item) => item.aceitaLancamentos))
    );
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
        setContaGerencialOptions(
          mapContaGerencialSelectOptions(contasGerenciais.items.filter((item) => item.aceitaLancamentos))
        );
        setResponsavelOptions(
          responsaveis.items.map((item) => ({
            label: item.nome,
            value: item.id
          }))
        );
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
    [watchedValues.dataDesejada, watchedValues.parcelavel, watchedValues.quantidadeParcelasDesejada, watchedValues.titulo, watchedValues.valorEstimado]
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
      <>
        <div className="max-w-7xl mx-auto px-4 py-10">
          <PageState state="error" title="Falha ao carregar" subtitle={loadError} />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Breadcrumbs / Header */}
        <div>
          <div className="flex items-center gap-2 text-on-surface-variant text-xs uppercase tracking-widest font-bold mb-2">
            <span>Planejamento</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary" style={{ textShadow: '0 0 10px rgba(63, 255, 139, 0.3)' }}>
              Nova Compra Planejada
            </span>
          </div>
          <h1 className="text-4xl font-headline font-extrabold tracking-tight text-on-surface">Cadastro de Compra</h1>
          <p className="text-on-surface-variant max-w-2xl mt-2 font-body">
            Defina sua estratégia de aquisição e mantenha seu patrimônio sob controle com inteligência preditiva.
          </p>
        </div>

        {/* Main Form Section */}
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-24">
          {/* Left Column: Vital Info */}
          <div className="lg:col-span-7 space-y-8">
            {/* Basic Info Card */}
            <section className="bg-surface-container rounded-3xl p-8 shadow-2xl relative overflow-hidden ring-1 ring-white/5">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <span className="material-symbols-outlined text-8xl">shopping_bag</span>
              </div>
              <div className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 gap-6">
                  {/* Título */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">
                      Título da Compra
                    </label>
                    <Controller
                      control={control}
                      name="titulo"
                      render={({ field }) => (
                        <input
                          {...field}
                          aria-label="Título da Compra"
                          className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/40 transition-all font-medium placeholder:text-outline/40 outline-none"
                          placeholder="Ex: Upgrade MacBook Pro M3"
                          type="text"
                        />
                      )}
                    />
                    {errors.titulo && <p className="text-error text-xs ml-1 font-bold">{errors.titulo.message}</p>}
                  </div>

                  {/* Descrição */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">
                      Descrição Detalhada
                    </label>
                    <Controller
                      control={control}
                      name="descricao"
                      render={({ field }) => (
                        <textarea
                          {...field}
                          aria-label="Descrição Detalhada"
                          className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/40 transition-all font-medium placeholder:text-outline/40 resize-none outline-none"
                          placeholder="Descreva os detalhes técnicos ou o motivo estratégico desta aquisição..."
                          rows={3}
                        />
                      )}
                    />
                    {errors.descricao && <p className="text-error text-xs ml-1 font-bold">{errors.descricao.message}</p>}
                  </div>
                </div>

                {/* Valor + Data */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">
                      Valor Estimado (R$)
                    </label>
                    <Controller
                      control={control}
                      name="valorEstimado"
                      render={({ field }) => (
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">R$</span>
                          <input
                            aria-label="Valor Estimado (R$)"
                            className="w-full bg-surface-container-highest border-none rounded-xl pl-12 pr-4 py-3 text-primary font-headline font-bold text-xl focus:ring-2 focus:ring-primary/40 transition-all outline-none"
                            placeholder="0,00"
                            type="number"
                            step="0.01"
                            min="0"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                          />
                        </div>
                      )}
                    />
                    {errors.valorEstimado && <p className="text-error text-xs ml-1 font-bold">{errors.valorEstimado.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">
                      Data Desejada
                    </label>
                    <Controller
                      control={control}
                      name="dataDesejada"
                      render={({ field }) => (
                        <input
                          {...field}
                          aria-label="Data Desejada"
                          className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/40 transition-all font-medium [color-scheme:dark] outline-none"
                          type="date"
                        />
                      )}
                    />
                    {errors.dataDesejada && <p className="text-error text-xs ml-1 font-bold">{errors.dataDesejada.message}</p>}
                  </div>
                </div>
              </div>
            </section>

            {/* Classification Card */}
            <section className="bg-surface-container rounded-3xl p-8 shadow-xl ring-1 ring-white/5">
              <h3 className="text-lg font-headline font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">analytics</span>
                Classificação Técnica
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Prioridade */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">
                    Prioridade
                  </label>
                  <Controller
                    control={control}
                    name="prioridade"
                    render={({ field }) => (
                      <select
                        aria-label="Prioridade"
                        className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/40 transition-all font-medium appearance-none outline-none cursor-pointer"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                      >
                        {prioridadeOptions.map((opt) => (
                          <option key={opt.label} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.prioridade && <p className="text-error text-xs ml-1 font-bold">{errors.prioridade.message}</p>}
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">
                    Status do Planejamento
                  </label>
                  <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                      <select
                        aria-label="Status do Planejamento"
                        className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/40 transition-all font-medium appearance-none outline-none cursor-pointer"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt.label} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.status && <p className="text-error text-xs ml-1 font-bold">{errors.status.message}</p>}
                </div>

                {/* Conta Gerencial */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">
                    Conta Gerencial
                  </label>
                  <Controller
                    control={control}
                    name="contaGerencialId"
                    render={({ field }) => (
                      <SelectWithQuickAdd
                        aria-label="Conta Gerencial"
                        className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/40 transition-all font-medium appearance-none outline-none cursor-pointer"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        onAddNew={() => setContaGerencialModalOpen(true)}
                      >
                        <option value="">Selecione...</option>
                        {contaGerencialOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </SelectWithQuickAdd>
                    )}
                  />
                  {errors.contaGerencialId && <p className="text-error text-xs ml-1 font-bold">{errors.contaGerencialId.message}</p>}
                </div>

                {/* Responsável */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">
                    Responsável
                  </label>
                  <Controller
                    control={control}
                    name="responsavelId"
                    render={({ field }) => (
                      <SelectWithQuickAdd
                        aria-label="Responsável"
                        className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/40 transition-all font-medium appearance-none outline-none cursor-pointer"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        onAddNew={() => setResponsavelModalOpen(true)}
                      >
                        <option value="">Selecione...</option>
                        {responsavelOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </SelectWithQuickAdd>
                    )}
                  />
                  {errors.responsavelId && <p className="text-error text-xs ml-1 font-bold">{errors.responsavelId.message}</p>}
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Settings & Meta */}
          <div className="lg:col-span-5 space-y-8">
            {/* Strategy Card */}
            <section className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant/10 shadow-lg">
              <h3 className="text-sm font-label font-bold text-primary uppercase tracking-widest mb-6">
                Configurações de Fluxo
              </h3>
              <div className="space-y-6">
                {/* Toggle Parcelável */}
                <div className="flex items-center justify-between p-4 bg-surface-container rounded-2xl ring-1 ring-white/5">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant">credit_score</span>
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
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                      </label>
                    )}
                  />
                </div>

                {/* Parcelas Desejadas */}
                {parcelavel && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">
                      Parcelas Desejadas
                    </label>
                    <Controller
                      control={control}
                      name="quantidadeParcelasDesejada"
                      render={({ field }) => (
                        <input
                          aria-label="Parcelas Desejadas"
                          className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/40 transition-all font-medium outline-none"
                          type="number"
                          min={2}
                          placeholder="2"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        />
                      )}
                    />
                    {errors.quantidadeParcelasDesejada && (
                      <p className="text-error text-xs ml-1 font-bold">{errors.quantidadeParcelasDesejada.message}</p>
                    )}
                  </div>
                )}

                {/* Link de Referência */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">
                    Link de Referência
                  </label>
                  <Controller
                    control={control}
                    name="link"
                    render={({ field }) => (
                      <div className="flex items-center bg-surface-container rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/40 transition-all ring-1 ring-white/5">
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

                {/* Observações */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">
                    Observações Internas
                  </label>
                  <Controller
                    control={control}
                    name="observacao"
                    render={({ field }) => (
                      <textarea
                        {...field}
                        aria-label="Observações Internas"
                        className="w-full bg-surface-container rounded-xl border-none px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/40 transition-all text-sm font-medium placeholder:text-outline/40 resize-none outline-none ring-1 ring-white/5"
                        placeholder="Notas sobre cotações, variações de preço ou fornecedores sugeridos..."
                        rows={4}
                      />
                    )}
                  />
                  {errors.observacao && <p className="text-error text-xs ml-1 font-bold">{errors.observacao.message}</p>}
                </div>
              </div>
            </section>

            {/* Preview Card */}
            <section className="rounded-3xl p-8 bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 sticky top-28">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-on-primary shadow shadow-primary/40">
                  <span className="material-symbols-outlined font-bold text-2xl">rocket_launch</span>
                </div>
                <div>
                  <h4 className="font-headline font-bold text-white uppercase tracking-tight">Pronto para salvar?</h4>
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Resumo Estratégico</p>
                </div>
              </div>

              {/* Live Preview List */}
              <div className="space-y-3 mb-8">
                <div className="flex justify-between items-baseline p-4 bg-surface-container/40 rounded-2xl ring-1 ring-white/5">
                  <span className="text-xs text-on-surface-variant font-medium">Título</span>
                  <strong className="text-on-surface truncate ml-4 max-w-[60%] text-right font-headline">{resumo.titulo}</strong>
                </div>
                <div className="flex justify-between items-baseline p-4 bg-surface-container/40 rounded-2xl ring-1 ring-white/5">
                  <span className="text-xs text-on-surface-variant font-medium">Valor Estimado</span>
                  <strong className="text-primary font-headline text-lg">{formatCurrencyBRL(resumo.valor)}</strong>
                </div>
                <div className="flex justify-between items-baseline p-4 bg-surface-container/40 rounded-2xl ring-1 ring-white/5">
                  <span className="text-xs text-on-surface-variant font-medium">Previsão</span>
                  <strong className="text-on-surface font-headline">{resumo.dataDesejada}</strong>
                </div>
                <div className="flex justify-between items-baseline p-4 bg-surface-container/40 rounded-2xl ring-1 ring-white/5">
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
                  className="w-full bg-primary text-on-primary font-black py-4 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 uppercase tracking-tighter text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Salvando...' : 'Confirmar Planejamento'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/compras-planejadas')}
                  className="w-full bg-surface-container-highest text-on-surface-variant font-bold py-3 rounded-2xl hover:text-white transition-all text-xs uppercase tracking-widest"
                >
                  Cancelar e Voltar
                </button>
              </div>
            </section>
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

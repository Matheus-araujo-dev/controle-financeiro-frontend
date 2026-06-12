import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ApartmentOutlined,
  InfoCircleOutlined,
  SafetyCertificateOutlined,
  StarOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { AxiosError } from 'axios';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { PageState } from '../../components/states/PageState';
import { applyServerValidationErrors } from '../../services/forms/applyServerValidationErrors';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { mapContaGerencialSelectOptionsWithData } from '../../shared/conta-gerencial';
import type { ApiErrorResponse } from '../../types/api';
import type { ContaGerencialPayload, ContaGerencialTipo } from '../../types/cadastros';
import { contasGerenciaisModuleConfig, type SelectOption } from './module-config';

type ContaGerencialOptionData = {
  codigo?: string | null;
  descricao?: string;
  tipo?: string;
  contaPaiId?: string | null;
};

function getContaGerencialOptionData(option?: SelectOption) {
  return option?.data as ContaGerencialOptionData | undefined;
}

function buildNextContaGerencialCode(options: SelectOption[], contaPaiId?: string) {
  if (!contaPaiId) {
    const rootCodes = options
      .map((option) => getContaGerencialOptionData(option)?.codigo?.trim())
      .filter((code): code is string => typeof code === 'string' && code.length > 0)
      .filter((code) => !code.includes('.') && /^\d+$/.test(code));

    if (rootCodes.length === 0) {
      return '';
    }

    const maxRoot = Math.max(...rootCodes.map((code) => Number.parseInt(code, 10)));
    return String(maxRoot + 1).padStart(2, '0');
  }

  const parentOption = options.find((option) => option.value === contaPaiId);
  const parentCode = getContaGerencialOptionData(parentOption)?.codigo?.trim();

  if (!parentCode) {
    return '';
  }

  const directChildCodes = options
    .filter((option) => getContaGerencialOptionData(option)?.contaPaiId === contaPaiId)
    .map((option) => getContaGerencialOptionData(option)?.codigo?.trim())
    .filter((code): code is string => Boolean(code));

  if (directChildCodes.length === 0) {
    return `${parentCode}.01`;
  }

  const maxSuffix = Math.max(
    ...directChildCodes
      .map((code) => {
        if (!code.startsWith(`${parentCode}.`)) {
          return null;
        }

        const suffix = code.slice(parentCode.length + 1);
        if (suffix.includes('.')) {
          return null;
        }

        const numericSuffix = Number.parseInt(suffix, 10);
        return Number.isNaN(numericSuffix) ? null : numericSuffix;
      })
      .filter((value): value is number => value !== null)
  );

  if (!Number.isFinite(maxSuffix)) {
    return `${parentCode}.01`;
  }

  return `${parentCode}.${String(maxSuffix + 1).padStart(2, '0')}`;
}

function getHierarchyTrail(options: SelectOption[], contaPaiId: string | undefined, currentLabel: string) {
  const byId = new Map(options.map((option) => [String(option.value), option]));
  const trail: string[] = [];
  let currentId = contaPaiId;

  while (currentId) {
    const option = byId.get(currentId);

    if (!option) {
      break;
    }

    trail.unshift(option.label);
    currentId = getContaGerencialOptionData(option)?.contaPaiId ?? undefined;
  }

  trail.push(currentLabel);
  return trail;
}

function getResponsavelLabel(options: SelectOption[], value?: string | null) {
  if (!value) {
    return 'Sem responsavel definido';
  }

  return options.find((option) => option.value === value)?.label ?? 'Responsavel nao encontrado';
}

function getContaNaturezaClass(tipo: ContaGerencialTipo) {
  return tipo === 'Receita'
    ? 'border-primary/20 bg-primary/10 text-primary'
    : 'border-[#ff8a7a]/20 bg-[#ff8a7a]/10 text-[#ff8a7a]';
}

export function ContasGerenciaisFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(Boolean(id));
  const [loadError, setLoadError] = useState<string>();
  const [submitError, setSubmitError] = useState<string>();
  const [contaPaiOptions, setContaPaiOptions] = useState<SelectOption[]>([]);
  const [responsavelOptions, setResponsavelOptions] = useState<SelectOption[]>([]);
  const [usageLabel, setUsageLabel] = useState('Analitica');

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ContaGerencialPayload>({
    resolver: zodResolver(contasGerenciaisModuleConfig.schema as any) as never,
    defaultValues: contasGerenciaisModuleConfig.defaultValues,
    mode: 'onChange'
  });

  const watchedValues = useWatch({ control });
  const contaPaiSelecionada = contaPaiOptions.find((option) => option.value === watchedValues.contaPaiId);
  const inheritedType = getContaGerencialOptionData(contaPaiSelecionada)?.tipo as ContaGerencialTipo | undefined;

  useEffect(() => {
    async function loadOptions() {
      setLoadError(undefined);

      try {
        const [contas, pessoas] = await Promise.all([
          cadastrosApi.contasGerenciais.listar({
            page: 1,
            pageSize: 100,
            search: '',
            sortBy: 'codigo',
            sortDirection: 'Asc'
          }),
          cadastrosApi.pessoas.listar({
            page: 1,
            pageSize: 100,
            search: '',
            ativo: true
          })
        ]);

        setContaPaiOptions(mapContaGerencialSelectOptionsWithData(contas.items));
        setResponsavelOptions(
          pessoas.items.map((item) => ({
            label: item.nome,
            value: item.id
          }))
        );
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Falha ao carregar opcoes da conta gerencial.');
      }
    }

    void loadOptions();
  }, []);

  useEffect(() => {
    if (!id) {
      reset(contasGerenciaisModuleConfig.defaultValues);
      setLoading(false);
      setUsageLabel('Analitica');
      return;
    }

    async function loadDetail() {
      setLoading(true);
      setLoadError(undefined);

      try {
        const detail = await contasGerenciaisModuleConfig.detail(id!);
        reset(contasGerenciaisModuleConfig.toFormValues(detail));
        setUsageLabel(detail.aceitaLancamentos ? 'Analitica' : 'Sintetica');
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Falha ao carregar conta gerencial.');
      } finally {
        setLoading(false);
      }
    }

    void loadDetail();
  }, [id, reset]);

  useEffect(() => {
    if (!id && contaPaiOptions.length > 0) {
      const nextCode = buildNextContaGerencialCode(contaPaiOptions, watchedValues.contaPaiId || undefined);

      if (nextCode) {
        setValue('codigo', nextCode, { shouldValidate: true });
      }
    }
  }, [contaPaiOptions, id, setValue, watchedValues.contaPaiId]);

  useEffect(() => {
    if (!inheritedType) {
      return;
    }

    setValue('tipo', inheritedType, { shouldValidate: true });
  }, [inheritedType, setValue]);

  async function onSubmit(values: ContaGerencialPayload) {
    setSubmitError(undefined);

    try {
      if (id) {
        await contasGerenciaisModuleConfig.update(id, values);
      } else {
        await contasGerenciaisModuleConfig.create(values);
      }

      navigate(contasGerenciaisModuleConfig.routeBase);
    } catch (error) {
      const apiError = error as AxiosError<ApiErrorResponse>;
      const validationErrors = apiError.response?.data?.errors;

      if (validationErrors) {
        applyServerValidationErrors(validationErrors, (field, message) =>
          setError(field as keyof ContaGerencialPayload, {
            type: 'server',
            message
          })
        );
        return;
      }

      setSubmitError(error instanceof Error ? error.message : 'Falha ao salvar conta gerencial.');
    }
  }

  const previewLabel = useMemo(() => {
    const code = watchedValues.codigo?.trim();
    const descricao = watchedValues.descricao?.trim();

    if (code && descricao) {
      return `${code} - ${descricao}`;
    }

    if (code) {
      return `${code} - Nova Conta Gerencial`;
    }

    if (descricao) {
      return descricao;
    }

    return 'Nova Conta Gerencial';
  }, [watchedValues.codigo, watchedValues.descricao]);

  const hierarchyTrail = useMemo(
    () => getHierarchyTrail(contaPaiOptions, watchedValues.contaPaiId || undefined, previewLabel),
    [contaPaiOptions, previewLabel, watchedValues.contaPaiId]
  );

  const responsavelLabel = useMemo(
    () => getResponsavelLabel(responsavelOptions, watchedValues.responsavelPadraoId),
    [responsavelOptions, watchedValues.responsavelPadraoId]
  );

  if (loading) {
    return <PageState state="loading" title="Carregando conta gerencial" />;
  }

  if (loadError) {
    return <PageState state="error" title="Falha ao carregar conta gerencial" subtitle={loadError} />;
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-8 2xl:gap-10">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-on-surface-variant">
            <span>Cadastros</span>
            <span>/</span>
            <span>Plano de Contas</span>
            <span>/</span>
            <span className="text-primary">{id ? 'Editar Conta Gerencial' : 'Nova Conta Gerencial'}</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-on-surface sm:text-5xl">
              {id ? 'Editar Conta Gerencial' : 'Cadastro de Conta Gerencial'}
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-on-surface-variant sm:text-base">
              Defina a estrutura hierarquica e os parametros operacionais da conta sem alterar os contratos atuais do
              modulo.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(contasGerenciaisModuleConfig.routeBase)}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] px-5 py-3 text-sm font-bold text-on-surface transition hover:border-white/15 hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="contas-gerenciais-form"
            disabled={isSubmitting}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-black text-[#062412] shadow-[0_18px_40px_rgba(63,255,139,0.18)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Salvando...' : id ? 'Salvar alteracoes' : 'Salvar conta'}
          </button>
        </div>
      </section>

      <form
        id="contas-gerenciais-form"
        onSubmit={handleSubmit(onSubmit)}
        className="grid w-full min-w-0 gap-8 xl:grid-cols-[minmax(0,1.58fr)_minmax(360px,0.78fr)] 2xl:gap-10 2xl:grid-cols-[minmax(0,1.66fr)_minmax(380px,0.8fr)]"
      >
        <section className="min-w-0 rounded-[32px] border border-white/8 bg-[linear-gradient(140deg,rgba(24,24,24,0.98),rgba(9,9,9,0.96))] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.34)] sm:p-8 2xl:p-10">
          <div className="space-y-10">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/8 pb-4">
                <span className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary">
                  <ApartmentOutlined />
                </span>
                <div>
                  <h2 className="text-xl font-black text-on-surface">Posicionamento na Estrutura</h2>
                  <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                    Escolha a conta pai e acompanhe o codigo gerado para manter o plano de contas consistente.
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="contaPaiId" className="px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                    Conta pai
                  </label>
                  <Controller
                    control={control}
                    name="contaPaiId"
                    render={({ field }) => (
                      <select
                        id="contaPaiId"
                        aria-label="Conta pai"
                        value={field.value ?? ''}
                        onChange={(event) => field.onChange(event.target.value)}
                        className="h-14 w-full rounded-2xl border border-white/8 bg-surface-container px-4 text-sm font-medium text-on-surface outline-none transition focus:border-primary/25"
                      >
                        <option value="">Sem conta pai</option>
                        {contaPaiOptions.map((option) => (
                          <option key={String(option.value)} value={String(option.value)}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.contaPaiId ? <p className="px-1 text-xs font-bold text-red-300">{errors.contaPaiId.message}</p> : null}
                </div>

                <div className="space-y-2">
                  <label htmlFor="codigo" className="px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                    Codigo da conta
                  </label>
                  <Controller
                    control={control}
                    name="codigo"
                    render={({ field }) => (
                      <input
                        id="codigo"
                        aria-label="Codigo da conta"
                        readOnly
                        value={field.value ?? ''}
                        className="h-14 w-full rounded-2xl border border-white/8 bg-surface-container px-4 text-sm font-bold text-on-surface outline-none"
                      />
                    )}
                  />
                  {errors.codigo ? <p className="px-1 text-xs font-bold text-red-300">{errors.codigo.message}</p> : null}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/8 pb-4">
                <span className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary">
                  <InfoCircleOutlined />
                </span>
                <div>
                  <h2 className="text-xl font-black text-on-surface">Identificacao e Atributos</h2>
                  <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                    Defina descricao, natureza financeira, responsavel padrao e status operacional da conta.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="descricao" className="px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                  Descricao da conta
                </label>
                <Controller
                  control={control}
                  name="descricao"
                  render={({ field }) => (
                    <input
                      {...field}
                      id="descricao"
                      aria-label="Descricao da conta"
                      value={field.value ?? ''}
                      placeholder="Ex: Despesas com Consultoria em Nuvem"
                      className="h-14 w-full rounded-2xl border border-white/8 bg-surface-container px-4 text-sm font-medium text-on-surface outline-none transition placeholder:text-on-surface-variant/45 focus:border-primary/25"
                    />
                  )}
                />
                {errors.descricao ? <p className="px-1 text-xs font-bold text-red-300">{errors.descricao.message}</p> : null}
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <span className="px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Natureza</span>
                  {inheritedType ? (
                    <div className="rounded-2xl border border-white/8 bg-surface-container px-4 py-4">
                      <div className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${getContaNaturezaClass(inheritedType)}`}>
                        {inheritedType}
                      </div>
                      <p className="mt-3 text-xs leading-5 text-on-surface-variant">Natureza herdada automaticamente da conta pai.</p>
                    </div>
                  ) : (
                    <Controller
                      control={control}
                      name="tipo"
                      render={({ field }) => (
                        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/8 bg-surface-container p-1">
                          {(['Receita', 'Despesa'] as const).map((tipo) => (
                            <button
                              key={tipo}
                              type="button"
                              onClick={() => field.onChange(tipo)}
                              className={`min-h-12 rounded-xl px-3 text-xs font-black uppercase tracking-[0.18em] transition ${
                                field.value === tipo
                                  ? tipo === 'Receita'
                                    ? 'bg-primary text-[#062412]'
                                    : 'bg-[#ff8a7a] text-[#2c0600]'
                                  : 'text-on-surface-variant hover:text-on-surface'
                              }`}
                            >
                              {tipo}
                            </button>
                          ))}
                        </div>
                      )}
                    />
                  )}
                  {errors.tipo ? <p className="px-1 text-xs font-bold text-red-300">{errors.tipo.message}</p> : null}
                </div>

                <div className="space-y-2">
                  <label htmlFor="responsavelPadraoId" className="px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                    Responsavel padrao
                  </label>
                  <Controller
                    control={control}
                    name="responsavelPadraoId"
                    render={({ field }) => (
                      <select
                        id="responsavelPadraoId"
                        aria-label="Responsavel padrao"
                        value={field.value ?? ''}
                        onChange={(event) => field.onChange(event.target.value)}
                        className="h-14 w-full rounded-2xl border border-white/8 bg-surface-container px-4 text-sm font-medium text-on-surface outline-none transition focus:border-primary/25"
                      >
                        <option value="">Selecione um responsavel</option>
                        {responsavelOptions.map((option) => (
                          <option key={String(option.value)} value={String(option.value)}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.responsavelPadraoId ? (
                    <p className="px-1 text-xs font-bold text-red-300">{errors.responsavelPadraoId.message}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <span className="px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Status</span>
                  <Controller
                    control={control}
                    name="ativo"
                    render={({ field }) => (
                      <label className="flex min-h-[56px] cursor-pointer items-center justify-between rounded-2xl border border-white/8 bg-surface-container px-4">
                        <span className="text-sm font-bold text-on-surface">{field.value ? 'Ativa' : 'Inativa'}</span>
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
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-4 border-t border-white/8 pt-6">
              <button
                type="button"
                onClick={() => navigate(contasGerenciaisModuleConfig.routeBase)}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/8 px-6 py-3 text-sm font-bold text-on-surface-variant transition hover:text-on-surface"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-primary px-8 py-3 text-sm font-black text-[#062412] shadow-[0_18px_40px_rgba(63,255,139,0.18)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Salvando...' : id ? 'Salvar alteracoes' : 'Salvar conta'}
              </button>
            </div>
          </div>
        </section>

        <div className="min-w-0 space-y-6">
          <section className="rounded-[28px] border border-white/8 bg-surface-container-low p-6 shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
            <div className="flex items-start gap-3">
              <span className="mt-1 rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary">
                <ApartmentOutlined />
              </span>
              <div>
                <h2 className="text-lg font-black text-on-surface">Preview da Hierarquia</h2>
                <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                  Visualize rapidamente onde a conta sera posicionada dentro da estrutura atual.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {hierarchyTrail.map((entry, index) => {
                const isCurrent = index === hierarchyTrail.length - 1;

                return (
                  <div
                    key={`${entry}-${index}`}
                    className={`rounded-2xl border px-4 py-3 text-sm ${
                      isCurrent
                        ? 'border-primary/20 bg-primary/10 text-primary'
                        : 'border-white/8 bg-white/[0.03] text-on-surface-variant'
                    }`}
                    style={{ marginLeft: `${index * 12}px` }}
                  >
                    {entry}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/8 bg-surface-container-low p-6 shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
            <div className="flex items-start gap-3">
              <span className="mt-1 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-on-surface">
                <StarOutlined />
              </span>
              <div>
                <h2 className="text-lg font-black text-on-surface">Recebimento de Fatura</h2>
                <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                  Marque esta conta quando ela for a padrao para registrar o pagamento das faturas de cartao.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <Controller
                control={control}
                name="ehPadraoRecebimentoFaturaCartao"
                render={({ field }) => (
                  <label className="flex min-h-[64px] cursor-pointer items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-on-surface">Padrao para recebimento de fatura</p>
                      <p className="text-xs leading-5 text-on-surface-variant">
                        {field.value ? 'Esta conta sera sugerida no pagamento das faturas.' : 'Nenhuma sugestao automatica sera aplicada.'}
                      </p>
                    </div>
                    <span className="relative inline-flex h-7 w-14 items-center rounded-full bg-white/[0.08]">
                      <input
                        type="checkbox"
                        aria-label="Padrao para recebimento de fatura"
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
              {errors.ehPadraoRecebimentoFaturaCartao ? (
                <p className="mt-2 px-1 text-xs font-bold text-red-300">{errors.ehPadraoRecebimentoFaturaCartao.message}</p>
              ) : null}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/8 bg-surface-container-low p-6 shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
            <div className="flex items-start gap-3">
              <span className="mt-1 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-on-surface">
                <SafetyCertificateOutlined />
              </span>
              <div>
                <h2 className="text-lg font-black text-on-surface">Resumo Operacional</h2>
                <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                  O comportamento funcional continua igual: apenas o layout foi reorganizado para leitura mais rapida.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Natureza</span>
                <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${getContaNaturezaClass(inheritedType ?? watchedValues.tipo ?? 'Despesa')}`}>
                  {inheritedType ?? watchedValues.tipo ?? 'Despesa'}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Uso previsto</span>
                <span className="text-sm font-bold text-on-surface">{usageLabel}</span>
              </div>

              <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs text-on-surface">
                    <TeamOutlined />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Responsavel</p>
                    <p className="mt-1 text-sm font-bold text-on-surface">{responsavelLabel}</p>
                  </div>
                </div>
              </div>
            </div>

            {submitError ? (
              <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/8 px-4 py-3 text-sm font-bold text-red-300">
                {submitError}
              </div>
            ) : null}
          </section>
        </div>
      </form>
    </div>
  );
}

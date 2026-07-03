import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useFieldArray, useForm, useWatch, type Control, type FieldErrors } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import { DateInput } from '../../components/forms/DateInput';
import { ComboBox, type ComboBoxOption } from '../../components/forms/ComboBox';
import {
  FieldError,
  FormActionPanel,
  ReadonlyField,
  ToggleField,
  formFieldClass,
  formLabelClass,
  formTextAreaClass
} from '../../components/forms/FormPrimitives';
import { Button } from '../../components/ui/Button';
import { PageState } from '../../components/states/PageState';
import { FormSection } from '../../components/layout';
import { applyServerValidationErrors } from '../../services/forms/applyServerValidationErrors';
import type { ApiErrorResponse } from '../../types/api';
import type { FormFieldConfig, MasterDataModuleConfig, SelectOption } from './module-config';
import { applyInputMask, extractDigits } from './input-masks';
import { CurrencyInput } from '../../shared/CurrencyInput';
import { handleIntegerPaste, parseIntegerInput, preventScientificNotation } from '../../shared/number-input';
import { QuickAddPessoaModal } from './quick-add/QuickAddPessoaModal';

function buildFieldOptions(field: FormFieldConfig<Record<string, unknown>>, loadedOptions: Record<string, SelectOption[]>) {
  return [...(field.options ?? []), ...(loadedOptions[field.name] ?? [])];
}

type ContaGerencialOptionData = {
  codigo?: string | null;
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

    if (rootCodes.length === 0) return '';

    const maxRoot = Math.max(...rootCodes.map((code) => parseInt(code, 10)));
    return String(maxRoot + 1).padStart(2, '0');
  }

  const parentOption = options.find((option) => option.value === contaPaiId);
  const parentCode = getContaGerencialOptionData(parentOption)?.codigo?.trim();
  if (!parentCode) return '';

  const directChildCodes = options
    .filter((option) => getContaGerencialOptionData(option)?.contaPaiId === contaPaiId)
    .map((option) => getContaGerencialOptionData(option)?.codigo?.trim())
    .filter((code): code is string => Boolean(code));

  if (directChildCodes.length === 0) return `${parentCode}.01`;

  const maxSuffix = Math.max(
    ...directChildCodes
      .map((code) => {
        if (!code.startsWith(`${parentCode}.`)) return null;
        const suffix = code.slice(parentCode.length + 1);
        if (suffix.includes('.')) return null;
        const numericSuffix = Number.parseInt(suffix, 10);
        return Number.isNaN(numericSuffix) ? null : numericSuffix;
      })
      .filter((value): value is number => value !== null)
  );

  if (!Number.isFinite(maxSuffix)) return `${parentCode}.01`;
  return `${parentCode}.${String(maxSuffix + 1).padStart(2, '0')}`;
}

const pessoaPixTipoOptions: ComboBoxOption[] = [
  { label: 'CPF/CNPJ', value: 'CpfCnpj' },
  { label: 'Email', value: 'Email' },
  { label: 'Telefone', value: 'Telefone' },
  { label: 'Aleatória', value: 'Aleatoria' }
];

function getPixMaskKind(tipo?: string) {
  if (tipo === 'CpfCnpj') return 'cpfCnpj';
  if (tipo === 'Telefone') return 'phone';
  return undefined;
}

function getPixPlaceholder(tipo?: string) {
  if (tipo === 'CpfCnpj') return 'CPF ou CNPJ da chave Pix';
  if (tipo === 'Email') return 'email@exemplo.com';
  if (tipo === 'Telefone') return '(00) 00000-0000';
  return 'Chave aleatória';
}

function toComboOptions(options: SelectOption[], includeEmpty = false): ComboBoxOption[] {
  const normalized = options.map((option) => ({
    label: option.label,
    value: String(option.value)
  }));

  return includeEmpty ? [{ label: 'Sem seleção', value: '' }, ...normalized] : normalized;
}

function isOptionalSelect(fieldName: string) {
  return ['contaPaiId', 'responsavelPadraoId', 'contaBancariaPagamentoPadraoId'].includes(fieldName);
}

function sectionPlanFor(key: string) {
  const sections: Record<string, Array<{ title: string; eyebrow: string; icon: string; fields: string[] }>> = {
    pessoas: [
      { title: 'Dados da Pessoa', eyebrow: 'Cadastro', icon: 'badge', fields: ['nome', 'tipoPessoa', 'cpfCnpj'] },
      { title: 'Contato', eyebrow: 'Comunicação', icon: 'alternate_email', fields: ['email', 'telefone'] },
      { title: 'Observações', eyebrow: 'Notas', icon: 'notes', fields: ['observacao'] }
    ],
    'formas-pagamento': [
      { title: 'Dados da Forma', eyebrow: 'Cadastro', icon: 'payments', fields: ['nome', 'tipo'] },
      { title: 'Configurações Operacionais', eyebrow: 'Regras', icon: 'tune', fields: ['ehCartao', 'baixarAutomaticamente', 'ativo'] }
    ],
    'contas-bancarias': [
      {
        title: 'Dados Bancários',
        eyebrow: 'Cadastro',
        icon: 'account_balance',
        fields: ['nome', 'banco', 'agencia', 'numeroConta', 'tipoConta']
      },
      {
        title: 'Saldo e Limites',
        eyebrow: 'Controle',
        icon: 'savings',
        fields: ['saldoInicial', 'dataSaldoInicial', 'limiteCartoesCompartilhado']
      },
      { title: 'Configurações', eyebrow: 'Status', icon: 'toggle_on', fields: ['ativo'] }
    ],
    cartoes: [
      { title: 'Dados do Cartão', eyebrow: 'Cadastro', icon: 'credit_card', fields: ['nome', 'bandeira', 'numeroFinal'] },
      {
        title: 'Fechamento e Pagamento',
        eyebrow: 'Ciclo',
        icon: 'event_repeat',
        fields: ['diaFechamentoFatura', 'diaVencimentoFatura', 'contaBancariaPagamentoPadraoId']
      },
      { title: 'Limite e Status', eyebrow: 'Controle', icon: 'credit_score', fields: ['limiteCredito', 'ativo'] }
    ],
    'contas-gerenciais': [
      { title: 'Estrutura Gerencial', eyebrow: 'Cadastro', icon: 'account_tree', fields: ['contaPaiId', 'codigo', 'descricao', 'tipo'] },
      {
        title: 'Responsabilidade e Regras',
        eyebrow: 'Governança',
        icon: 'admin_panel_settings',
        fields: ['responsavelPadraoId', 'ehPadraoRecebimentoFaturaCartao', 'ativo']
      }
    ]
  };

  return sections[key] ?? [{ title: 'Dados do Cadastro', eyebrow: 'Cadastro', icon: 'edit_note', fields: [] }];
}

function getSummaryTitle(values: Record<string, unknown>, fallback: string) {
  const candidate = values.nome ?? values.descricao ?? values.banco ?? values.codigo;
  const text = typeof candidate === 'string' ? candidate.trim() : '';
  return text || fallback;
}

function PessoaPixKeysSection({
  control,
  errors
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: FieldErrors<any>;
}) {
  const { fields, append, remove } = useFieldArray({ control, name: 'chavesPix' });
  const chavesPix = (useWatch({ control, name: 'chavesPix' }) as Array<{ tipo?: string; chave?: string }> | undefined) ?? [];
  const pixErrors = (errors.chavesPix as Array<{ tipo?: { message?: string }; chave?: { message?: string } }> | undefined) ?? [];

  return (
    <FormSection title="Chaves Pix" eyebrow="Dados bancários" icon={<span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>key</span>}>
      <div className="space-y-4">
        <p className="text-sm text-on-surface-variant">Cadastre uma ou mais chaves Pix para esta pessoa.</p>

        {fields.map((item, index) => {
          const tipo = chavesPix[index]?.tipo ?? 'CpfCnpj';
          const mask = getPixMaskKind(tipo);
          const fieldError = pixErrors[index];

          return (
            <div key={item.id} className="space-y-1">
              <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-[220px_minmax(0,1fr)_auto]">
                <div className="space-y-2">
                  {index === 0 ? <label className={formLabelClass}>Tipo da Chave Pix</label> : null}
                  <Controller
                    control={control}
                    name={`chavesPix.${index}.tipo`}
                    render={({ field }) => (
                      <ComboBox
                        aria-label={`Tipo da chave Pix ${index + 1}`}
                        value={field.value ?? 'CpfCnpj'}
                        onChange={field.onChange}
                        options={pessoaPixTipoOptions}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  {index === 0 ? <label className={formLabelClass}>Chave Pix</label> : null}
                  <Controller
                    control={control}
                    name={`chavesPix.${index}.chave`}
                    render={({ field }) => (
                      <input
                        value={mask ? applyInputMask(mask, String(field.value ?? '')) : String(field.value ?? '')}
                        onChange={(event) => field.onChange(mask ? extractDigits(event.target.value) : event.target.value)}
                        className={formFieldClass}
                        placeholder={getPixPlaceholder(tipo)}
                      />
                    )}
                  />
                </div>

                <Button type="button" variant="danger" size="lg" icon={<span className="material-symbols-outlined text-base">delete</span>} onClick={() => remove(index)}>
                  Remover
                </Button>
              </div>

              {(fieldError?.tipo?.message || fieldError?.chave?.message) ? (
                <div className="grid grid-cols-1 gap-x-4 md:grid-cols-[220px_minmax(0,1fr)_auto]">
                  <FieldError message={fieldError?.tipo?.message} />
                  <FieldError message={fieldError?.chave?.message} />
                  <div />
                </div>
              ) : null}
            </div>
          );
        })}

        <Button type="button" variant="secondary" icon={<span className="material-symbols-outlined text-base">add</span>} onClick={() => append({ tipo: 'CpfCnpj', chave: '' })}>
          Adicionar chave Pix
        </Button>
      </div>
    </FormSection>
  );
}

export function MasterDataFormPage({
  config
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: MasterDataModuleConfig<any, any, any, any>;
}) {
  type TPayload = Record<string, unknown>;
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(Boolean(id));
  const [loadError, setLoadError] = useState<string>();
  const [submitError, setSubmitError] = useState<string>();
  const [loadedOptions, setLoadedOptions] = useState<Record<string, SelectOption[]>>({});
  const [responsavelModalOpen, setResponsavelModalOpen] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors, isSubmitting, isValid }
  } = useForm<TPayload>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(config.schema as any) as never,
    defaultValues: config.defaultValues as TPayload,
    mode: 'onChange'
  });

  const watchedValues = useWatch({ control }) as Record<string, unknown>;
  const isContaGerencial = config.key === 'contas-gerenciais';
  const isPessoa = config.key === 'pessoas';
  const contaPaiIdValue = useWatch({ control, name: 'contaPaiId' }) as string | undefined;
  const contaGerencialOptions = isContaGerencial ? loadedOptions['contaPaiId'] ?? [] : [];
  const contaGerencialPaiSelecionada = contaGerencialOptions.find((option) => option.value === contaPaiIdValue);
  const tipoContaGerencialHerdado = getContaGerencialOptionData(contaGerencialPaiSelecionada)?.tipo;

  useEffect(() => {
    async function loadOptions() {
      const optionEntries = await Promise.all(
        config.fields
          .filter((field) => field.loadOptions)
          .map(async (field) => [field.name, await field.loadOptions!()] as const)
      );

      setLoadedOptions(Object.fromEntries(optionEntries));
    }

    void loadOptions();
  }, [config.fields]);

  useEffect(() => {
    if (!id) {
      reset(config.defaultValues);
      return;
    }

    async function loadDetail() {
      setLoading(true);
      setLoadError(undefined);

      try {
        const detail = await config.detail(id!);
        reset(config.toFormValues(detail));
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Falha ao carregar o cadastro.');
      } finally {
        setLoading(false);
      }
    }

    void loadDetail();
  }, [config, id, reset]);

  useEffect(() => {
    if (isContaGerencial && !id && loadedOptions['contaPaiId']) {
      const nextCode = buildNextContaGerencialCode(loadedOptions['contaPaiId'], contaPaiIdValue);
      if (nextCode) setValue('codigo', nextCode, { shouldValidate: true });
    }
  }, [isContaGerencial, id, contaPaiIdValue, loadedOptions, setValue]);

  useEffect(() => {
    if (!isContaGerencial || !tipoContaGerencialHerdado) return;
    setValue('tipo', tipoContaGerencialHerdado, { shouldValidate: true });
  }, [isContaGerencial, setValue, tipoContaGerencialHerdado]);

  const fieldByName = useMemo(() => new Map(config.fields.map((field) => [field.name, field])), [config.fields]);
  const sections = useMemo(() => {
    const planned = sectionPlanFor(config.key);
    if (planned.length === 1 && planned[0].fields.length === 0) {
      return [{ ...planned[0], fields: config.fields.map((field) => field.name) }];
    }

    const knownFieldNames = new Set(planned.flatMap((section) => section.fields));
    const fallbackFields = config.fields.map((field) => field.name).filter((name) => !knownFieldNames.has(name));

    return planned.concat(
      fallbackFields.length > 0 ? [{ title: 'Dados Complementares', eyebrow: 'Cadastro', icon: 'more_horiz', fields: fallbackFields }] : []
    );
  }, [config.fields, config.key]);

  async function reloadFieldOptions(fieldName: string) {
    const field = config.fields.find((item) => item.name === fieldName);
    if (!field?.loadOptions) {
      return;
    }

    const options = await field.loadOptions();
    setLoadedOptions((prev) => ({ ...prev, [fieldName]: options }));
  }

  async function onSubmit(payload: TPayload) {
    setSubmitError(undefined);
    try {
      if (id) await config.update(id, payload);
      else await config.create(payload);

      navigate(config.routeBase);
    } catch (error) {
      const apiError = error as AxiosError<ApiErrorResponse>;
      const validationErrors = apiError.response?.data?.errors;

      if (validationErrors) {
        applyServerValidationErrors(validationErrors, (field, message) =>
          setError(field as never, { type: 'server', message })
        );
        return;
      }

      setSubmitError(error instanceof Error ? error.message : 'Falha ao salvar o cadastro.');
    }
  }

  function renderField(field: FormFieldConfig<TPayload>) {
    const fieldError = errors[field.name as keyof typeof errors]?.message as string | undefined;
    const fullWidth = field.kind === 'textarea' || ['nome', 'descricao', 'observacao'].includes(field.name);

    return (
      <div key={field.name} className={`space-y-2 ${fullWidth ? 'md:col-span-2' : ''}`}>
        <label className={formLabelClass}>{field.label}</label>
        <Controller
          control={control}
          name={field.name as never}
          render={({ field: controlledField }) => {
            if (field.kind === 'text') {
              if (isContaGerencial && field.name === 'codigo') {
                return <ReadonlyField>{String(controlledField.value ?? '') || 'Gerado automaticamente'}</ReadonlyField>;
              }

              return (
                <input
                  {...controlledField}
                  value={
                    field.mask
                      ? applyInputMask(field.mask, String(controlledField.value ?? ''))
                      : String(controlledField.value ?? '')
                  }
                  onChange={(event) => controlledField.onChange(field.mask ? extractDigits(event.target.value) : event.target.value)}
                  className={formFieldClass}
                  placeholder={field.placeholder}
                />
              );
            }

            if (field.kind === 'textarea') {
              return (
                <textarea
                  {...controlledField}
                  value={String(controlledField.value ?? '')}
                  rows={4}
                  className={formTextAreaClass}
                  placeholder={field.placeholder}
                />
              );
            }

            if (field.kind === 'select') {
              if (isContaGerencial && field.name === 'tipo' && tipoContaGerencialHerdado) {
                return <ReadonlyField>{tipoContaGerencialHerdado}</ReadonlyField>;
              }

              return (
                <ComboBox
                  aria-label={field.label}
                  value={controlledField.value === undefined || controlledField.value === null ? '' : String(controlledField.value)}
                  options={toComboOptions(
                    buildFieldOptions(field as FormFieldConfig<Record<string, unknown>>, loadedOptions),
                    isOptionalSelect(field.name)
                  )}
                  placeholder="Selecione..."
                  onChange={(value) => controlledField.onChange(value)}
                  onAddNew={isContaGerencial && field.name === 'responsavelPadraoId' ? () => setResponsavelModalOpen(true) : undefined}
                  addNewLabel="Criar responsavel"
                />
              );
            }

            if (field.kind === 'switch') {
              return (
                <ToggleField
                  checked={Boolean(controlledField.value)}
                  onChange={controlledField.onChange}
                  label={controlledField.value ? 'Ativo' : 'Inativo'}
                  description={field.label}
                />
              );
            }

            if (field.kind === 'number') {
              if (field.numberFormat === 'currency') {
                return (
                  <CurrencyInput
                    value={typeof controlledField.value === 'number' ? controlledField.value : null}
                    onChange={(value) => controlledField.onChange(value ?? (field.nullable ? null : 0))}
                    className={formFieldClass}
                  />
                );
              }

              return (
                <input
                  inputMode="numeric"
                  value={typeof controlledField.value === 'number' ? String(controlledField.value) : ''}
                  onKeyDown={preventScientificNotation}
                  onPaste={handleIntegerPaste}
                  onChange={(event) => controlledField.onChange(parseIntegerInput(event.target.value, field.nullable))}
                  className={formFieldClass}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                />
              );
            }

            if (field.kind === 'date') {
              return (
                <DateInput
                  ariaLabel={field.label}
                  value={String(controlledField.value ?? '')}
                  onChange={(value) => controlledField.onChange(value)}
                />
              );
            }

            return <></>;
          }}
        />
        <FieldError message={fieldError} />
      </div>
    );
  }

  if (loading) return <PageState state="loading" title="Carregando cadastro..." />;
  if (loadError) return <PageState state="error" title="Falha ao carregar cadastro" subtitle={loadError} />;

  const summaryTitle = getSummaryTitle(watchedValues, `Novo ${config.singularTitle.toLowerCase()}`);
  const ativoValue = typeof watchedValues.ativo === 'boolean' ? (watchedValues.ativo ? 'Ativo' : 'Inativo') : 'Pronto';

  return (
    <>
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-8 pb-24 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-7">
          {sections.map((section) => {
            const fields = section.fields.map((fieldName) => fieldByName.get(fieldName)).filter((field): field is FormFieldConfig<TPayload> => Boolean(field));
            if (fields.length === 0) return null;

            return (
              <FormSection
                key={section.title}
                title={section.title}
                eyebrow={section.eyebrow}
                icon={<span className="material-symbols-outlined text-2xl">{section.icon}</span>}
              >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">{fields.map(renderField)}</div>
              </FormSection>
            );
          })}

          {isPessoa ? <PessoaPixKeysSection control={control} errors={errors} /> : null}
        </div>

        <div className="space-y-8 lg:col-span-5">
          <FormActionPanel
            title="Pronto para salvar?"
            eyebrow="Resumo do Cadastro"
            submitLabel={id ? 'Atualizar Cadastro' : 'Confirmar Cadastro'}
            submitDisabled={!isValid || isSubmitting}
            submitting={isSubmitting}
            error={submitError}
            onCancel={() => navigate(config.routeBase)}
            items={[
              { label: 'Cadastro', value: summaryTitle },
              { label: 'Tipo', value: config.singularTitle },
              { label: 'Modo', value: id ? 'Edição' : 'Novo cadastro' },
              { label: 'Status', value: ativoValue, accent: ativoValue === 'Ativo' }
            ]}
          />
        </div>
        </form>
      </div>

      <QuickAddPessoaModal
        open={responsavelModalOpen}
        onClose={() => setResponsavelModalOpen(false)}
        onSuccess={(newId) => {
          void reloadFieldOptions('responsavelPadraoId').then(() => setValue('responsavelPadraoId', newId, { shouldValidate: true }));
        }}
      />
    </>
  );
}

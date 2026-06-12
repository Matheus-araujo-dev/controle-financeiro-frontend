import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Form, Input, InputNumber, Select, Space, Switch, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Controller, useFieldArray, useForm, useWatch, type Control, type FieldErrors } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import { EntityFormShell } from '../../components/forms/EntityFormShell';
import { PageState } from '../../components/states/PageState';
import { applyServerValidationErrors } from '../../services/forms/applyServerValidationErrors';
import type { ApiErrorResponse } from '../../types/api';
import type { FormFieldConfig, MasterDataModuleConfig, SelectOption } from './module-config';
import { applyInputMask, extractDigits } from './input-masks';
import { CurrencyInput } from '../../shared/CurrencyInput';

function buildFieldOptions(
  field: FormFieldConfig<Record<string, unknown>>,
  loadedOptions: Record<string, SelectOption[]>
) {
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

    if (rootCodes.length === 0) {
      return '';
    }

    const maxRoot = Math.max(...rootCodes.map((code) => parseInt(code, 10)));
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

const pessoaPixTipoOptions = [
  { label: 'CPF/CNPJ', value: 'CpfCnpj' },
  { label: 'Email', value: 'Email' },
  { label: 'Telefone', value: 'Telefone' },
  { label: 'Aleatoria', value: 'Aleatoria' }
] as const;

function getPixMaskKind(tipo?: string) {
  if (tipo === 'CpfCnpj') {
    return 'cpfCnpj';
  }

  if (tipo === 'Telefone') {
    return 'phone';
  }

  return undefined;
}

function getPixPlaceholder(tipo?: string) {
  if (tipo === 'CpfCnpj') {
    return 'CPF ou CNPJ da chave Pix';
  }

  if (tipo === 'Email') {
    return 'email@exemplo.com';
  }

  if (tipo === 'Telefone') {
    return '(00) 00000-0000';
  }

  return 'Chave aleatoria';
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
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'chavesPix'
  });
  const chavesPix = (useWatch({ control, name: 'chavesPix' }) as Array<{ tipo?: string; chave?: string }> | undefined) ?? [];
  const pixErrors = (errors.chavesPix as Array<{ tipo?: { message?: string }; chave?: { message?: string } }> | undefined) ?? [];

  return (
    <Space orientation="vertical" size={12} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={5} style={{ marginBottom: 4 }}>
          Chaves Pix
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Cadastre uma ou mais chaves Pix para esta pessoa.
        </Typography.Paragraph>
      </div>

      {fields.map((item, index) => {
        const tipo = chavesPix[index]?.tipo ?? 'CpfCnpj';
        const mask = getPixMaskKind(tipo);
        const fieldError = pixErrors[index];

        return (
          <Space key={item.id} align="start" size={12} wrap style={{ display: 'flex' }}>
            <Controller
              control={control}
              name={`chavesPix.${index}.tipo`}
              render={({ field }) => (
                <Form.Item
                  label={index === 0 ? 'Tipo da chave Pix' : undefined}
                  help={fieldError?.tipo?.message as string | undefined}
                  validateStatus={fieldError?.tipo ? 'error' : undefined}
                  style={{ minWidth: 180, marginBottom: 0 }}
                >
                  <Select
                    value={field.value ?? 'CpfCnpj'}
                    options={pessoaPixTipoOptions.map((option) => ({ label: option.label, value: option.value }))}
                    onChange={(value) => field.onChange(value)}
                  />
                </Form.Item>
              )}
            />

            <Controller
              control={control}
              name={`chavesPix.${index}.chave`}
              render={({ field }) => (
                <Form.Item
                  label={index === 0 ? 'Chave Pix' : undefined}
                  help={fieldError?.chave?.message as string | undefined}
                  validateStatus={fieldError?.chave ? 'error' : undefined}
                  style={{ minWidth: 320, flex: 1, marginBottom: 0 }}
                >
                  <Input
                    value={mask ? applyInputMask(mask, String(field.value ?? '')) : String(field.value ?? '')}
                    onChange={(event) => field.onChange(mask ? extractDigits(event.target.value) : event.target.value)}
                    placeholder={getPixPlaceholder(tipo)}
                  />
                </Form.Item>
              )}
            />

            <Button htmlType="button" danger icon={<DeleteOutlined />} onClick={() => remove(index)}>
              Remover
            </Button>
          </Space>
        );
      })}

      <Button
        htmlType="button"
        type="dashed"
        icon={<PlusOutlined />}
        onClick={() => append({ tipo: 'CpfCnpj', chave: '' })}
        style={{ alignSelf: 'flex-start' }}
      >
        Adicionar chave Pix
      </Button>
    </Space>
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
  const [errorMessage, setErrorMessage] = useState<string>();
  const [loadedOptions, setLoadedOptions] = useState<Record<string, SelectOption[]>>({});

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
      setErrorMessage(undefined);

      try {
        const detail = await config.detail(id!);
        reset(config.toFormValues(detail));
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar o cadastro.');
      } finally {
        setLoading(false);
      }
    }

    void loadDetail();
  }, [config, id, reset]);

  const isContaGerencial = config.key === 'contas-gerenciais';
  const isPessoa = config.key === 'pessoas';
  const contaPaiIdValue = useWatch({ control, name: 'contaPaiId' }) as string | undefined;
  const contaGerencialOptions = isContaGerencial ? loadedOptions['contaPaiId'] ?? [] : [];
  const contaGerencialPaiSelecionada = contaGerencialOptions.find((option) => option.value === contaPaiIdValue);
  const tipoContaGerencialHerdado = getContaGerencialOptionData(contaGerencialPaiSelecionada)?.tipo;

  useEffect(() => {
    if (isContaGerencial && !id && loadedOptions['contaPaiId']) {
      const nextCode = buildNextContaGerencialCode(loadedOptions['contaPaiId'], contaPaiIdValue);

      if (nextCode) {
        setValue('codigo', nextCode, { shouldValidate: true });
      }
    }
  }, [isContaGerencial, id, contaPaiIdValue, loadedOptions, setValue]);

  useEffect(() => {
    if (!isContaGerencial || !tipoContaGerencialHerdado) {
      return;
    }

    setValue('tipo', tipoContaGerencialHerdado, { shouldValidate: true });
  }, [isContaGerencial, setValue, tipoContaGerencialHerdado]);

  async function onSubmit(payload: Record<string, any>) {
    try {
      if (id) {
        await config.update(id, payload);
      } else {
        await config.create(payload);
      }

      navigate(config.routeBase);
    } catch (error) {
      const apiError = error as AxiosError<ApiErrorResponse>;
      const validationErrors = apiError.response?.data?.errors;

      if (validationErrors) {
        applyServerValidationErrors(validationErrors, (field, message) =>
          setError(field as never, {
            type: 'server',
            message
          })
        );

        return;
      }

      setErrorMessage(error instanceof Error ? error.message : 'Falha ao salvar o cadastro.');
    }
  }

  if (loading) {
    return <PageState state="loading" title="Carregando cadastro..." />;
  }

  if (errorMessage) {
    return <PageState state="error" title="Falha ao carregar cadastro" subtitle={errorMessage} />;
  }

  return (
    <Space orientation="vertical" size={24} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={4}>
          {id ? `Editar ${config.singularTitle.toLowerCase()}` : `Nova ${config.singularTitle.toLowerCase()}`}
        </Typography.Title>
        <Typography.Paragraph>{config.formDescription}</Typography.Paragraph>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <EntityFormShell
          title={config.singularTitle}
          description={config.formDescription}
          isValid={isValid}
          isSubmitting={isSubmitting}
          onCancel={() => navigate(config.routeBase)}
        >
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            {config.fields.map((field) => (
              <Controller
                key={field.name}
                control={control}
                name={field.name as never}
                render={({ field: controlledField }) => (
                  <Form.Item
                    label={field.label}
                    help={errors[field.name as keyof typeof errors]?.message as string | undefined}
                    validateStatus={errors[field.name as keyof typeof errors] ? 'error' : undefined}
                  >
                    {field.kind === 'text' ? (
                      isContaGerencial && field.name === 'codigo' ? (
                        <Typography.Text
                          style={{ display: 'block', padding: '4px 11px', background: 'rgba(0,0,0,0.1)', borderRadius: 8, fontFamily: 'monospace' }}
                        >
                          {String(controlledField.value ?? '') || '—'}
                        </Typography.Text>
                      ) : (
                        <Input
                          {...controlledField}
                          value={
                            field.mask
                              ? applyInputMask(field.mask, String(controlledField.value ?? ''))
                              : String(controlledField.value ?? '')
                          }
                          onChange={(event) =>
                            controlledField.onChange(field.mask ? extractDigits(event.target.value) : event.target.value)
                          }
                          placeholder={field.placeholder}
                        />
                      )
                    ) : null}
                    {field.kind === 'textarea' ? (
                      <Input.TextArea
                        {...controlledField}
                        value={String(controlledField.value ?? '')}
                        rows={4}
                        placeholder={field.placeholder}
                      />
                    ) : null}
                    {field.kind === 'select' ? (
                      isContaGerencial && field.name === 'tipo' && tipoContaGerencialHerdado ? (
                        <Typography.Text
                          style={{ display: 'block', padding: '4px 11px', background: 'rgba(0,0,0,0.1)', borderRadius: 8 }}
                        >
                          {tipoContaGerencialHerdado}
                        </Typography.Text>
                      ) : (
                        <Select
                          value={controlledField.value === '' ? undefined : (controlledField.value as string | undefined)}
                          options={buildFieldOptions(field as FormFieldConfig<Record<string, unknown>>, loadedOptions)}
                          onChange={(value) => controlledField.onChange(value ?? '')}
                          allowClear
                          showSearch
                          optionFilterProp="label"
                          filterOption={(input, option) =>
                            String(option?.label ?? '')
                              .toLowerCase()
                              .includes(input.toLowerCase())
                          }
                        />
                      )
                    ) : null}
                    {field.kind === 'switch' ? (
                      <Switch checked={Boolean(controlledField.value)} onChange={controlledField.onChange} />
                    ) : null}
                    {field.kind === 'number' ? (
                      field.numberFormat === 'currency' ? (
                        <CurrencyInput
                          value={typeof controlledField.value === 'number' ? controlledField.value : null}
                          onChange={(value) => controlledField.onChange(value ?? (field.nullable ? null : 0))}
                          style={{ width: '100%' }}
                        />
                      ) : (
                        <InputNumber
                          value={typeof controlledField.value === 'number' ? controlledField.value : undefined}
                          onChange={(value) => controlledField.onChange(value ?? (field.nullable ? null : 0))}
                          style={{ width: '100%' }}
                          min={field.min}
                          max={field.max}
                          step={field.step}
                        />
                      )
                    ) : null}
                    {field.kind === 'date' ? (
                      <Input type="date" value={String(controlledField.value ?? '')} onChange={controlledField.onChange} />
                    ) : null}
                  </Form.Item>
                )}
              />
            ))}

            {isPessoa ? <PessoaPixKeysSection control={control} errors={errors} /> : null}
          </Space>
        </EntityFormShell>
      </form>

      <Button>
        <Link to={config.routeBase}>Voltar para {config.title.toLowerCase()}</Link>
      </Button>
    </Space>
  );
}

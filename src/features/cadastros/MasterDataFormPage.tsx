import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Form, Input, InputNumber, Select, Space, Switch, Typography } from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import { EntityFormShell } from '../../components/forms/EntityFormShell';
import { PageState } from '../../components/states/PageState';
import { applyServerValidationErrors } from '../../services/forms/applyServerValidationErrors';
import type { ApiErrorResponse } from '../../types/api';
import type { FormFieldConfig, MasterDataModuleConfig, SelectOption } from './module-config';

function buildFieldOptions(
  field: FormFieldConfig<Record<string, unknown>>,
  loadedOptions: Record<string, SelectOption[]>
) {
  return [...(field.options ?? []), ...(loadedOptions[field.name] ?? [])];
}

export function MasterDataFormPage({
  config
}: {
  config: MasterDataModuleConfig<any, any, any, any>;
}) {
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
    formState: { errors, isSubmitting, isValid }
  } = useForm<Record<string, any>>({
    resolver: zodResolver(config.schema as never) as never,
    defaultValues: config.defaultValues,
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
                      <Input {...controlledField} value={String(controlledField.value ?? '')} placeholder={field.placeholder} />
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
                      <Select
                        value={controlledField.value === '' ? undefined : (controlledField.value as string | undefined)}
                        options={buildFieldOptions(field as FormFieldConfig<Record<string, unknown>>, loadedOptions)}
                        onChange={(value) => controlledField.onChange(value ?? '')}
                        allowClear
                      />
                    ) : null}
                    {field.kind === 'switch' ? (
                      <Switch checked={Boolean(controlledField.value)} onChange={controlledField.onChange} />
                    ) : null}
                    {field.kind === 'number' ? (
                      <InputNumber
                        value={typeof controlledField.value === 'number' ? controlledField.value : undefined}
                        onChange={(value) => controlledField.onChange(value ?? (field.name.includes('limite') ? null : 0))}
                        style={{ width: '100%' }}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                      />
                    ) : null}
                    {field.kind === 'date' ? (
                      <Input type="date" value={String(controlledField.value ?? '')} onChange={controlledField.onChange} />
                    ) : null}
                  </Form.Item>
                )}
              />
            ))}
          </Space>
        </EntityFormShell>
      </form>

      <Button>
        <Link to={config.routeBase}>Voltar para {config.title.toLowerCase()}</Link>
      </Button>
    </Space>
  );
}

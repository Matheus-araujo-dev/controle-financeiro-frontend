import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, Form, Input, InputNumber, Select, Space, Typography } from 'antd';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import { EntityFormShell } from '../../components/forms/EntityFormShell';
import { PageState } from '../../components/states/PageState';
import { applyServerValidationErrors } from '../../services/forms/applyServerValidationErrors';
import type { ApiErrorResponse } from '../../types/api';
import type { FinanceiroModuleConfig, FinanceiroFormValues, FinanceiroLiquidacaoFormValues, FormaPagamentoOption, SelectOption } from './module-config';
import { calculateValorLiquido, resolveFormaPagamentoBehavior } from './module-config';
import { financialAccountFormSchema } from './schemas';

export function FinancialAccountFormPage({
  config
}: {
  config: FinanceiroModuleConfig<any, any, any>;
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(Boolean(id));
  const [errorMessage, setErrorMessage] = useState<string>();
  const [pessoaOptions, setPessoaOptions] = useState<SelectOption[]>([]);
  const [formaPagamentoOptions, setFormaPagamentoOptions] = useState<FormaPagamentoOption[]>([]);
  const [contaBancariaOptions, setContaBancariaOptions] = useState<SelectOption[]>([]);
  const [cartaoOptions, setCartaoOptions] = useState<SelectOption[]>([]);
  const [rateioOptions, setRateioOptions] = useState<SelectOption[]>([]);
  const [detailStatus, setDetailStatus] = useState<string>();
  const [actionValues, setActionValues] = useState<FinanceiroLiquidacaoFormValues>({
    dataLiquidacao: '',
    contaBancariaId: ''
  });
  const [actionLoading, setActionLoading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting, isValid }
  } = useForm<FinanceiroFormValues>({
    resolver: zodResolver(financialAccountFormSchema),
    defaultValues: config.defaultValues,
    mode: 'onChange'
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'rateios'
  });

  const watchedValues = watch();
  const valorLiquido = calculateValorLiquido(watchedValues);
  const totalRateios = watchedValues.rateios.reduce((total, item) => total + (Number(item.valor) || 0), 0);
  const formaPagamentoBehavior = useMemo(
    () => resolveFormaPagamentoBehavior(watchedValues.formaPagamentoId, formaPagamentoOptions),
    [watchedValues.formaPagamentoId, formaPagamentoOptions]
  );

  useEffect(() => {
    async function loadOptions() {
      const [pessoas, formas, contas, cartoes, rateios] = await Promise.all([
        config.loadPessoaOptions(),
        config.loadFormaPagamentoOptions(),
        config.loadContaBancariaOptions(),
        config.loadCartaoOptions(),
        config.loadRateioOptions()
      ]);

      setPessoaOptions(pessoas);
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
      reset(config.defaultValues);
      setDetailStatus(undefined);
      return;
    }

    async function loadDetail(currentId: string) {
      setLoading(true);
      setErrorMessage(undefined);

      try {
        const detail = await config.detail(currentId);
        reset(config.toFormValues(detail));
        setDetailStatus(detail.statusCodigo);
        setActionValues({
          dataLiquidacao: detail.dataLiquidacao ?? detail.dataVencimento,
          contaBancariaId: detail.contaBancariaId ?? ''
        });
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar o lancamento.');
      } finally {
        setLoading(false);
      }
    }

    void loadDetail(entityId);
  }, [config, id, reset]);

  async function onSubmit(values: FinanceiroFormValues) {
    try {
      if (id) {
        await config.update(id, values);
      } else {
        await config.create(values);
      }

      navigate(config.routeBase);
    } catch (error) {
      const apiError = error as AxiosError<ApiErrorResponse>;
      const validationErrors = apiError.response?.data?.errors;

      if (validationErrors) {
        applyServerValidationErrors(validationErrors, (field, message) =>
          setError(field as keyof FinanceiroFormValues, {
            type: 'server',
            message
          })
        );
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : 'Falha ao salvar o lancamento.');
    }
  }

  async function liquidar() {
    if (!id || !config.liquidar) {
      return;
    }

    setActionLoading(true);
    setErrorMessage(undefined);

    try {
      await config.liquidar(id, actionValues);
      navigate(config.routeBase);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao liquidar o lancamento.');
    } finally {
      setActionLoading(false);
    }
  }

  async function cancelar() {
    if (!id || !config.cancelar) {
      return;
    }

    setActionLoading(true);
    setErrorMessage(undefined);

    try {
      await config.cancelar(id);
      navigate(config.routeBase);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao cancelar o lancamento.');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <PageState state="loading" title="Carregando lancamento..." />;
  }

  if (errorMessage && !id) {
    return <PageState state="error" title="Falha ao carregar lancamento" subtitle={errorMessage} />;
  }

  return (
    <Space orientation="vertical" size={24} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={4}>
          {id ? `Editar ${config.singularTitle.toLowerCase()}` : `Nova ${config.singularTitle.toLowerCase()}`}
        </Typography.Title>
        <Typography.Paragraph>{config.formDescription}</Typography.Paragraph>
      </div>

      {errorMessage ? <Typography.Text type="danger">{errorMessage}</Typography.Text> : null}

      <form onSubmit={handleSubmit(onSubmit)}>
        <EntityFormShell
          title={config.singularTitle}
          description={config.formDescription}
          isValid={isValid}
          isSubmitting={isSubmitting}
          onCancel={() => navigate(config.routeBase)}
        >
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Controller
              control={control}
              name="descricao"
              render={({ field }) => (
                <Form.Item label="Descricao" help={errors.descricao?.message} validateStatus={errors.descricao ? 'error' : undefined}>
                  <Input {...field} />
                </Form.Item>
              )}
            />

            <Space wrap style={{ width: '100%' }}>
              <Controller
                control={control}
                name="numeroDocumento"
                render={({ field }) => (
                  <Form.Item label="Numero documento" help={errors.numeroDocumento?.message}>
                    <Input {...field} value={field.value ?? ''} style={{ width: 220 }} />
                  </Form.Item>
                )}
              />
              <Controller
                control={control}
                name="pessoaId"
                render={({ field }) => (
                  <Form.Item label={config.personLabel} help={errors.pessoaId?.message} validateStatus={errors.pessoaId ? 'error' : undefined}>
                    <Select value={field.value || undefined} options={pessoaOptions} onChange={(value) => field.onChange(value ?? '')} style={{ width: 240 }} />
                  </Form.Item>
                )}
              />
              <Controller
                control={control}
                name="responsavelId"
                render={({ field }) => (
                  <Form.Item label="Responsavel" help={errors.responsavelId?.message}>
                    <Select value={field.value || undefined} options={pessoaOptions} onChange={(value) => field.onChange(value ?? '')} allowClear style={{ width: 220 }} />
                  </Form.Item>
                )}
              />
            </Space>

            <Space wrap style={{ width: '100%' }}>
              <Controller
                control={control}
                name="dataEmissao"
                render={({ field }) => (
                  <Form.Item label="Data emissao" help={errors.dataEmissao?.message} validateStatus={errors.dataEmissao ? 'error' : undefined}>
                    <Input type="date" {...field} value={field.value ?? ''} />
                  </Form.Item>
                )}
              />
              <Controller
                control={control}
                name="dataVencimento"
                render={({ field }) => (
                  <Form.Item label="Data vencimento" help={errors.dataVencimento?.message} validateStatus={errors.dataVencimento ? 'error' : undefined}>
                    <Input type="date" {...field} value={field.value ?? ''} />
                  </Form.Item>
                )}
              />
              <Controller
                control={control}
                name="quantidadeParcelas"
                render={({ field }) => (
                  <Form.Item label="Parcelas" help={errors.quantidadeParcelas?.message} validateStatus={errors.quantidadeParcelas ? 'error' : undefined}>
                    <InputNumber
                      min={1}
                      value={field.value}
                      disabled={Boolean(id)}
                      onChange={(value) => field.onChange(value ?? 1)}
                    />
                  </Form.Item>
                )}
              />
            </Space>

            <Space wrap style={{ width: '100%' }}>
              <Controller
                control={control}
                name="formaPagamentoId"
                render={({ field }) => (
                  <Form.Item label="Forma de pagamento" help={errors.formaPagamentoId?.message} validateStatus={errors.formaPagamentoId ? 'error' : undefined}>
                    <Select value={field.value || undefined} options={formaPagamentoOptions} onChange={(value) => field.onChange(value ?? '')} style={{ width: 240 }} />
                  </Form.Item>
                )}
              />
              {formaPagamentoBehavior.ehCartao ? (
                <Controller
                  control={control}
                  name="cartaoId"
                  render={({ field }) => (
                    <Form.Item label="Cartao" help={errors.cartaoId?.message}>
                      <Select value={field.value || undefined} options={cartaoOptions} onChange={(value) => field.onChange(value ?? '')} allowClear style={{ width: 240 }} />
                    </Form.Item>
                  )}
                />
              ) : null}
              {formaPagamentoBehavior.baixarAutomaticamente ? (
                <>
                  <Controller
                    control={control}
                    name="contaBancariaId"
                    render={({ field }) => (
                      <Form.Item label="Conta bancaria" help={errors.contaBancariaId?.message}>
                        <Select value={field.value || undefined} options={contaBancariaOptions} onChange={(value) => field.onChange(value ?? '')} style={{ width: 240 }} />
                      </Form.Item>
                    )}
                  />
                  <Controller
                    control={control}
                    name="dataLiquidacao"
                    render={({ field }) => (
                      <Form.Item label="Data liquidacao" help={errors.dataLiquidacao?.message}>
                        <Input type="date" {...field} value={field.value ?? ''} />
                      </Form.Item>
                    )}
                  />
                </>
              ) : null}
            </Space>

            <Space wrap style={{ width: '100%' }}>
              <Controller
                control={control}
                name="valorOriginal"
                render={({ field }) => (
                  <Form.Item label="Valor original">
                    <InputNumber min={0} step={0.01} value={field.value} onChange={(value) => field.onChange(value ?? 0)} style={{ width: 160 }} />
                  </Form.Item>
                )}
              />
              <Controller
                control={control}
                name="valorDesconto"
                render={({ field }) => (
                  <Form.Item label="Desconto">
                    <InputNumber min={0} step={0.01} value={field.value} onChange={(value) => field.onChange(value ?? 0)} style={{ width: 160 }} />
                  </Form.Item>
                )}
              />
              <Controller
                control={control}
                name="valorJuros"
                render={({ field }) => (
                  <Form.Item label="Juros">
                    <InputNumber min={0} step={0.01} value={field.value} onChange={(value) => field.onChange(value ?? 0)} style={{ width: 160 }} />
                  </Form.Item>
                )}
              />
              <Controller
                control={control}
                name="valorMulta"
                render={({ field }) => (
                  <Form.Item label="Multa">
                    <InputNumber min={0} step={0.01} value={field.value} onChange={(value) => field.onChange(value ?? 0)} style={{ width: 160 }} />
                  </Form.Item>
                )}
              />
            </Space>

            <Typography.Text strong>Valor liquido: {valorLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Typography.Text>

            <Controller
              control={control}
              name="observacao"
              render={({ field }) => (
                <Form.Item label="Observacao">
                  <Input.TextArea {...field} value={field.value ?? ''} rows={3} />
                </Form.Item>
              )}
            />

            <div>
              <Typography.Title level={5}>Rateios</Typography.Title>
              <Typography.Paragraph>Total informado: {totalRateios.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Typography.Paragraph>
              {errors.rateios?.message ? <Typography.Text type="danger">{errors.rateios.message}</Typography.Text> : null}
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {fields.map((item, index) => (
                  <Space key={item.id} wrap align="start">
                    <Controller
                      control={control}
                      name={`rateios.${index}.contaGerencialId`}
                      render={({ field }) => (
                        <Form.Item
                          label={`Conta gerencial ${index + 1}`}
                          help={errors.rateios?.[index]?.contaGerencialId?.message}
                          validateStatus={errors.rateios?.[index]?.contaGerencialId ? 'error' : undefined}
                        >
                          <Select value={field.value || undefined} options={rateioOptions} onChange={(value) => field.onChange(value ?? '')} style={{ width: 260 }} />
                        </Form.Item>
                      )}
                    />
                    <Controller
                      control={control}
                      name={`rateios.${index}.valor`}
                      render={({ field }) => (
                        <Form.Item
                          label={`Valor ${index + 1}`}
                          help={errors.rateios?.[index]?.valor?.message}
                          validateStatus={errors.rateios?.[index]?.valor ? 'error' : undefined}
                        >
                          <InputNumber min={0} step={0.01} value={field.value} onChange={(value) => field.onChange(value ?? 0)} style={{ width: 160 }} />
                        </Form.Item>
                      )}
                    />
                    <Button danger disabled={fields.length === 1} onClick={() => remove(index)}>
                      Remover
                    </Button>
                  </Space>
                ))}
                <Button onClick={() => append({ contaGerencialId: '', valor: 0 })}>Adicionar rateio</Button>
              </Space>
            </div>
          </Space>
        </EntityFormShell>
      </form>

      {id && detailStatus === 'PENDENTE' ? (
        <Card>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div>
              <Typography.Title level={5}>Acoes de negocio</Typography.Title>
              <Typography.Paragraph>Liquidacao e cancelamento do lancamento atual.</Typography.Paragraph>
            </div>
            <Space wrap>
              <Form.Item label="Data liquidacao">
                <Input
                  type="date"
                  value={actionValues.dataLiquidacao}
                  onChange={(event) => setActionValues((current) => ({ ...current, dataLiquidacao: event.target.value }))}
                />
              </Form.Item>
              <Form.Item label="Conta bancaria">
                <Select
                  value={actionValues.contaBancariaId || undefined}
                  options={contaBancariaOptions}
                  onChange={(value) => setActionValues((current) => ({ ...current, contaBancariaId: value ?? '' }))}
                  style={{ width: 240 }}
                />
              </Form.Item>
              <Button type="primary" loading={actionLoading} onClick={() => void liquidar()}>
                Liquidar
              </Button>
              <Button danger loading={actionLoading} onClick={() => void cancelar()}>
                Cancelar
              </Button>
            </Space>
          </Space>
        </Card>
      ) : null}

      <Button>
        <Link to={config.routeBase}>Voltar para {config.title.toLowerCase()}</Link>
      </Button>
    </Space>
  );
}

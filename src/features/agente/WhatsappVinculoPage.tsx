import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Card, Divider, Form, Input, InputNumber, Popconfirm, Spin, Switch, Tag, Typography } from 'antd';
import { MobileOutlined, CheckCircleOutlined, DisconnectOutlined, BellOutlined, WhatsAppOutlined } from '@ant-design/icons';
import { agenteApi, type WhatsappAlertasResponse, type WhatsappStatusResponse } from '../../services/http/agente-api';
import { getApiErrorMessage } from '../../services/http/api-error';
import { notify } from '../../store/notification-store';
import { Button } from '../../components/ui/Button';

const { Title, Text, Paragraph } = Typography;

export function WhatsappVinculoPage() {
  const queryClient = useQueryClient();
  const [salvando, setSalvando] = useState(false);
  const [salvandoAlertas, setSalvandoAlertas] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [form] = Form.useForm<{ telefone: string }>();
  const [formAlertas] = Form.useForm<WhatsappAlertasResponse>();
  const hasInitializedForms = useRef(false);

  const { data: queryData, isLoading } = useQuery({
    queryKey: ['whatsapp', 'vinculo'],
    queryFn: async () => {
      const [s, al] = await Promise.allSettled([
        agenteApi.obterStatusWhatsapp(),
        agenteApi.obterAlertasWhatsapp()
      ]);
      return {
        status: s.status === 'fulfilled' ? s.value : null,
        alertas: al.status === 'fulfilled' ? al.value : null,
        statusError: s.status === 'rejected' ? getApiErrorMessage(s.reason) : null
      };
    },
    staleTime: 60_000
  });

  const status = queryData?.status ?? null;
  const alertas = queryData?.alertas ?? null;

  useEffect(() => {
    if (!queryData || hasInitializedForms.current) return;
    if (queryData.status?.telefone) form.setFieldValue('telefone', queryData.status.telefone);
    if (queryData.alertas) formAlertas.setFieldsValue(queryData.alertas);
    if (queryData.statusError) setErro(queryData.statusError);
    hasInitializedForms.current = true;
  }, [queryData, form, formAlertas]);

  const salvar = async (values: { telefone: string }) => {
    setSalvando(true);
    setErro(null);
    try {
      const res = await agenteApi.registrarWhatsapp({ telefone: values.telefone });
      queryClient.setQueryData(['whatsapp', 'vinculo'], (old: typeof queryData) => ({ ...old, status: res }));
      notify('success', 'WhatsApp vinculado com sucesso.');
    } catch (err) {
      setErro(getApiErrorMessage(err));
    } finally {
      setSalvando(false);
    }
  };

  const desativar = async () => {
    setSalvando(true);
    setErro(null);
    try {
      await agenteApi.desativarWhatsapp();
      queryClient.setQueryData(['whatsapp', 'vinculo'], (old: typeof queryData) => ({
        ...old,
        status: { telefone: null, ativo: false, verificadoEm: null }
      }));
      form.resetFields();
      notify('success', 'WhatsApp desvinculado.');
    } catch (err) {
      setErro(getApiErrorMessage(err));
    } finally {
      setSalvando(false);
    }
  };

  const salvarAlertas = async (values: WhatsappAlertasResponse) => {
    setSalvandoAlertas(true);
    try {
      const res = await agenteApi.salvarAlertasWhatsapp(values);
      queryClient.setQueryData(['whatsapp', 'vinculo'], (old: typeof queryData) => ({ ...old, alertas: res }));
      formAlertas.setFieldsValue(res);
      notify('success', 'Configurações de alertas salvas.');
    } catch (err) {
      notify('error', getApiErrorMessage(err));
    } finally {
      setSalvandoAlertas(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ── Vínculo ───────────────────────────────────────────────── */}
      <p className="text-sm text-on-surface-variant">
        Registre seu número de WhatsApp para usar o assistente financeiro diretamente no app. Mensagens enviadas para o
        número configurado serão respondidas pelo agente.
      </p>

      {status?.ativo && status.telefone && (
        <Card className="bg-surface-container border-outline-variant" size="small">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircleOutlined className="text-primary" />
              <div>
                <Text className="text-on-surface font-medium">{status.telefone}</Text>
                {status.verificadoEm && (
                  <div>
                    <Text className="text-xs text-on-surface-variant">
                      Vinculado em {new Date(status.verificadoEm).toLocaleDateString('pt-BR')}
                    </Text>
                  </div>
                )}
              </div>
            </div>
            <Tag color="success">Ativo</Tag>
          </div>
        </Card>
      )}

      {erro && <Alert type="error" message={erro} showIcon />}

      <Card className="bg-surface-container border-outline-variant">
        <Form form={form} layout="vertical" onFinish={salvar}>
          <Form.Item
            name="telefone"
            label={<Text className="text-on-surface">Número de telefone</Text>}
            rules={[
              { required: true, message: 'Informe o número de telefone.' },
              {
                pattern: /^[\d\s+\-()]{10,20}$/,
                message: 'Informe um número válido (ex: 5531999998888).',
              },
            ]}
            extra={
              <Text className="text-xs text-on-surface-variant">
                Informe o número com código do país e DDD (ex: 5531999998888).
              </Text>
            }
          >
            <Input placeholder="5531999998888" prefix={<MobileOutlined />} disabled={salvando} />
          </Form.Item>

          <div className="flex gap-2">
            <Button type="submit" loading={salvando} icon={<WhatsAppOutlined />}>
              {status?.ativo ? 'Atualizar número' : 'Vincular WhatsApp'}
            </Button>

            {status?.ativo && (
              <Popconfirm
                title="Desvincular WhatsApp?"
                description="O bot não responderá mais mensagens deste número."
                onConfirm={desativar}
                okText="Desvincular"
                cancelText="Cancelar"
                okButtonProps={{ danger: true }}
              >
                <Button variant="danger" icon={<DisconnectOutlined />} loading={salvando}>
                  Desvincular
                </Button>
              </Popconfirm>
            )}
          </div>
        </Form>
      </Card>

      <Alert
        type="info"
        showIcon
        message="Como funciona"
        description={
          <ul className="list-disc list-inside text-sm space-y-1 mt-1">
            <li>Envie uma mensagem para o número da família no WhatsApp.</li>
            <li>O agente responde perguntas financeiras e registra lançamentos.</li>
            <li>Envie foto de comprovante ou áudio — o agente extrai os dados.</li>
            <li>Somente números cadastrados aqui receberão respostas.</li>
          </ul>
        }
      />

      {/* ── Alertas ───────────────────────────────────────────────── */}
      <Divider className="border-outline-variant" />

      <div className="flex items-center gap-2">
        <BellOutlined className="text-primary text-2xl" />
        <Title level={4} className="!mb-0 !text-on-surface">
          Alertas proativos
        </Title>
      </div>

      <Paragraph className="text-on-surface-variant !mb-0">
        Receba mensagens automáticas no WhatsApp antes do vencimento das suas contas.
      </Paragraph>

      <Card className="bg-surface-container border-outline-variant">
        <Form
          form={formAlertas}
          layout="vertical"
          onFinish={salvarAlertas}
          initialValues={alertas ?? { receberVencimento: true, diasAntecedenciaVencimento: 3, receberLimiteCategoria: false, receberLimiteResponsavel: false }}
        >
          <Form.Item
            name="receberVencimento"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="Ativo"
              unCheckedChildren="Inativo"
              disabled={salvandoAlertas}
            />
            <Text className="text-on-surface ml-3">Lembrete de vencimento</Text>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, cur) => prev.receberVencimento !== cur.receberVencimento}
          >
            {({ getFieldValue }) =>
              getFieldValue('receberVencimento') ? (
                <Form.Item
                  name="diasAntecedenciaVencimento"
                  label={<Text className="text-on-surface">Dias de antecedência</Text>}
                  rules={[{ required: true, type: 'number', min: 1, max: 30 }]}
                  extra={
                    <Text className="text-xs text-on-surface-variant">
                      Quantos dias antes do vencimento avisar (1–30).
                    </Text>
                  }
                >
                  <InputNumber min={1} max={30} disabled={salvandoAlertas} className="w-24" />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item name="receberLimiteCategoria" valuePropName="checked">
            <Switch
              checkedChildren="Ativo"
              unCheckedChildren="Inativo"
              disabled
            />
            <Text className="text-on-surface-variant ml-3">Aviso de limite por categoria</Text>
            <Tag className="ml-2" color="default">Em breve</Tag>
          </Form.Item>

          <Form.Item name="receberLimiteResponsavel" valuePropName="checked">
            <Switch
              checkedChildren="Ativo"
              unCheckedChildren="Inativo"
              disabled
            />
            <Text className="text-on-surface-variant ml-3">Aviso de limite por responsável</Text>
            <Tag className="ml-2" color="default">Em breve</Tag>
          </Form.Item>

          <Button type="submit" loading={salvandoAlertas} disabled={!status?.ativo} icon={<CheckCircleOutlined />}>
            Salvar alertas
          </Button>

          {!status?.ativo && (
            <Text className="text-xs text-on-surface-variant ml-3">
              Vincule o WhatsApp primeiro para ativar alertas.
            </Text>
          )}
        </Form>
      </Card>
    </div>
  );
}

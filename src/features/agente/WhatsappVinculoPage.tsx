import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Divider, Form, Input, InputNumber, Popconfirm, Spin, Switch, Tag, Typography } from 'antd';
import { MobileOutlined, CheckCircleOutlined, DisconnectOutlined, BellOutlined } from '@ant-design/icons';
import { agenteApi, type WhatsappAlertasResponse, type WhatsappStatusResponse } from '../../services/http/agente-api';
import { getApiErrorMessage } from '../../services/http/api-error';
import { notify } from '../../store/notification-store';

const { Title, Text, Paragraph } = Typography;

export function WhatsappVinculoPage() {
  const [status, setStatus] = useState<WhatsappStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvandoAlertas, setSalvandoAlertas] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [alertas, setAlertas] = useState<WhatsappAlertasResponse | null>(null);
  const [form] = Form.useForm<{ telefone: string }>();
  const [formAlertas] = Form.useForm<WhatsappAlertasResponse>();

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const [s, al] = await Promise.allSettled([
        agenteApi.obterStatusWhatsapp(),
        agenteApi.obterAlertasWhatsapp(),
      ]);

      if (s.status === 'fulfilled') {
        setStatus(s.value);
        if (s.value.telefone) form.setFieldValue('telefone', s.value.telefone);
      } else {
        setErro(getApiErrorMessage(s.reason));
      }

      if (al.status === 'fulfilled') {
        setAlertas(al.value);
        formAlertas.setFieldsValue(al.value);
      }
    } finally {
      setLoading(false);
    }
  }, [form, formAlertas]);

  useEffect(() => { carregar(); }, [carregar]);

  const salvar = async (values: { telefone: string }) => {
    setSalvando(true);
    setErro(null);
    try {
      const res = await agenteApi.registrarWhatsapp({ telefone: values.telefone });
      setStatus(res);
      notify.success('WhatsApp vinculado com sucesso.');
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
      setStatus({ telefone: null, ativo: false, verificadoEm: null });
      form.resetFields();
      notify.success('WhatsApp desvinculado.');
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
      setAlertas(res);
      formAlertas.setFieldsValue(res);
      notify.success('Configurações de alertas salvas.');
    } catch (err) {
      notify.error(getApiErrorMessage(err));
    } finally {
      setSalvandoAlertas(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg space-y-6">
      {/* ── Vínculo ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <MobileOutlined className="text-primary text-2xl" />
        <Title level={4} className="!mb-0 !text-on-surface">
          Vínculo WhatsApp
        </Title>
      </div>

      <Paragraph className="text-on-surface-variant !mb-0">
        Registre seu número de WhatsApp para usar o assistente financeiro diretamente no app.
        Mensagens enviadas para o número configurado serão respondidas pelo agente.
      </Paragraph>

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
            <Button type="primary" htmlType="submit" loading={salvando} icon={<CheckCircleOutlined />}>
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
                <Button danger icon={<DisconnectOutlined />} loading={salvando}>
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

          <Button
            type="primary"
            htmlType="submit"
            loading={salvandoAlertas}
            disabled={!status?.ativo}
          >
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

import {
  Alert,
  Avatar,
  Card,
  Form,
  Input,
  List,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tag,
  Typography
} from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import {
  alterarPapelMembro,
  criarConvite,
  obterMinhaFamilia,
  removerMembro,
  renomearFamilia,
  revogarConvite,
  type FamiliaDetalheResponse
} from './familia-api';
import { notify } from '../../store/notification-store';
import { useCurrentUser } from '../../store/auth-store';
import { getApiErrorMessage } from '../../services/http/api-error';
import { Button } from '../../components/ui/Button';

const papelOptions = [
  { value: 'Administrador', label: 'Administrador' },
  { value: 'Membro', label: 'Membro' },
  { value: 'Visualizador', label: 'Visualizador' }
];

const papelColors: Record<string, string> = {
  Administrador: 'green',
  Membro: 'gold',
  Visualizador: 'default'
};

export function FamiliaPage() {
  const currentUser = useCurrentUser();
  const [familia, setFamilia] = useState<FamiliaDetalheResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conviteLink, setConviteLink] = useState<string | null>(null);
  const [conviteForm] = Form.useForm<{ email: string; papel: string }>();

  const isAdmin = familia?.meuPapel === 'Administrador';

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFamilia(await obterMinhaFamilia());
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const handleCriarConvite = async (values: { email: string; papel: string }) => {
    try {
      const convite = await criarConvite(values.email, values.papel);
      const link = `${window.location.origin}/convite/${convite.token}`;
      setConviteLink(link);
      conviteForm.resetFields();
      await carregar();
    } catch (err) {
      notify('error', 'Não foi possível criar o convite', getApiErrorMessage(err));
    }
  };

  const handleRevogar = async (id: string) => {
    try {
      await revogarConvite(id);
      notify('success', 'Convite revogado');
      await carregar();
    } catch (err) {
      notify('error', 'Não foi possível revogar o convite', getApiErrorMessage(err));
    }
  };

  const handleAlterarPapel = async (membroId: string, papel: string) => {
    try {
      await alterarPapelMembro(membroId, papel);
      notify('success', 'Papel atualizado');
      await carregar();
    } catch (err) {
      notify('error', 'Não foi possível alterar o papel', getApiErrorMessage(err));
    }
  };

  const handleRemover = async (membroId: string) => {
    try {
      await removerMembro(membroId);
      notify('success', 'Membro removido');
      await carregar();
    } catch (err) {
      notify('error', 'Não foi possível remover o membro', getApiErrorMessage(err));
    }
  };

  const handleRenomear = async (nome: string) => {
    if (!nome.trim() || nome.trim() === familia?.nome) {
      return;
    }

    try {
      setFamilia(await renomearFamilia(nome.trim()));
      notify('success', 'Família renomeada');
    } catch (err) {
      notify('error', 'Não foi possível renomear a família', getApiErrorMessage(err));
    }
  };

  if (error) {
    return (
      <Alert
        type="warning"
        showIcon
        message="Família indisponível"
        description={error}
        action={<Button onClick={() => void carregar()}>Tentar novamente</Button>}
      />
    );
  }

  return (
    <Space direction="vertical" orientation="vertical" size={24} style={{ width: '100%' }}>
      <div>
        <h2 className="text-on-surface-variant font-label text-xs uppercase tracking-[0.2em] mb-2">Conta</h2>
        <h1 className="text-4xl font-headline font-extrabold tracking-tight text-on-surface">
          Minha <span className="text-primary">Família</span>
        </h1>
        <p className="mt-2 text-on-surface-variant font-medium">Gerencie membros, papéis e convites da sua família.</p>
      </div>
      <Card loading={loading} title="Minha família">
        {familia ? (
          <Space direction="vertical" orientation="vertical" size={16} style={{ width: '100%' }}>
            <Typography.Title
              level={3}
              editable={isAdmin ? { onChange: (value) => void handleRenomear(value) } : false}
              style={{ marginTop: 0 }}
            >
              {familia.nome}
            </Typography.Title>
            <Typography.Text type="secondary">
              Seu papel: <Tag color={papelColors[familia.meuPapel]}>{familia.meuPapel}</Tag>
            </Typography.Text>
          </Space>
        ) : null}
      </Card>

      <Card loading={loading} title="Membros">
        <List
          dataSource={familia?.membros ?? []}
          renderItem={(membro) => (
            <List.Item
              actions={
                isAdmin && membro.usuarioId !== currentUser?.userId
                  ? [
                      <Select
                        key="papel"
                        size="small"
                        value={membro.papel}
                        options={papelOptions}
                        style={{ width: 150 }}
                        onChange={(papel) => void handleAlterarPapel(membro.id, papel)}
                      />,
                      <Popconfirm
                        key="remover"
                        title="Remover este membro da família?"
                        onConfirm={() => void handleRemover(membro.id)}
                      >
                      <Button variant="danger" size="sm">
                          Remover
                      </Button>
                      </Popconfirm>
                    ]
                  : [<Tag key="papel" color={papelColors[membro.papel]}>{membro.papel}</Tag>]
              }
            >
              <List.Item.Meta
                avatar={<Avatar src={membro.avatarUrl ?? undefined}>{membro.nome.charAt(0)}</Avatar>}
                title={membro.nome}
                description={membro.email}
              />
            </List.Item>
          )}
        />
      </Card>

      {isAdmin ? (
        <Card title="Convidar para a família">
          <Form form={conviteForm} layout="inline" onFinish={(values) => void handleCriarConvite(values)}>
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Informe o e-mail.' },
                { type: 'email', message: 'E-mail inválido.' }
              ]}
            >
              <Input placeholder="email@exemplo.com" style={{ width: 260 }} />
            </Form.Item>
            <Form.Item name="papel" initialValue="Membro">
              <Select options={papelOptions} style={{ width: 160 }} />
            </Form.Item>
            <Form.Item>
              <Button type="submit" icon={<PlusOutlined />}>
                Gerar convite
              </Button>
            </Form.Item>
          </Form>

          {(familia?.convitesPendentes.length ?? 0) > 0 ? (
            <List
              style={{ marginTop: 16 }}
              header="Convites pendentes"
              dataSource={familia?.convitesPendentes ?? []}
              renderItem={(convite) => (
                <List.Item
                  actions={[
                    <Button key="revogar" variant="danger" size="sm" onClick={() => void handleRevogar(convite.id)}>
                      Revogar
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={convite.emailConvidado}
                    description={`${convite.papel} · expira em ${new Date(convite.expiraEmUtc).toLocaleString('pt-BR')}`}
                  />
                </List.Item>
              )}
            />
          ) : null}
        </Card>
      ) : null}

      <Modal
        open={!!conviteLink}
        title="Convite criado"
        onCancel={() => setConviteLink(null)}
        footer={[
              <Button
            key="copiar"
            onClick={() => {
              if (conviteLink) {
                void navigator.clipboard.writeText(conviteLink);
                notify('success', 'Link copiado');
              }
            }}
          >
            Copiar link
          </Button>,
          <Button key="fechar" onClick={() => setConviteLink(null)}>
            Fechar
          </Button>
        ]}
      >
        <Typography.Paragraph>
          Envie este link para a pessoa convidada. Ela precisa entrar com a conta Google e aceitar o convite.
        </Typography.Paragraph>
        <Typography.Paragraph copyable={{ text: conviteLink ?? '' }} code>
          {conviteLink}
        </Typography.Paragraph>
      </Modal>
    </Space>
  );
}

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
  listarMinhasParticipacoes,
  obterMinhaFamilia,
  removerMembro,
  renomearFamilia,
  revogarConvite,
  selecionarWorkspace,
  type FamiliaDetalheResponse,
  type ParticipacaoWorkspaceResponse
} from './familia-api';
import { notify } from '../../store/notification-store';
import { useAuthStore, useCurrentUser, useWorkspaceAtual } from '../../store/auth-store';
import { getApiErrorMessage } from '../../services/http/api-error';
import { Button } from '../../components/ui/Button';

const MAX_WORKSPACES = 3;

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

function MinhasParticipacoes() {
  const workspaceAtual = useWorkspaceAtual();
  const [participacoes, setParticipacoes] = useState<ParticipacaoWorkspaceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      setParticipacoes(await listarMinhasParticipacoes());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);

  const handleSelecionar = async (id: string) => {
    if (switching) return;
    setSwitching(id);
    try {
      const resultado = await selecionarWorkspace(id);
      useAuthStore.getState().applyTokenResponse(resultado.sessao);
      notify('success', 'Espaço ativo alterado');
      window.location.reload();
    } catch (err) {
      notify('error', 'Não foi possível trocar de espaço', getApiErrorMessage(err));
    } finally {
      setSwitching(null);
    }
  };

  return (
    <Card
      loading={loading}
      title={`Meus espaços (${participacoes.length}/${MAX_WORKSPACES})`}
      extra={
        <Tag color={participacoes.length >= MAX_WORKSPACES ? 'red' : 'green'}>
          {participacoes.length >= MAX_WORKSPACES ? 'Limite atingido' : `${MAX_WORKSPACES - participacoes.length} disponível(is)`}
        </Tag>
      }
    >
      <List
        dataSource={participacoes}
        locale={{ emptyText: 'Nenhum espaço encontrado.' }}
        renderItem={(p) => {
          const ativo = p.id === workspaceAtual?.id || p.ativa;
          return (
            <List.Item
              actions={[
                ativo ? (
                  <Tag key="ativo" color="green">Ativo</Tag>
                ) : (
                  <Button
                    key="selecionar"
                    size="sm"
                    loading={switching === p.id}
                    onClick={() => void handleSelecionar(p.id)}
                  >
                    Usar este espaço
                  </Button>
                )
              ]}
            >
              <List.Item.Meta
                avatar={
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/20">
                    <span className="material-symbols-outlined text-base" style={{ color: '#2bf58e' }}>workspaces</span>
                  </div>
                }
                title={<span className={ativo ? 'font-bold' : undefined}>{p.nome}</span>}
                description={<Tag color={papelColors[p.meuPapel]}>{p.meuPapel}</Tag>}
              />
            </List.Item>
          );
        }}
      />
      {participacoes.length < MAX_WORKSPACES && (
        <Typography.Text type="secondary" className="text-xs mt-2 block">
          Você pode participar de até {MAX_WORKSPACES} espaços. Novos espaços são criados via convite.
        </Typography.Text>
      )}
    </Card>
  );
}

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
      notify('success', 'Espaço renomeado');
    } catch (err) {
      notify('error', 'Não foi possível renomear o espaço', getApiErrorMessage(err));
    }
  };

  return (
    <Space direction="vertical" orientation="vertical" size={24} style={{ width: '100%' }}>
      <p className="text-sm text-on-surface-variant">Gerencie seus espaços, membros e convites.</p>

      <MinhasParticipacoes />

      {error ? (
        <Alert
          type="warning"
          showIcon
          message="Espaço ativo indisponível"
          description={error}
          action={<Button onClick={() => void carregar()}>Tentar novamente</Button>}
        />
      ) : (
        <>
          <Card loading={loading} title="Espaço ativo">
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
                            title="Remover este membro do espaço?"
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
            <Card title="Convidar para o espaço">
              <Alert
                type="info"
                showIcon
                message="Limite de participações"
                description="O convidado só pode aceitar se ainda não estiver em 3 espaços."
                style={{ marginBottom: 16 }}
              />
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
        </>
      )}

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

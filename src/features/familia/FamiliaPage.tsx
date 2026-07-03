import {
  Avatar,
  Card,
  Form,
  Input,
  List,
  Modal,
  Popconfirm,
  Select,
  Space,
  Typography
} from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import {
  alterarPapelMembro,
  criarConvite,
  criarWorkspace,
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

const papelClass: Record<string, string> = {
  Administrador: 'text-primary border-primary/40 bg-primary/10',
  Membro: 'text-amber-400 border-amber-400/40 bg-amber-400/10',
  Visualizador: 'text-on-surface-variant border-white/10 bg-white/5'
};

function PapelBadge({ papel }: { papel: string }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${papelClass[papel] ?? papelClass['Visualizador']}`}>
      {papel}
    </span>
  );
}

function MinhasParticipacoes() {
  const workspaceAtual = useWorkspaceAtual();
  const [participacoes, setParticipacoes] = useState<ParticipacaoWorkspaceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [nomeWorkspace, setNomeWorkspace] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      setParticipacoes(await listarMinhasParticipacoes());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);

  const handleCriarWorkspace = async () => {
    if (creatingWorkspace || participacoes.length >= MAX_WORKSPACES) return;
    setCreatingWorkspace(true);
    try {
      const resultado = await criarWorkspace(nomeWorkspace.trim() ? { nome: nomeWorkspace.trim() } : {});
      useAuthStore.getState().applyTokenResponse(resultado.sessao);
      notify('success', 'Novo espaço criado');
      setModalOpen(false);
      setNomeWorkspace('');
      window.location.reload();
    } catch (err) {
      notify('error', 'Não foi possível criar o espaço', getApiErrorMessage(err));
    } finally {
      setCreatingWorkspace(false);
    }
  };

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

  const podeCriar = participacoes.length < MAX_WORKSPACES;

  return (
    <>
      <Card
        loading={loading}
        title={`Meus espaços (${participacoes.length}/${MAX_WORKSPACES})`}
        extra={
          <Space>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${podeCriar ? 'text-primary border-primary/40 bg-primary/10' : 'text-error border-error/40 bg-error/10'}`}>
              {podeCriar ? `${MAX_WORKSPACES - participacoes.length} disponível(is)` : 'Limite atingido'}
            </span>
            {podeCriar && (
              <Button size="sm" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
                Criar espaço
              </Button>
            )}
          </Space>
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
                    <span key="ativo" className="text-xs font-semibold px-2 py-0.5 rounded-full border text-primary border-primary/40 bg-primary/10">
                      Ativo
                    </span>
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
                  description={<PapelBadge papel={p.meuPapel} />}
                />
              </List.Item>
            );
          }}
        />
        {podeCriar && (
          <p className="text-xs text-on-surface-variant mt-3">
            Você pode criar um novo espaço ou ser convidado para um existente. Limite: {MAX_WORKSPACES} espaços.
          </p>
        )}
      </Card>

      <Modal
        open={modalOpen}
        title="Criar novo espaço"
        onCancel={() => { setModalOpen(false); setNomeWorkspace(''); }}
        onOk={() => void handleCriarWorkspace()}
        okText="Criar"
        cancelText="Cancelar"
        confirmLoading={creatingWorkspace}
        okButtonProps={{ disabled: creatingWorkspace }}
      >
        <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
          <Typography.Text>Escolha um nome para o seu novo espaço de trabalho.</Typography.Text>
          <Input
            autoFocus
            placeholder="Ex: Finanças pessoais, Família Silva..."
            value={nomeWorkspace}
            onChange={(e) => setNomeWorkspace(e.target.value)}
            onPressEnter={() => void handleCriarWorkspace()}
            maxLength={100}
          />
        </Space>
      </Modal>
    </>
  );
}

function EspacoAtivoNome({ nome, isAdmin, onRenomear }: { nome: string; isAdmin: boolean; onRenomear: (v: string) => void }) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(nome);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setValor(nome); }, [nome]);

  const confirmar = () => {
    setEditando(false);
    if (valor.trim() && valor.trim() !== nome) onRenomear(valor.trim());
    else setValor(nome);
  };

  if (editando) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          autoFocus
          className="text-2xl font-bold bg-transparent border-b border-primary outline-none text-on-surface w-full"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') confirmar(); if (e.key === 'Escape') { setEditando(false); setValor(nome); } }}
          onBlur={confirmar}
        />
        <button onClick={confirmar} className="text-primary hover:opacity-70">
          <span className="material-symbols-outlined text-base">check</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      <h3 className="text-2xl font-bold text-on-surface m-0">{nome}</h3>
      {isAdmin && (
        <button
          onClick={() => setEditando(true)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant hover:text-primary"
        >
          <span className="material-symbols-outlined text-base">edit</span>
        </button>
      )}
    </div>
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
    try {
      setFamilia(await renomearFamilia(nome));
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
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <span className="material-symbols-outlined text-amber-400 mt-0.5 text-base">warning</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-300">Espaço ativo indisponível</p>
            <p className="text-xs text-on-surface-variant mt-0.5">{error}</p>
          </div>
          <Button size="sm" onClick={() => void carregar()}>Tentar novamente</Button>
        </div>
      ) : (
        <>
          <Card loading={loading} title="Espaço ativo">
            {familia ? (
              <div className="flex flex-col gap-3">
                <EspacoAtivoNome nome={familia.nome} isAdmin={isAdmin} onRenomear={(v) => void handleRenomear(v)} />
                <p className="text-sm text-on-surface-variant">
                  Seu papel: <PapelBadge papel={familia.meuPapel} />
                </p>
              </div>
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
                      : [<PapelBadge key="papel" papel={membro.papel} />]
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
              <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 mb-4">
                <span className="material-symbols-outlined text-primary mt-0.5 text-base">info</span>
                <div>
                  <p className="text-sm font-semibold text-on-surface">Limite de participações</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">O convidado só pode aceitar se ainda não estiver em 3 espaços.</p>
                </div>
              </div>
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

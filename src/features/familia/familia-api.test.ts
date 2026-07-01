import {
  aceitarConvite,
  alterarPapelMembro,
  criarConvite,
  listarMinhasParticipacoes,
  obterConvite,
  obterMinhaFamilia,
  removerMembro,
  renomearFamilia,
  revogarConvite,
  selecionarWorkspace
} from './familia-api';
import { apiClient } from '../../services/http/api-client';

vi.mock('../../services/http/api-client', () => ({
  apiClient: {
    delete: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn()
  }
}));

const familia = {
  id: 'fam1',
  nome: 'Familia Teste',
  meuPapel: 'Administrador',
  membros: [],
  convitesPendentes: []
};

const participacoes = [
  { id: 'fam1', nome: 'Espaco 1', meuPapel: 'Administrador', ativa: true },
  { id: 'fam2', nome: 'Espaco 2', meuPapel: 'Membro', ativa: false }
];

const sessao = {
  accessToken: 'new-token',
  expiresAtUtc: '2026-08-01T00:00:00Z',
  refreshToken: '',
  usuario: {
    id: 'u1',
    nome: 'User',
    email: 'u1@example.com',
    avatarUrl: null,
    workspace: { id: 'fam2', nome: 'Espaco 2', papel: 'Membro' },
    familia: { id: 'fam2', nome: 'Espaco 2', papel: 'Membro' }
  }
};

describe('familia-api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls the expected family endpoints', async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce({ data: familia } as never)
      .mockResolvedValueOnce({ data: { nomeFamilia: 'Familia Teste', emailConvidado: 'novo@example.com', papel: 'Membro', valido: true } } as never);
    vi.mocked(apiClient.put).mockResolvedValueOnce({ data: { ...familia, nome: 'Novo nome' } } as never).mockResolvedValueOnce({ data: undefined } as never);
    vi.mocked(apiClient.post)
      .mockResolvedValueOnce({
        data: {
          id: 'conv1',
          emailConvidado: 'novo@example.com',
          papel: 'Membro',
          expiraEmUtc: '2026-06-28T00:00:00Z',
          token: 'token1'
        }
      } as never)
      .mockResolvedValueOnce({ data: familia } as never);
    vi.mocked(apiClient.delete).mockResolvedValue(undefined as never);

    await expect(obterMinhaFamilia()).resolves.toEqual(familia);
    await expect(renomearFamilia('Novo nome')).resolves.toMatchObject({ nome: 'Novo nome' });
    await expect(criarConvite('novo@example.com', 'Membro')).resolves.toMatchObject({ token: 'token1' });
    await expect(revogarConvite('conv1')).resolves.toBeUndefined();
    await expect(obterConvite('token1')).resolves.toMatchObject({ valido: true });
    await expect(aceitarConvite('token1')).resolves.toEqual(familia);
    await expect(alterarPapelMembro('m1', 'Administrador')).resolves.toBeUndefined();
    await expect(removerMembro('m1')).resolves.toBeUndefined();

    expect(apiClient.get).toHaveBeenCalledWith('/familias/minha');
    expect(apiClient.put).toHaveBeenCalledWith('/familias/minha', { nome: 'Novo nome' });
    expect(apiClient.post).toHaveBeenCalledWith('/familias/convites', { email: 'novo@example.com', papel: 'Membro' });
    expect(apiClient.delete).toHaveBeenCalledWith('/familias/convites/conv1');
    expect(apiClient.get).toHaveBeenCalledWith('/familias/convites/token1');
    expect(apiClient.post).toHaveBeenCalledWith('/familias/convites/token1/aceitar');
    expect(apiClient.put).toHaveBeenCalledWith('/familias/membros/m1/papel', { papel: 'Administrador' });
    expect(apiClient.delete).toHaveBeenCalledWith('/familias/membros/m1');
  });

  it('lists workspace participacoes', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: participacoes } as never);

    const result = await listarMinhasParticipacoes();

    expect(result).toEqual(participacoes);
    expect(apiClient.get).toHaveBeenCalledWith('/familias');
  });

  it('selects a workspace and returns the new session', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { sessao } } as never);

    const result = await selecionarWorkspace('fam2');

    expect(result).toEqual({ sessao });
    expect(apiClient.post).toHaveBeenCalledWith('/familias/fam2/selecionar');
  });
});

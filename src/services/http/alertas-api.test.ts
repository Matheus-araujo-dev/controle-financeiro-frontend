import { alertasApi } from './alertas-api';
import { apiClient } from './api-client';
import type { ConfiguracaoNotificacao } from '../../types/alertas';

vi.mock('./api-client', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    delete: vi.fn()
  }
}));

const mockConfig: ConfiguracaoNotificacao = {
  emailAtivo: false,
  emailDestinatario: null,
  emailVencimento: true,
  emailDiasAntecedencia: 3,
  emailLimiteCategoria: false,
  pushAtivo: false,
  pushVencimento: true,
  pushDiasAntecedencia: 1,
  pushLimiteCategoria: false
};

describe('alertasApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('configuracao.obter faz GET /alertas/configuracao', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockConfig });
    const result = await alertasApi.configuracao.obter();
    expect(apiClient.get).toHaveBeenCalledWith('/alertas/configuracao');
    expect(result).toEqual(mockConfig);
  });

  it('configuracao.salvar faz PUT /alertas/configuracao', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ data: mockConfig });
    const result = await alertasApi.configuracao.salvar(mockConfig);
    expect(apiClient.put).toHaveBeenCalledWith('/alertas/configuracao', mockConfig);
    expect(result).toEqual(mockConfig);
  });

  it('push.obterVapidKey faz GET /alertas/push/vapid-key', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { publicKey: 'pk123' } });
    const result = await alertasApi.push.obterVapidKey();
    expect(apiClient.get).toHaveBeenCalledWith('/alertas/push/vapid-key');
    expect(result.publicKey).toBe('pk123');
  });

  it('push.listarSubscriptions faz GET /alertas/push/subscriptions', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
    await alertasApi.push.listarSubscriptions();
    expect(apiClient.get).toHaveBeenCalledWith('/alertas/push/subscriptions');
  });

  it('push.registrarSubscription faz POST /alertas/push/subscriptions', async () => {
    const payload = { endpoint: 'https://fcm.googleapis.com/test', p256dh: 'key', auth: 'auth' };
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: '1', endpoint: payload.endpoint, ativo: true } });
    await alertasApi.push.registrarSubscription(payload);
    expect(apiClient.post).toHaveBeenCalledWith('/alertas/push/subscriptions', payload);
  });

  it('push.removerSubscription faz DELETE /alertas/push/subscriptions/{id}', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: undefined });
    await alertasApi.push.removerSubscription('sub-1');
    expect(apiClient.delete).toHaveBeenCalledWith('/alertas/push/subscriptions/sub-1');
  });
});

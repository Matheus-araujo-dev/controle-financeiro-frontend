import { agenteApi } from './agente-api';
import { apiClient } from './api-client';

vi.mock('./api-client', () => ({
  apiClient: {
    delete: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn()
  }
}));

describe('agenteApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls the expected agent and WhatsApp endpoints', async () => {
    vi.mocked(apiClient.post)
      .mockResolvedValueOnce({ data: { resposta: 'ok', conversaId: 'conv1', tokensUsados: 10 } } as never)
      .mockResolvedValueOnce({ data: { insights: [{ tipo: 'INFO', mensagem: 'Resumo' }], tokensUsados: 4 } } as never)
      .mockResolvedValueOnce({
        data: {
          itens: [
            {
              descricao: 'Mercado',
              contaGerencialId: 'cg1',
              contaGerencialDescricao: 'Alimentacao',
              confianca: 0.9
            }
          ]
        }
      } as never);
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce({ data: { telefone: '+5511999999999', ativo: true, verificadoEm: null } } as never)
      .mockResolvedValueOnce({
        data: {
          receberVencimento: true,
          diasAntecedenciaVencimento: 3,
          receberLimiteCategoria: false,
          receberLimiteResponsavel: true
        }
      } as never);
    vi.mocked(apiClient.put)
      .mockResolvedValueOnce({ data: { telefone: '+5511999999999', ativo: true, verificadoEm: null } } as never)
      .mockResolvedValueOnce({
        data: {
          receberVencimento: true,
          diasAntecedenciaVencimento: 5,
          receberLimiteCategoria: true,
          receberLimiteResponsavel: false
        }
      } as never);
    vi.mocked(apiClient.delete).mockResolvedValue(undefined as never);

    await expect(agenteApi.perguntar({ mensagem: 'oi', conversaId: 'conv1' })).resolves.toMatchObject({ conversaId: 'conv1' });
    await expect(agenteApi.obterStatusWhatsapp()).resolves.toMatchObject({ ativo: true });
    await expect(agenteApi.registrarWhatsapp({ telefone: '+5511999999999' })).resolves.toMatchObject({ ativo: true });
    await expect(agenteApi.desativarWhatsapp()).resolves.toBeUndefined();
    await expect(agenteApi.obterAlertasWhatsapp()).resolves.toMatchObject({ diasAntecedenciaVencimento: 3 });
    await expect(
      agenteApi.salvarAlertasWhatsapp({
        receberVencimento: true,
        diasAntecedenciaVencimento: 5,
        receberLimiteCategoria: true,
        receberLimiteResponsavel: false
      })
    ).resolves.toMatchObject({ diasAntecedenciaVencimento: 5 });
    await expect(agenteApi.obterInsights('2026-06')).resolves.toMatchObject({ tokensUsados: 4 });
    await expect(agenteApi.categorizar(['Mercado'])).resolves.toMatchObject({ itens: [expect.objectContaining({ descricao: 'Mercado' })] });

    expect(apiClient.post).toHaveBeenCalledWith('/agente/perguntar', { mensagem: 'oi', conversaId: 'conv1' });
    expect(apiClient.get).toHaveBeenCalledWith('/perfil/whatsapp');
    expect(apiClient.put).toHaveBeenCalledWith('/perfil/whatsapp', { telefone: '+5511999999999' });
    expect(apiClient.delete).toHaveBeenCalledWith('/perfil/whatsapp');
    expect(apiClient.get).toHaveBeenCalledWith('/perfil/whatsapp/alertas');
    expect(apiClient.put).toHaveBeenCalledWith('/perfil/whatsapp/alertas', {
      receberVencimento: true,
      diasAntecedenciaVencimento: 5,
      receberLimiteCategoria: true,
      receberLimiteResponsavel: false
    });
    expect(apiClient.post).toHaveBeenCalledWith('/agente/insights', { mesReferencia: '2026-06' }, expect.objectContaining({ timeout: 60_000, validateStatus: expect.any(Function) }));
    expect(apiClient.post).toHaveBeenCalledWith('/agente/categorizar', { descricoes: ['Mercado'] });
  });
});

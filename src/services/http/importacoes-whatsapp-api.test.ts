import { importacoesWhatsappApi } from './importacoes-whatsapp-api';
import { apiClient } from './api-client';

vi.mock('./api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

describe('importacoesWhatsappApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls the expected endpoints for list, detail, review and reprocess', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { items: [] } } as never);
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: 'iw1' } } as never);

    await importacoesWhatsappApi.listar({ page: 1, pageSize: 10, search: 'academia', statusCodigo: 'PENDENTE_REVISAO' });
    await importacoesWhatsappApi.obterPorId('iw1');
    await importacoesWhatsappApi.reprocessar('iw1');
    await importacoesWhatsappApi.confirmarItem('item1', { observacao: 'Confirmado manualmente' });
    await importacoesWhatsappApi.rejeitarItem('item2', { observacao: 'Arquivo invalido' });

    expect(apiClient.get).toHaveBeenCalledWith('/importacoes-whatsapp', {
      params: {
        page: 1,
        pageSize: 10,
        search: 'academia',
        statusCodigo: 'PENDENTE_REVISAO'
      }
    });
    expect(apiClient.get).toHaveBeenCalledWith('/importacoes-whatsapp/iw1');
    expect(apiClient.post).toHaveBeenCalledWith('/importacoes-whatsapp/iw1/reprocessar', undefined);
    expect(apiClient.post).toHaveBeenCalledWith('/importacoes-whatsapp/itens/item1/confirmar', {
      observacao: 'Confirmado manualmente'
    });
    expect(apiClient.post).toHaveBeenCalledWith('/importacoes-whatsapp/itens/item2/rejeitar', {
      observacao: 'Arquivo invalido'
    });
  });
});

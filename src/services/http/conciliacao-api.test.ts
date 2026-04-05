import { conciliacaoApi } from './conciliacao-api';
import { apiClient } from './api-client';

vi.mock('./api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

describe('conciliacaoApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls the expected endpoints for listagem and vinculacao manual', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { items: [] } } as never);
    vi.mocked(apiClient.post).mockResolvedValue({ data: { itemImportadoWhatsappId: 'iw1' } } as never);

    await conciliacaoApi.listar({
      page: 1,
      pageSize: 10,
      search: 'extrato',
      statusConciliacaoCodigo: 'PENDENTE'
    });
    await conciliacaoApi.confirmarVinculo('iw1', {
      movimentacaoFinanceiraId: 'm1',
      dataConciliacao: '2026-04-08',
      observacao: 'Conciliacao manual'
    });

    expect(apiClient.get).toHaveBeenCalledWith('/conciliacao', {
      params: {
        page: 1,
        pageSize: 10,
        search: 'extrato',
        statusConciliacaoCodigo: 'PENDENTE'
      }
    });
    expect(apiClient.post).toHaveBeenCalledWith('/conciliacao/iw1/confirmar-vinculo', {
      movimentacaoFinanceiraId: 'm1',
      dataConciliacao: '2026-04-08',
      observacao: 'Conciliacao manual'
    });
  });
});

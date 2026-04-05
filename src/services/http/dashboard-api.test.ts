import { dashboardApi } from './dashboard-api';
import { apiClient } from './api-client';

vi.mock('./api-client', () => ({
  apiClient: {
    get: vi.fn()
  }
}));

describe('dashboardApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls the expected summary and cash flow endpoints', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { saldoAtual: 0 } } as never);

    await dashboardApi.obterResumo({
      dataReferencia: '2026-04-05',
      diasProjetados: 10
    });

    await dashboardApi.obterFluxoCaixa({
      dataInicial: '2026-04-05',
      dias: 20,
      visao: 'Economica'
    });

    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/resumo', {
      params: {
        dataReferencia: '2026-04-05',
        diasProjetados: 10
      }
    });

    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/fluxo-caixa', {
      params: {
        dataInicial: '2026-04-05',
        dias: 20,
        visao: 'Economica'
      }
    });
  });
});

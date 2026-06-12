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
      mesReferencia: '2026-04'
    });

    await dashboardApi.obterFluxoCaixa({
      mesReferencia: '2026-04',
      visao: 'Economica'
    });

    await dashboardApi.obterResumoContasGerenciais({
      mesReferencia: '2026-04',
      tipo: 'Despesa'
    });

    await dashboardApi.obterSerieContasGerenciais({
      mesReferencia: '2026-04',
      tipo: 'Despesa',
      contaGerencialId: 'cg-1'
    });

    await dashboardApi.obterLancamentosContaGerencial({
      mesReferencia: '2026-04',
      tipo: 'Despesa',
      contaGerencialId: 'cg-1'
    });

    await dashboardApi.obterResumoCentralPrevisao({
      mesReferencia: '2026-04',
      origem: 'CompraPlanejada',
      status: 'Previsto'
    });

    await dashboardApi.obterItensCentralPrevisao({
      mesReferencia: '2026-04',
      data: '2026-04-15',
      origem: 'CompraPlanejada',
      status: 'Previsto'
    });

    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/resumo', {
      params: {
        mesReferencia: '2026-04'
      }
    });

    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/fluxo-caixa', {
      params: {
        mesReferencia: '2026-04',
        visao: 'Economica'
      }
    });

    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/contas-gerenciais/resumo', {
      params: {
        mesReferencia: '2026-04',
        tipo: 'Despesa'
      }
    });

    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/contas-gerenciais/serie', {
      params: {
        mesReferencia: '2026-04',
        tipo: 'Despesa',
        contaGerencialId: 'cg-1'
      }
    });

    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/contas-gerenciais/lancamentos', {
      params: {
        mesReferencia: '2026-04',
        tipo: 'Despesa',
        contaGerencialId: 'cg-1'
      }
    });

    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/central-previsao/resumo', {
      params: {
        mesReferencia: '2026-04',
        origem: 'CompraPlanejada',
        status: 'Previsto'
      }
    });

    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/central-previsao/itens', {
      params: {
        mesReferencia: '2026-04',
        data: '2026-04-15',
        origem: 'CompraPlanejada',
        status: 'Previsto'
      }
    });
  });
});

import { investimentosApi } from './investimentos-api';
import { apiClient } from './api-client';

vi.mock('./api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn()
  }
}));

describe('investimentosApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls all expected endpoints', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { items: [] } } as never);
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: '1' } } as never);
    vi.mocked(apiClient.put).mockResolvedValue({ data: { id: '1' } } as never);

    await investimentosApi.listar({ page: 1, pageSize: 10 });
    await investimentosApi.obterPorId('inv-1');
    await investimentosApi.criar({
      nome: 'Tesouro Selic 2029',
      tipo: 1,
      liquidez: 1,
      valorInvestido: 5000,
      dataAplicacao: '2026-01-15',
      contaBancariaVinculadaId: 'cb-1'
    });
    await investimentosApi.atualizar('inv-1', {
      nome: 'Tesouro Selic 2030',
      tipo: 1,
      liquidez: 2
    });
    await investimentosApi.atualizarValorAtual('inv-1', 5250);
    await investimentosApi.encerrar('inv-1', 5100);
    await investimentosApi.obterIndicadoresBcb();

    expect(apiClient.get).toHaveBeenCalledWith('/investimentos', { params: { page: 1, pageSize: 10 } });
    expect(apiClient.get).toHaveBeenCalledWith('/investimentos/inv-1');
    expect(apiClient.post).toHaveBeenCalledWith('/investimentos', expect.any(Object));
    expect(apiClient.put).toHaveBeenCalledWith('/investimentos/inv-1', expect.any(Object));
    expect(apiClient.post).toHaveBeenCalledWith('/investimentos/inv-1/atualizar-valor', { valorAtual: 5250 });
    expect(apiClient.post).toHaveBeenCalledWith('/investimentos/inv-1/encerrar', { valorResgate: 5100 });
    expect(apiClient.get).toHaveBeenCalledWith('/investimentos/indicadores-bcb');
  });
});

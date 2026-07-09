import { planosApi } from './planos-api';
import { apiClient } from './api-client';

vi.mock('./api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

describe('planosApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls all expected endpoints', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { items: [] } } as never);
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: '1' } } as never);
    vi.mocked(apiClient.put).mockResolvedValue({ data: { id: '1' } } as never);
    vi.mocked(apiClient.delete).mockResolvedValue({ data: { id: '1' } } as never);

    await planosApi.listar({ page: 1, pageSize: 10, search: '' });
    await planosApi.obterPorId('plan-1');
    await planosApi.criar({
      nome: 'Viagem Europa',
      valorMensal: 1000,
      numParcelas: 10,
      contaBancariaCaixaId: 'cb-1'
    });
    await planosApi.atualizar('plan-1', {
      nome: 'Viagem Europa atualizado',
      valorMensal: 1200,
      numParcelas: 8
    });
    await planosApi.adiantarParcela('plan-1');
    await planosApi.retirarDinheiro('plan-1', 500);
    await planosApi.cancelar('plan-1');

    expect(apiClient.get).toHaveBeenCalledWith('/planos', { params: { page: 1, pageSize: 10, search: '' } });
    expect(apiClient.get).toHaveBeenCalledWith('/planos/plan-1');
    expect(apiClient.post).toHaveBeenCalledWith('/planos', expect.any(Object));
    expect(apiClient.put).toHaveBeenCalledWith('/planos/plan-1', expect.any(Object));
    expect(apiClient.post).toHaveBeenCalledWith('/planos/plan-1/adiantar-parcela');
    expect(apiClient.post).toHaveBeenCalledWith('/planos/plan-1/retirar', { valor: 500 });
    expect(apiClient.delete).toHaveBeenCalledWith('/planos/plan-1');
  });
});

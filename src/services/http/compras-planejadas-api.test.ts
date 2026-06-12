import { comprasPlanejadasApi } from './compras-planejadas-api';
import { apiClient } from './api-client';

vi.mock('./api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn()
  }
}));

describe('comprasPlanejadasApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls the expected endpoints', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { items: [] } } as never);
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: '1' } } as never);
    vi.mocked(apiClient.put).mockResolvedValue({ data: { id: '1' } } as never);

    await comprasPlanejadasApi.listar({ page: 1, pageSize: 10, search: '' });
    await comprasPlanejadasApi.obterPorId('1');
    await comprasPlanejadasApi.criar({
      titulo: 'Notebook novo',
      descricao: 'Troca de equipamento',
      valorEstimado: 4500,
      dataDesejada: '2026-11-20',
      prioridade: 'Alta',
      status: 'Planejada',
      parcelavel: true,
      quantidadeParcelasDesejada: 10,
      contaGerencialId: 'cg-1',
      responsavelId: 'p-1',
      link: 'https://loja.exemplo.com/produto/notebook',
      observacao: 'Aguardar Black Friday'
    });
    await comprasPlanejadasApi.atualizar('1', {
      titulo: 'Notebook novo',
      descricao: 'Troca de equipamento',
      valorEstimado: 4500,
      dataDesejada: '2026-11-20',
      prioridade: 'Alta',
      status: 'Planejada',
      parcelavel: true,
      quantidadeParcelasDesejada: 10,
      contaGerencialId: 'cg-1',
      responsavelId: 'p-1',
      link: 'https://loja.exemplo.com/produto/notebook',
      observacao: 'Aguardar Black Friday'
    });
    await comprasPlanejadasApi.realizar('1', {
      dataCompra: '2026-05-02',
      dataVencimento: '2026-05-25',
      recebedorId: 'p-1',
      formaPagamentoId: 'f-1',
      cartaoId: null,
      contaBancariaId: null,
      quantidadeParcelas: 1,
      numeroDocumento: '',
      descricao: 'Notebook novo',
      observacao: 'Compra executada'
    });

    expect(apiClient.get).toHaveBeenCalledWith('/compras-planejadas', { params: { page: 1, pageSize: 10, search: '' } });
    expect(apiClient.get).toHaveBeenCalledWith('/compras-planejadas/1');
    expect(apiClient.post).toHaveBeenCalledWith('/compras-planejadas', expect.any(Object));
    expect(apiClient.post).toHaveBeenCalledWith('/compras-planejadas/1/realizar', expect.any(Object));
    expect(apiClient.put).toHaveBeenCalledWith('/compras-planejadas/1', expect.any(Object));
  });
});

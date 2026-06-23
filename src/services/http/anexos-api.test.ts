import { anexosApi } from './anexos-api';
import { apiClient } from './api-client';

vi.mock('./api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn()
  }
}));

describe('anexosApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls attachment endpoints with the expected entity route and multipart payload', async () => {
    const file = new File(['conteudo'], 'comprovante.pdf', { type: 'application/pdf' });

    vi.mocked(apiClient.get).mockResolvedValue({ data: [] } as never);
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: 'anexo-1' } } as never);
    vi.mocked(apiClient.delete).mockResolvedValue({ data: undefined } as never);

    await anexosApi.listar('contas-pagar', 'cp-1');
    await anexosApi.enviar('contas-pagar', 'cp-1', file);
    await anexosApi.baixar('anexo-1');
    await anexosApi.excluir('contas-pagar', 'cp-1', 'anexo-1');

    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/anexos/contas-pagar/cp-1');
    expect(apiClient.post).toHaveBeenCalledWith(
      '/anexos/contas-pagar/cp-1',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/anexos/anexo-1/conteudo', { responseType: 'blob' });
    expect(apiClient.delete).toHaveBeenCalledWith('/anexos/contas-pagar/cp-1/anexo-1');
  });
});

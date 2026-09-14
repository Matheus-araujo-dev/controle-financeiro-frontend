import { anexosApi } from './anexos-api';
import { apiClient } from './api-client';
import type { AnexoResumo } from '../../types/anexos';

vi.mock('./api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn()
  }
}));

const mockAnexo: AnexoResumo = {
  id: 'anexo-1',
  nomeArquivoOriginal: 'comprovante.pdf',
  mimeType: 'application/pdf',
  tamanhoBytes: 204800,
  hashSha256: 'abc123hash',
  origem: 'Manual',
  createdAtUtc: '2026-09-10T14:30:00Z'
};

describe('anexosApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listar', () => {
    it('calls GET /anexos/{tipo}/{entidadeId}', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: [mockAnexo] } as never);

      const result = await anexosApi.listar('contas-pagar', 'entity-1');

      expect(apiClient.get).toHaveBeenCalledWith('/anexos/contas-pagar/entity-1');
      expect(result).toEqual([mockAnexo]);
    });
  });

  describe('enviar', () => {
    it('calls POST /anexos/{tipo}/{entidadeId} with FormData', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockAnexo } as never);

      const file = new File(['dummy content'], 'comprovante.pdf', { type: 'application/pdf' });
      const result = await anexosApi.enviar('contas-pagar', 'entity-1', file);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/anexos/contas-pagar/entity-1',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      const formData = vi.mocked(apiClient.post).mock.calls[0][1] as FormData;
      expect(formData.get('arquivo')).toBe(file);
      expect(result).toEqual(mockAnexo);
    });
  });

  describe('baixar', () => {
    it('calls GET /anexos/{anexoId}/conteudo and triggers download', async () => {
      const blob = new Blob(['file-content'], { type: 'application/pdf' });
      vi.mocked(apiClient.get).mockResolvedValue({ data: blob } as never);

      const createObjectURL = vi.fn(() => 'blob:http://localhost/fake-url');
      const revokeObjectURL = vi.fn();
      window.URL.createObjectURL = createObjectURL;
      window.URL.revokeObjectURL = revokeObjectURL;

      const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
      const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
      const clickSpy = vi.fn();
      vi.spyOn(document, 'createElement').mockReturnValue({
        href: '',
        download: '',
        click: clickSpy,
        style: {}
      } as unknown as HTMLAnchorElement);

      await anexosApi.baixar('anexo-1', 'comprovante.pdf');

      expect(apiClient.get).toHaveBeenCalledWith('/anexos/anexo-1/conteudo', { responseType: 'blob' });
      expect(createObjectURL).toHaveBeenCalledWith(blob);
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/fake-url');

      appendSpy.mockRestore();
      removeSpy.mockRestore();
    });
  });

  describe('excluir', () => {
    it('calls DELETE /anexos/{tipo}/{entidadeId}/{anexoId}', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({} as never);

      await anexosApi.excluir('contas-pagar', 'entity-1', 'anexo-1');

      expect(apiClient.delete).toHaveBeenCalledWith('/anexos/contas-pagar/entity-1/anexo-1');
    });
  });
});

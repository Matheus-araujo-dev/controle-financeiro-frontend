import { conciliacaoFaturaApi } from './conciliacao-fatura-api';
import { apiClient } from './api-client';

vi.mock('./api-client', () => ({ apiClient: { post: vi.fn().mockResolvedValue({ data: { id: 'review' } }) } }));

beforeEach(() => vi.clearAllMocks());

it('aceita o tamanho do extrato Bradesco e aguarda o OCR', async () => {
  const file = new File(['pdf'], 'extrato.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'size', { value: 111901008 });
  await conciliacaoFaturaApi.iniciar('f', file);
  expect(apiClient.post).toHaveBeenCalledWith('/faturas/f/conciliacoes', expect.any(FormData), { timeout: 240000 });
});

it.each([['grande.pdf', 128 * 1024 * 1024 + 1, /128 MB/], ['vazio.pdf', 0, /vazio/], ['foto.png', 10, /PDF/]])('bloqueia arquivo inválido antes do upload: %s', async (name, size, message) => {
  const file = new File(['pdf'], name);
  Object.defineProperty(file, 'size', { value: size });
  await expect(conciliacaoFaturaApi.iniciar('f', file)).rejects.toThrow(message);
  expect(apiClient.post).not.toHaveBeenCalled();
});


it('exibe o detalhe de validação do OCR em português', async () => {
  vi.mocked(apiClient.post).mockRejectedValueOnce({ isAxiosError: true, response: { status: 400, data: { message: 'One or more fields are invalid.', errors: { Arquivo: ['Os lançamentos não conferem com o subtotal.'] } } } });
  await expect(conciliacaoFaturaApi.iniciar('f', new File(['pdf'], 'extrato.pdf'))).rejects.toThrow('Os lançamentos não conferem com o subtotal.');
});

it('traduz bloqueio de tamanho do servidor', async () => {
  vi.mocked(apiClient.post).mockRejectedValueOnce({ isAxiosError: true, response: { status: 413 } });
  await expect(conciliacaoFaturaApi.iniciar('f', new File(['pdf'], 'extrato.pdf'))).rejects.toThrow(/128 MB/);
});

it('envia senha apenas no corpo do upload', async () => {
  await conciliacaoFaturaApi.iniciar('f', new File(['pdf'], 'protegido.pdf'), 'senha-teste');
  const [url, body] = vi.mocked(apiClient.post).mock.calls[0];
  expect(url).toBe('/faturas/f/conciliacoes');
  expect((body as FormData).get('senha')).toBe('senha-teste');
});

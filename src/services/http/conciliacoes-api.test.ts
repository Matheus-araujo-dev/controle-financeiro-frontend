import { vi, it, expect, beforeEach } from 'vitest';
import { conciliacoesApi } from './conciliacoes-api';
import { apiClient } from './api-client';
import { cadastrosApi } from './cadastros-api';
vi.mock('./api-client', () => ({ apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));
vi.mock('./cadastros-api', () => ({ cadastrosApi: { contasBancarias: { obterPorId: vi.fn() } } }));
beforeEach(() => { vi.clearAllMocks(); vi.mocked(cadastrosApi.contasBancarias.obterPorId).mockResolvedValue({ nome: 'Conta principal' } as never); });
const resumo = { id: 's', nomeArquivo: 'extrato.csv', contaBancariaId: 'b', dataInicio: '2026-09-01', dataFim: '2026-09-02',
  totalItens: 2, itensConciliados: 0, status: 'EmRevisao', criadoEmUtc: '2026-09-03T00:00:00Z' };
it('adapta a lista sem paginação e as datas reais da API', async () => {
  vi.mocked(apiClient.get).mockResolvedValue({ data: [resumo] });
  const result = await conciliacoesApi.listar({ page: 1, pageSize: 20 });
  expect(result.totalCount).toBe(1);
  expect(result.items[0]).toMatchObject({ periodoInicio: '2026-09-01', periodoFim: '2026-09-02', contaBancariaNome: 'Conta principal', status: 'EmAndamento' });
});
it('usa sugestão plana e calcula ignorados a partir dos itens', async () => {
  vi.mocked(apiClient.get).mockResolvedValue({ data: { ...resumo, itens: [
    { id: 'i', data: '2026-09-01', descricao: 'Mercado', valor: -10, status: 'Pendente', sugestaoMovimentacaoId: 'm', scoreSugestao: 0.8 },
    { id: 'j', data: '2026-09-02', descricao: 'Credito', valor: 20, status: 'Ignorado' }
  ] } });
  const result = await conciliacoesApi.obterPorId('s');
  expect(result.itensIgnorados).toBe(1); expect(result.itensPendentes).toBe(1);
  expect(result.itens[0]).toMatchObject({ tipo: 'Debito', sugestao: { movimentacaoId: 'm', score: 0.8 } });
});

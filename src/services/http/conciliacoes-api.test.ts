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
  expect(result.itens[1]).toMatchObject({ tipo: 'Credito', sugestao: null });
});
it('mapeia status Concluida e Pendente corretamente', async () => {
  vi.mocked(apiClient.get).mockResolvedValue({ data: [{ ...resumo, status: 'Concluida' }, { ...resumo, id: 's2', status: null }] });
  const result = await conciliacoesApi.listar({ page: 1, pageSize: 20 });
  expect(result.items[0].status).toBe('Concluida');
  expect(result.items[1].status).toBe('Pendente');
});
it('filtra resultados por busca na listagem', async () => {
  vi.mocked(apiClient.get).mockResolvedValue({ data: [resumo, { ...resumo, id: 's2', nomeArquivo: 'outro.csv' }] });
  const result = await conciliacoesApi.listar({ page: 1, pageSize: 20, search: 'extrato' });
  expect(result.totalCount).toBe(1);
  expect(result.items[0].id).toBe('s');
});
it('cria conciliação com upload de arquivo', async () => {
  vi.mocked(apiClient.post).mockResolvedValue({ data: { ...resumo, itens: [] } });
  const file = new File(['csv'], 'extrato.csv');
  const result = await conciliacoesApi.criar('b', file);
  expect(result.id).toBe('s');
  expect(apiClient.post).toHaveBeenCalledWith('/conciliacoes', expect.any(FormData));
});
it('concilia e ignora itens via patch', async () => {
  vi.mocked(apiClient.patch).mockResolvedValue({ data: undefined });
  await conciliacoesApi.conciliarItem('c', 'i', { movimentacaoId: 'm' } as never);
  expect(apiClient.patch).toHaveBeenCalledWith('/conciliacoes/c/itens/i/conciliar', { movimentacaoId: 'm' });
  await conciliacoesApi.ignorarItem('c', 'i');
  expect(apiClient.patch).toHaveBeenCalledWith('/conciliacoes/c/itens/i/ignorar');
});
it('lida com itens nulos na resposta de detalhe', async () => {
  vi.mocked(apiClient.get).mockResolvedValue({ data: { ...resumo, itens: null } });
  const result = await conciliacoesApi.obterPorId('s');
  expect(result.itens).toEqual([]);
});

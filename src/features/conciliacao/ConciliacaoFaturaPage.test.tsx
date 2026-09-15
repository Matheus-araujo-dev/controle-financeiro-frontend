import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ConciliacaoFaturaPage } from './ConciliacaoFaturaPage';
import { conciliacaoFaturaApi } from '../../services/http/conciliacao-fatura-api';

vi.mock('../../services/http/conciliacao-fatura-api', () => ({ conciliacaoFaturaApi: {
  listar: vi.fn().mockResolvedValue([{ id: 's', nomeArquivo: 'fatura.pdf', status: 'EmRevisao' }]),
  obter: vi.fn().mockResolvedValue({ id: 's', faturaId: 'f', nomeArquivo: 'fatura.pdf', status: 'EmRevisao',
    itens: [{ id: 'i', data: '2026-09-01', descricaoOriginal: 'LOJA', valor: 100, numeroParcela: 1, quantidadeParcelas: 1,
      status: 'Pendente', contaPagarVinculadaId: null, valorAnteriorSistema: null, candidatos: [], atualizadoEmUtc: '2026-09-14T00:00:00Z' }], contasSistema: [] }),
  criar: vi.fn(), vincular: vi.fn(), salvarRascunho: vi.fn().mockResolvedValue({ atualizadoEmUtc: '2026-09-15T00:00:00Z' })
} }));
vi.mock('../../services/http/financeiro-api', () => ({ financeiroApi: { faturas: { obterPorId: vi.fn().mockResolvedValue({ dataVencimento: '2026-09-20', cartaoNome: 'Meu cartão' }) } } }));
vi.mock('../financeiro/module-config', () => {
  const config = { loadPessoaOptions: vi.fn().mockResolvedValue([{ value: 'p', label: 'Pessoa' }]),
    loadResponsavelOptions: vi.fn().mockResolvedValue([{ value: 'p', label: 'Pessoa' }]),
    loadFormaPagamentoOptions: vi.fn().mockResolvedValue([{ value: 'fp', label: 'Cartão', ehCartao: true }]),
    loadRateioOptions: vi.fn().mockResolvedValue([{ value: 'cg', label: 'Categoria' }]) };
  return { contasPagarModuleConfig: config, contasReceberModuleConfig: config };
});

it('retoma a revisão e salva a edição sem criar conta', async () => {
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter initialEntries={['/faturas/f/conciliar']}><Routes><Route path="/faturas/:id/conciliar" element={<ConciliacaoFaturaPage />} /></Routes></MemoryRouter>
  </QueryClientProvider>);
  await userEvent.click(await screen.findByRole('button', { name: /Retomar fatura.pdf/ }));
  const descricao = await screen.findByRole('textbox', { name: 'Descrição de LOJA' });
  await userEvent.clear(descricao);
  await userEvent.type(descricao, 'Compra editada');
  await userEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
  expect(conciliacaoFaturaApi.criar).not.toHaveBeenCalled();
  expect(conciliacaoFaturaApi.salvarRascunho).toHaveBeenCalledWith('f', 's', 'i', expect.objectContaining({ descricao: 'Compra editada' }), '2026-09-14T00:00:00Z');
});

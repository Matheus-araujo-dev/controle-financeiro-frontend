import { financeiroApi } from './financeiro-api';
import { apiClient } from './api-client';

vi.mock('./api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn()
  }
}));

describe('financeiroApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls the expected endpoints for contas a pagar, contas a receber, movimentacoes and faturas', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { items: [] } } as never);
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: '1' } } as never);
    vi.mocked(apiClient.put).mockResolvedValue({ data: { id: '1' } } as never);

    await financeiroApi.contasPagar.listar({ page: 1, pageSize: 10, search: '' });
    await financeiroApi.contasPagar.obterPorId('1');
    await financeiroApi.contasPagar.criar({
      numeroDocumento: '',
      dataEmissao: '2026-04-04',
      responsavelCompraId: null,
      recebedorId: 'p1',
      dataVencimento: '2026-04-20',
      formaPagamentoId: 'f1',
      cartaoId: null,
      contaBancariaId: null,
      dataLiquidacao: null,
      valorOriginal: 100,
      valorDesconto: 0,
      valorJuros: 0,
      valorMulta: 0,
      quantidadeParcelas: 1,
      descricao: 'Despesa',
      observacao: '',
      rateios: [{ contaGerencialId: 'cg1', valor: 100 }]
    });
    await financeiroApi.contasPagar.atualizar('1', {
      numeroDocumento: '',
      dataEmissao: '2026-04-04',
      responsavelCompraId: null,
      recebedorId: 'p1',
      dataVencimento: '2026-04-20',
      formaPagamentoId: 'f1',
      cartaoId: null,
      contaBancariaId: null,
      dataLiquidacao: null,
      valorOriginal: 100,
      valorDesconto: 0,
      valorJuros: 0,
      valorMulta: 0,
      quantidadeParcelas: 1,
      descricao: 'Despesa',
      observacao: '',
      rateios: [{ contaGerencialId: 'cg1', valor: 100 }]
    });
    await financeiroApi.contasPagar.liquidar('1', { dataLiquidacao: '2026-04-05', contaBancariaId: 'cb1' });
    await financeiroApi.contasPagar.cancelar('1');

    await financeiroApi.contasReceber.listar({ page: 1, pageSize: 10, search: '' });
    await financeiroApi.contasReceber.obterPorId('1');
    await financeiroApi.contasReceber.criar({
      numeroDocumento: '',
      dataEmissao: '2026-04-04',
      responsavelId: null,
      pagadorId: 'p2',
      dataVencimento: '2026-04-25',
      formaPagamentoId: 'f1',
      cartaoId: null,
      contaBancariaId: null,
      dataLiquidacao: null,
      valorOriginal: 200,
      valorDesconto: 0,
      valorJuros: 0,
      valorMulta: 0,
      quantidadeParcelas: 1,
      descricao: 'Receita',
      observacao: '',
      rateios: [{ contaGerencialId: 'cg2', valor: 200 }]
    });
    await financeiroApi.contasReceber.atualizar('1', {
      numeroDocumento: '',
      dataEmissao: '2026-04-04',
      responsavelId: null,
      pagadorId: 'p2',
      dataVencimento: '2026-04-25',
      formaPagamentoId: 'f1',
      cartaoId: null,
      contaBancariaId: null,
      dataLiquidacao: null,
      valorOriginal: 200,
      valorDesconto: 0,
      valorJuros: 0,
      valorMulta: 0,
      quantidadeParcelas: 1,
      descricao: 'Receita',
      observacao: '',
      rateios: [{ contaGerencialId: 'cg2', valor: 200 }]
    });
    await financeiroApi.contasReceber.liquidar('1', { dataLiquidacao: '2026-04-08', contaBancariaId: 'cb1' });
    await financeiroApi.contasReceber.cancelar('1');

    await financeiroApi.movimentacoes.listar({ page: 1, pageSize: 20, search: 'receita' });
    await financeiroApi.movimentacoes.obterPorId('m1');

    await financeiroApi.faturas.listar({ page: 1, pageSize: 10, search: 'abril', competencia: '2026-04' });
    await financeiroApi.faturas.obterPorId('f1');
    await financeiroApi.faturas.pagar('f1', {
      dataPagamento: '2026-04-20',
      contaBancariaPagamentoId: 'cb1',
      observacao: 'Pagamento integral'
    });

    expect(apiClient.get).toHaveBeenCalledWith('/contas-pagar', { params: { page: 1, pageSize: 10, search: '' } });
    expect(apiClient.get).toHaveBeenCalledWith('/contas-pagar/1');
    expect(apiClient.post).toHaveBeenCalledWith('/contas-pagar', expect.any(Object));
    expect(apiClient.put).toHaveBeenCalledWith('/contas-pagar/1', expect.any(Object));
    expect(apiClient.post).toHaveBeenCalledWith('/contas-pagar/1/liquidar', { dataLiquidacao: '2026-04-05', contaBancariaId: 'cb1' });
    expect(apiClient.post).toHaveBeenCalledWith('/contas-pagar/1/cancelar', undefined);

    expect(apiClient.get).toHaveBeenCalledWith('/contas-receber', { params: { page: 1, pageSize: 10, search: '' } });
    expect(apiClient.get).toHaveBeenCalledWith('/contas-receber/1');
    expect(apiClient.post).toHaveBeenCalledWith('/contas-receber', expect.any(Object));
    expect(apiClient.put).toHaveBeenCalledWith('/contas-receber/1', expect.any(Object));
    expect(apiClient.post).toHaveBeenCalledWith('/contas-receber/1/liquidar', { dataLiquidacao: '2026-04-08', contaBancariaId: 'cb1' });
    expect(apiClient.post).toHaveBeenCalledWith('/contas-receber/1/cancelar', undefined);

    expect(apiClient.get).toHaveBeenCalledWith('/movimentacoes', { params: { page: 1, pageSize: 20, search: 'receita' } });
    expect(apiClient.get).toHaveBeenCalledWith('/movimentacoes/m1');

    expect(apiClient.get).toHaveBeenCalledWith('/faturas', { params: { page: 1, pageSize: 10, search: 'abril', competencia: '2026-04' } });
    expect(apiClient.get).toHaveBeenCalledWith('/faturas/f1');
    expect(apiClient.post).toHaveBeenCalledWith('/faturas/f1/pagar', {
      dataPagamento: '2026-04-20',
      contaBancariaPagamentoId: 'cb1',
      observacao: 'Pagamento integral'
    });
  });
});

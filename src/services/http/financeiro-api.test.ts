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

    await financeiroApi.contasPagar.listar({
      page: 1,
      pageSize: 10,
      search: '',
      statusCodigo: ['PENDENTE', 'VENCIDA'],
      dataInicial: '2026-04-01',
      dataFinal: '2026-04-30'
    });
    await financeiroApi.contasPagar.obterPorId('1');
    await financeiroApi.contasPagar.criar({
      origemCompraPlanejadaId: null,
      numeroDocumento: '',
      dataEmissao: '2026-04-04',
      responsavelCompraId: 'resp-1',
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
      rateios: [{ contaGerencialId: 'cg1', valor: 100 }],
      recorrencia: null
    });
    await financeiroApi.contasPagar.atualizar('1', {
      origemCompraPlanejadaId: null,
      numeroDocumento: '',
      dataEmissao: '2026-04-04',
      responsavelCompraId: 'resp-1',
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
      rateios: [{ contaGerencialId: 'cg1', valor: 100 }],
      recorrencia: null
    });
    await financeiroApi.contasPagar.alterarFuturas('1', {
      origemCompraPlanejadaId: null,
      numeroDocumento: '',
      dataEmissao: '2026-04-04',
      responsavelCompraId: 'resp-1',
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
      rateios: [{ contaGerencialId: 'cg1', valor: 100 }],
      recorrencia: {
        tipoPeriodicidade: 'Mensal',
        tipoDia: 'DiaFixo',
        diaOrdemMensal: 20,
        dataInicio: '2026-04-20',
        dataFim: null,
        permiteEdicaoOcorrenciaIndividual: true,
        observacao: null
      }
    });
    await financeiroApi.contasPagar.gerarOcorrencias('1', { ateData: '2026-06-30' });
    await financeiroApi.contasPagar.pausarRecorrencia('1');
    await financeiroApi.contasPagar.encerrarRecorrencia('1', { dataFim: '2026-07-20' });
    await financeiroApi.contasPagar.liquidar('1', {
      valorLiquidacao: 120,
      dataLiquidacao: '2026-04-05',
      contaBancariaId: 'cb1',
      formaPagamentoId: 'f1',
      atualizarValorConta: true
    });
    await financeiroApi.contasPagar.cancelar('1', { cancelarPlanejamentoRelacionado: true });

    await financeiroApi.contasReceber.listar({
      page: 1,
      pageSize: 10,
      search: '',
      statusCodigo: ['PENDENTE', 'VENCIDA'],
      dataInicial: '2026-04-01',
      dataFinal: '2026-04-30'
    });
    await financeiroApi.contasReceber.obterPorId('1');
    await financeiroApi.contasReceber.criar({
      numeroDocumento: '',
      dataEmissao: '2026-04-04',
      responsavelId: 'resp-2',
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
      rateios: [{ contaGerencialId: 'cg2', valor: 200 }],
      recorrencia: null
    });
    await financeiroApi.contasReceber.atualizar('1', {
      numeroDocumento: '',
      dataEmissao: '2026-04-04',
      responsavelId: 'resp-2',
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
      rateios: [{ contaGerencialId: 'cg2', valor: 200 }],
      recorrencia: null
    });
    await financeiroApi.contasReceber.alterarFuturas('1', {
      numeroDocumento: '',
      dataEmissao: '2026-04-04',
      responsavelId: 'resp-2',
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
      rateios: [{ contaGerencialId: 'cg2', valor: 200 }],
      recorrencia: {
        tipoPeriodicidade: 'Mensal',
        tipoDia: 'DiaFixo',
        diaOrdemMensal: 25,
        dataInicio: '2026-04-25',
        dataFim: null,
        permiteEdicaoOcorrenciaIndividual: true,
        observacao: null
      }
    });
    await financeiroApi.contasReceber.gerarOcorrencias('1', { ateData: '2026-06-30' });
    await financeiroApi.contasReceber.pausarRecorrencia('1');
    await financeiroApi.contasReceber.encerrarRecorrencia('1', { dataFim: '2026-07-25' });
    await financeiroApi.contasReceber.liquidar('1', {
      valorLiquidacao: 120,
      dataLiquidacao: '2026-04-08',
      contaBancariaId: 'cb1',
      formaPagamentoId: 'f1',
      atualizarValorConta: true
    });
    await financeiroApi.contasReceber.cancelar('1');

    await financeiroApi.movimentacoes.listar({
      page: 1,
      pageSize: 20,
      search: 'receita',
      contaBancariaIds: ['cb1', 'cb2'],
      responsavelIds: ['rp1', 'rp2']
    });
    await financeiroApi.movimentacoes.obterPorId('m1');

    await financeiroApi.faturas.listar({ page: 1, pageSize: 10, search: 'abril', competencia: '2026-04' });
    await financeiroApi.faturas.obterPorId('f1');
    await financeiroApi.faturas.pagar('f1', {
      dataPagamento: '2026-04-20',
      contaBancariaPagamentoId: 'cb1',
      observacao: 'Pagamento integral'
    });
    await financeiroApi.faturas.estornar('f1');

    expect(apiClient.get).toHaveBeenCalledWith(
      '/contas-pagar',
      expect.objectContaining({
        params: expect.objectContaining({
          page: 1,
          pageSize: 10,
          search: '',
          statusCodigo: 'PENDENTE,VENCIDA',
          dataVencimentoInicial: '2026-04-01',
          dataVencimentoFinal: '2026-04-30'
        })
      })
    );
    expect(apiClient.get).toHaveBeenCalledWith('/contas-pagar/1');
    expect(apiClient.post).toHaveBeenCalledWith('/contas-pagar', expect.any(Object));
    expect(apiClient.put).toHaveBeenCalledWith('/contas-pagar/1', expect.any(Object));
    expect(apiClient.post).toHaveBeenCalledWith('/contas-pagar/1/alterar-futuras', expect.any(Object));
    expect(apiClient.post).toHaveBeenCalledWith('/contas-pagar/1/gerar-ocorrencias', { ateData: '2026-06-30' });
    expect(apiClient.post).toHaveBeenCalledWith('/contas-pagar/1/pausar-recorrencia', undefined);
    expect(apiClient.post).toHaveBeenCalledWith('/contas-pagar/1/encerrar-recorrencia', { dataFim: '2026-07-20' });
    expect(apiClient.post).toHaveBeenCalledWith('/contas-pagar/1/liquidar', {
      valorLiquidacao: 120,
      dataLiquidacao: '2026-04-05',
      contaBancariaId: 'cb1',
      formaPagamentoId: 'f1',
      atualizarValorConta: true
    });
    expect(apiClient.post).toHaveBeenCalledWith('/contas-pagar/1/cancelar', { cancelarPlanejamentoRelacionado: true });

    expect(apiClient.get).toHaveBeenCalledWith(
      '/contas-receber',
      expect.objectContaining({
        params: expect.objectContaining({
          page: 1,
          pageSize: 10,
          search: '',
          statusCodigo: 'PENDENTE,VENCIDA',
          dataVencimentoInicial: '2026-04-01',
          dataVencimentoFinal: '2026-04-30'
        })
      })
    );
    expect(apiClient.get).toHaveBeenCalledWith('/contas-receber/1');
    expect(apiClient.post).toHaveBeenCalledWith('/contas-receber', expect.any(Object));
    expect(apiClient.put).toHaveBeenCalledWith('/contas-receber/1', expect.any(Object));
    expect(apiClient.post).toHaveBeenCalledWith('/contas-receber/1/alterar-futuras', expect.any(Object));
    expect(apiClient.post).toHaveBeenCalledWith('/contas-receber/1/gerar-ocorrencias', { ateData: '2026-06-30' });
    expect(apiClient.post).toHaveBeenCalledWith('/contas-receber/1/pausar-recorrencia', undefined);
    expect(apiClient.post).toHaveBeenCalledWith('/contas-receber/1/encerrar-recorrencia', { dataFim: '2026-07-25' });
    expect(apiClient.post).toHaveBeenCalledWith('/contas-receber/1/liquidar', {
      valorLiquidacao: 120,
      dataLiquidacao: '2026-04-08',
      contaBancariaId: 'cb1',
      formaPagamentoId: 'f1',
      atualizarValorConta: true
    });
    expect(apiClient.post).toHaveBeenCalledWith('/contas-receber/1/cancelar', undefined);

    expect(apiClient.get).toHaveBeenCalledWith('/movimentacoes', {
      params: {
        page: 1,
        pageSize: 20,
        search: 'receita',
        contaBancariaIds: 'cb1,cb2',
        responsavelIds: 'rp1,rp2'
      }
    });
    expect(apiClient.get).toHaveBeenCalledWith('/movimentacoes/m1');

    expect(apiClient.get).toHaveBeenCalledWith('/faturas', { params: { page: 1, pageSize: 10, search: 'abril', competencia: '2026-04' } });
    expect(apiClient.get).toHaveBeenCalledWith('/faturas/f1');
    expect(apiClient.post).toHaveBeenCalledWith('/faturas/f1/pagar', {
      dataPagamento: '2026-04-20',
      contaBancariaPagamentoId: 'cb1',
      observacao: 'Pagamento integral'
    });
    expect(apiClient.post).toHaveBeenCalledWith('/faturas/f1/estornar', undefined);
  });
});

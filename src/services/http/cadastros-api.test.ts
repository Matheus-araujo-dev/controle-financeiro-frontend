import { cadastrosApi } from './cadastros-api';
import { apiClient } from './api-client';

vi.mock('./api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn()
  }
}));

describe('cadastrosApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls the expected endpoints for pessoas', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { items: [] } } as never);
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: '1' } } as never);
    vi.mocked(apiClient.put).mockResolvedValue({ data: { id: '1' } } as never);
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { id: '1' } } as never);

    await cadastrosApi.pessoas.listar({ page: 1, pageSize: 10, search: '' });
    await cadastrosApi.pessoas.obterPorId('1');
    await cadastrosApi.pessoas.criar({
      nome: 'Pessoa',
      tipoPessoa: 'Fisica',
      cpfCnpj: '',
      email: '',
      telefone: '',
      observacao: ''
    });
    await cadastrosApi.pessoas.atualizar('1', {
      nome: 'Pessoa',
      tipoPessoa: 'Fisica',
      cpfCnpj: '',
      email: '',
      telefone: '',
      observacao: ''
    });
    await cadastrosApi.pessoas.ativar('1');
    await cadastrosApi.pessoas.inativar('1');

    expect(apiClient.get).toHaveBeenCalledWith('/pessoas', { params: { page: 1, pageSize: 10, search: '' } });
    expect(apiClient.get).toHaveBeenCalledWith('/pessoas/1');
    expect(apiClient.post).toHaveBeenCalledWith('/pessoas', expect.any(Object));
    expect(apiClient.put).toHaveBeenCalledWith('/pessoas/1', expect.any(Object));
    expect(apiClient.patch).toHaveBeenCalledWith('/pessoas/1/ativar');
    expect(apiClient.patch).toHaveBeenCalledWith('/pessoas/1/inativar');
  });

  it('calls the expected endpoints for the support registries', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { items: [] } } as never);
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: '1' } } as never);
    vi.mocked(apiClient.put).mockResolvedValue({ data: { id: '1' } } as never);

    await cadastrosApi.formasPagamento.listar({ page: 1, pageSize: 10, search: '' });
    await cadastrosApi.formasPagamento.obterPorId('1');
    await cadastrosApi.contasBancarias.listar({ page: 1, pageSize: 10, search: '' });
    await cadastrosApi.contasBancarias.obterPorId('1');
    await cadastrosApi.cartoes.listar({ page: 1, pageSize: 10, search: '' });
    await cadastrosApi.cartoes.obterPorId('1');
    await cadastrosApi.contasGerenciais.listar({ page: 1, pageSize: 10, search: '' });
    await cadastrosApi.contasGerenciais.obterPorId('1');

    await cadastrosApi.formasPagamento.criar({
      nome: 'Pix',
      tipo: 'Pix',
      ehCartao: false,
      baixarAutomaticamente: false,
      ativo: true
    });
    await cadastrosApi.contasBancarias.criar({
      nome: 'Conta',
      banco: 'Banco',
      agencia: '',
      numeroConta: '',
      tipoConta: '',
      saldoInicial: 10,
      dataSaldoInicial: '2026-04-03',
      ativo: true
    });
    await cadastrosApi.cartoes.criar({
      nome: 'Cartao',
      bandeira: 'Visa',
      numeroFinal: '1234',
      diaFechamentoFatura: 8,
      diaVencimentoFatura: 15,
      contaBancariaPagamentoPadraoId: null,
      limiteCredito: null,
      ativo: true
    });
    await cadastrosApi.contasGerenciais.criar({
      codigo: '',
      descricao: 'Despesa',
      tipo: 'Despesa',
      contaPaiId: null,
      ativo: true
    });
    await cadastrosApi.formasPagamento.atualizar('1', {
      nome: 'Pix',
      tipo: 'Pix',
      ehCartao: false,
      baixarAutomaticamente: false,
      ativo: true
    });
    await cadastrosApi.contasBancarias.atualizar('1', {
      nome: 'Conta',
      banco: 'Banco',
      agencia: '',
      numeroConta: '',
      tipoConta: '',
      saldoInicial: 10,
      dataSaldoInicial: '2026-04-03',
      ativo: true
    });
    await cadastrosApi.cartoes.atualizar('1', {
      nome: 'Cartao',
      bandeira: 'Visa',
      numeroFinal: '1234',
      diaFechamentoFatura: 8,
      diaVencimentoFatura: 15,
      contaBancariaPagamentoPadraoId: null,
      limiteCredito: null,
      ativo: true
    });
    await cadastrosApi.contasGerenciais.atualizar('1', {
      codigo: '',
      descricao: 'Despesa',
      tipo: 'Despesa',
      contaPaiId: null,
      ativo: true
    });

    expect(apiClient.get).toHaveBeenCalledWith('/formas-pagamento', { params: { page: 1, pageSize: 10, search: '' } });
    expect(apiClient.get).toHaveBeenCalledWith('/formas-pagamento/1');
    expect(apiClient.get).toHaveBeenCalledWith('/contas-bancarias', { params: { page: 1, pageSize: 10, search: '' } });
    expect(apiClient.get).toHaveBeenCalledWith('/contas-bancarias/1');
    expect(apiClient.get).toHaveBeenCalledWith('/cartoes', { params: { page: 1, pageSize: 10, search: '' } });
    expect(apiClient.get).toHaveBeenCalledWith('/cartoes/1');
    expect(apiClient.get).toHaveBeenCalledWith('/contas-gerenciais', { params: { page: 1, pageSize: 10, search: '' } });
    expect(apiClient.get).toHaveBeenCalledWith('/contas-gerenciais/1');
    expect(apiClient.post).toHaveBeenCalledWith('/formas-pagamento', expect.any(Object));
    expect(apiClient.post).toHaveBeenCalledWith('/contas-bancarias', expect.any(Object));
    expect(apiClient.post).toHaveBeenCalledWith('/cartoes', expect.any(Object));
    expect(apiClient.post).toHaveBeenCalledWith('/contas-gerenciais', expect.any(Object));
    expect(apiClient.put).toHaveBeenCalledWith('/formas-pagamento/1', expect.any(Object));
    expect(apiClient.put).toHaveBeenCalledWith('/contas-bancarias/1', expect.any(Object));
    expect(apiClient.put).toHaveBeenCalledWith('/cartoes/1', expect.any(Object));
    expect(apiClient.put).toHaveBeenCalledWith('/contas-gerenciais/1', expect.any(Object));
  });
});

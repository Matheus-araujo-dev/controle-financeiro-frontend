import { cadastrosApi } from '../../services/http/cadastros-api';
import { financeiroApi } from '../../services/http/financeiro-api';
import {
  calculateValorLiquido,
  contasPagarModuleConfig,
  contasReceberModuleConfig,
  resolveFormaPagamentoBehavior
} from './module-config';

vi.mock('../../services/http/cadastros-api', () => ({
  cadastrosApi: {
    pessoas: {
      listar: vi.fn()
    },
    formasPagamento: {
      listar: vi.fn()
    },
    contasBancarias: {
      listar: vi.fn()
    },
    cartoes: {
      listar: vi.fn()
    },
    contasGerenciais: {
      listar: vi.fn()
    }
  }
}));

vi.mock('../../services/http/financeiro-api', () => ({
  financeiroApi: {
    contasPagar: {
      listar: vi.fn(),
      obterPorId: vi.fn(),
      criar: vi.fn(),
      atualizar: vi.fn(),
      alterarFuturas: vi.fn(),
      gerarOcorrencias: vi.fn(),
      pausarRecorrencia: vi.fn(),
      encerrarRecorrencia: vi.fn(),
      liquidar: vi.fn(),
      cancelar: vi.fn()
    },
    contasReceber: {
      listar: vi.fn(),
      obterPorId: vi.fn(),
      criar: vi.fn(),
      atualizar: vi.fn(),
      alterarFuturas: vi.fn(),
      gerarOcorrencias: vi.fn(),
      pausarRecorrencia: vi.fn(),
      encerrarRecorrencia: vi.fn(),
      liquidar: vi.fn(),
      cancelar: vi.fn()
    },
    movimentacoes: {
      listar: vi.fn(),
      obterPorId: vi.fn()
    }
  }
}));

describe('financeiro module config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates valor liquido and maps detail payloads to form values', () => {
    expect(
      calculateValorLiquido({
        valorOriginal: 100,
        valorDesconto: 10,
        valorJuros: 5,
        valorMulta: 2
      })
    ).toBe(97);

    expect(
      contasPagarModuleConfig.toFormValues({
        id: '1',
        numeroDocumento: null,
        dataEmissao: '2026-04-04',
        responsavelCompraId: null,
        responsavelCompraNome: null,
        recebedorId: 'p1',
        recebedorNome: 'Fornecedor',
        dataVencimento: '2026-04-20',
        dataLiquidacao: null,
        formaPagamentoId: 'f1',
        formaPagamentoNome: 'Pix',
        formaPagamentoEhCartao: false,
        formaPagamentoBaixarAutomaticamente: false,
        cartaoId: null,
        cartaoNome: null,
        contaBancariaId: null,
        contaBancariaNome: null,
        valorOriginal: 100,
        valorDesconto: 0,
        valorJuros: 0,
        valorMulta: 0,
        valorLiquido: 100,
        quantidadeParcelas: 1,
        numeroParcela: 1,
        grupoParcelamentoId: null,
        origemCompraPlanejadaId: null,
        descricao: 'Despesa',
        observacao: null,
        statusCodigo: 'PENDENTE',
        statusNome: 'Pendente',
        ehRecorrente: true,
        origem: 'Manual',
        recorrencia: {
          id: 'rec1',
          tipoPeriodicidade: 'Mensal',
          tipoDia: 'DiaFixo',
          diaOrdemMensal: 20,
          dataInicio: '2026-04-20',
          dataFim: null,
          ativa: true,
          permiteEdicaoOcorrenciaIndividual: true,
          observacao: 'Contrato mensal',
          contaOrigemTipo: 'ContaPagar'
        },
        competenciaFaturaCartao: null,
        dataFechamentoFaturaCartao: null,
        dataVencimentoFaturaCartao: null,
        rateios: [
          {
            id: 'r1',
            contaGerencialId: 'cg1',
            contaGerencialCodigo: 'DESP',
            contaGerencialDescricao: 'Despesa Operacional',
            valor: 100,
            percentual: 100
          }
        ],
        createdAtUtc: '2026-04-04T00:00:00Z',
        updatedAtUtc: '2026-04-04T00:00:00Z'
      })
    ).toMatchObject({
      origemCompraPlanejadaId: '',
      numeroDocumento: '',
      responsavelId: '',
      cartaoId: '',
      contaBancariaId: '',
      observacao: '',
      rateios: [{ contaGerencialId: 'cg1', valor: 100 }],
      ehRecorrente: true,
      recorrenciaTipoDia: 'DiaFixo',
      recorrenciaDiaOrdemMensal: 20,
      recorrenciaDataInicio: '2026-04',
      recorrenciaDataFim: ''
    });

    const vencimentoColumn = contasPagarModuleConfig.columns.find((column) => column.key === 'dataVencimento');
    expect(vencimentoColumn && 'render' in vencimentoColumn && typeof vencimentoColumn.render === 'function'
      ? vencimentoColumn.render('2026-04-20', {} as never, 0)
      : null).toBe('20/04/2026');
  });

  it('resolves the expected status tones', () => {
    expect(
      resolveFormaPagamentoBehavior('f1', [{ label: 'Dinheiro', value: 'f1', ehCartao: false, baixarAutomaticamente: false }])
    ).toEqual({ ehCartao: false, baixarAutomaticamente: false });
  });

  it('opens contas with default filter for pendentes e vencidas', () => {
    expect(contasPagarModuleConfig.defaultFilters).toMatchObject({
      statusCodigo: ['PENDENTE', 'VENCIDA']
    });

    expect(contasReceberModuleConfig.defaultFilters).toMatchObject({
      statusCodigo: ['PENDENTE', 'VENCIDA']
    });
  });

  it('normalizes payloads and liquidacao actions', async () => {
    vi.mocked(financeiroApi.contasPagar.criar).mockResolvedValue({} as never);
    vi.mocked(financeiroApi.contasReceber.atualizar).mockResolvedValue({} as never);
    vi.mocked(financeiroApi.contasPagar.liquidar).mockResolvedValue({} as never);

    await contasPagarModuleConfig.create({
      origemCompraPlanejadaId: '',
      numeroDocumento: '',
      pessoaId: 'p1',
      responsavelId: 'resp-1',
      dataEmissao: '2026-04-04',
      dataVencimento: '2026-04-20',
      formaPagamentoId: 'f1',
      cartaoId: '',
      contaBancariaId: '',
      dataLiquidacao: '',
      valorOriginal: 100,
      valorDesconto: 0,
      valorJuros: 0,
      valorMulta: 0,
      quantidadeParcelas: 1,
      descricao: 'Despesa',
      observacao: '',
      rateios: [{ contaGerencialId: 'cg1', valor: 100 }],
      ehRecorrente: false,
      recorrenciaTipoPeriodicidade: 'Mensal' as const,
      recorrenciaTipoDia: 'DiaFixo' as const,
      recorrenciaDiaOrdemMensal: 20,
      recorrenciaDataInicio: '',
      recorrenciaDataFim: '',
      recorrenciaPermiteEdicaoOcorrenciaIndividual: true,
      recorrenciaObservacao: '',
      recorrenciaGerarAteData: ''
    });

    await contasReceberModuleConfig.update('1', {
      origemCompraPlanejadaId: '',
      numeroDocumento: '',
      pessoaId: 'p2',
      responsavelId: 'resp-2',
      dataEmissao: '2026-04-04',
      dataVencimento: '2026-04-25',
      formaPagamentoId: 'f1',
      cartaoId: '',
      contaBancariaId: '',
      dataLiquidacao: '',
      valorOriginal: 200,
      valorDesconto: 0,
      valorJuros: 0,
      valorMulta: 0,
      quantidadeParcelas: 1,
      descricao: 'Receita',
      observacao: '',
      rateios: [{ contaGerencialId: 'cg2', valor: 200 }],
      ehRecorrente: false,
      recorrenciaTipoPeriodicidade: 'Mensal' as const,
      recorrenciaTipoDia: 'DiaFixo' as const,
      recorrenciaDiaOrdemMensal: 25,
      recorrenciaDataInicio: '',
      recorrenciaDataFim: '',
      recorrenciaPermiteEdicaoOcorrenciaIndividual: true,
      recorrenciaObservacao: '',
      recorrenciaGerarAteData: ''
    });

    await contasPagarModuleConfig.liquidar?.('1', {
      dataLiquidacao: '2026-04-05',
      contaBancariaId: 'cb1'
    });

    expect(financeiroApi.contasPagar.criar).toHaveBeenCalledWith(
      expect.objectContaining({
        numeroDocumento: null,
        responsavelCompraId: 'resp-1',
        cartaoId: null,
        contaBancariaId: null,
        dataLiquidacao: null
      })
    );
    expect(financeiroApi.contasReceber.atualizar).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        numeroDocumento: null,
        responsavelId: 'resp-2',
        cartaoId: null,
        contaBancariaId: null,
        dataLiquidacao: null
      })
    );
    expect(financeiroApi.contasPagar.liquidar).toHaveBeenCalledWith('1', {
      dataLiquidacao: '2026-04-05',
      contaBancariaId: 'cb1'
    });
  });

  it('sends recurring payloads without explicit recurrence start date', async () => {
    vi.mocked(financeiroApi.contasPagar.criar).mockResolvedValue({} as never);

    await contasPagarModuleConfig.create({
      origemCompraPlanejadaId: '',
      numeroDocumento: '',
      pessoaId: 'p1',
      responsavelId: 'resp-1',
      dataEmissao: '2026-05-01',
      dataVencimento: '2026-05-08',
      formaPagamentoId: 'f1',
      cartaoId: '',
      contaBancariaId: '',
      dataLiquidacao: '',
      valorOriginal: 100,
      valorDesconto: 0,
      valorJuros: 0,
      valorMulta: 0,
      quantidadeParcelas: 1,
      descricao: 'Despesa recorrente',
      observacao: '',
      rateios: [{ contaGerencialId: 'cg1', valor: 100 }],
      ehRecorrente: true,
      recorrenciaTipoPeriodicidade: 'Mensal' as const,
      recorrenciaTipoDia: 'DiaFixo' as const,
      recorrenciaDiaOrdemMensal: 8,
      recorrenciaDataInicio: '',
      recorrenciaDataFim: '2026-08',
      recorrenciaPermiteEdicaoOcorrenciaIndividual: true,
      recorrenciaObservacao: '',
      recorrenciaGerarAteData: ''
    });

    expect(financeiroApi.contasPagar.criar).toHaveBeenCalledWith(
      expect.objectContaining({
        recorrencia: expect.objectContaining({
          diaOrdemMensal: 8,
          dataInicio: null,
          dataFim: '2026-08-08'
        })
      })
    );
  });

  it('loads the expected option sets and resolves payment behavior', async () => {
    vi.mocked(cadastrosApi.pessoas.listar).mockResolvedValue({
      items: [{ id: 'p1', nome: 'Fornecedor', tipoPessoa: 'Juridica', cpfCnpj: null, email: null, telefone: null, ativo: true }],
      page: 1,
      pageSize: 100,
      totalItems: 1,
      totalPages: 1
    } as never);
    vi.mocked(cadastrosApi.formasPagamento.listar).mockResolvedValue({
      items: [{ id: 'f1', nome: 'Credito', tipo: 'Credito', ehCartao: true, baixarAutomaticamente: false, ativo: true }],
      page: 1,
      pageSize: 100,
      totalItems: 1,
      totalPages: 1
    } as never);
    vi.mocked(cadastrosApi.contasBancarias.listar).mockResolvedValue({
      items: [{ id: 'cb1', nome: 'Conta principal', banco: 'Banco Exemplo', agencia: null, numeroConta: null, tipoConta: null, saldoInicial: 0, dataSaldoInicial: '2026-04-01', ativo: true }],
      page: 1,
      pageSize: 100,
      totalItems: 1,
      totalPages: 1
    } as never);
    vi.mocked(cadastrosApi.cartoes.listar).mockResolvedValue({
      items: [{ id: 'c1', nome: 'Visa Corporate', bandeira: 'Visa', numeroFinal: '4242', diaFechamentoFatura: 10, diaVencimentoFatura: 20, contaBancariaPagamentoPadraoId: 'cb1', limiteCredito: 5000, ativo: true }],
      page: 1,
      pageSize: 100,
      totalItems: 1,
      totalPages: 1
    } as never);
    vi.mocked(cadastrosApi.contasGerenciais.listar).mockResolvedValue({
      items: [
        {
          id: 'cg2',
          codigo: 'DESP.02',
          descricao: 'Alimentação',
          tipo: 'Despesa',
          contaPaiId: 'cg-parent',
          contaPaiDescricao: 'Despesas',
          ativo: true,
          aceitaLancamentos: true
        },
        { id: 'cg-parent', codigo: 'DESP', descricao: 'Despesas', tipo: 'Despesa', contaPaiId: null, contaPaiDescricao: null, ativo: true, aceitaLancamentos: false },
        {
          id: 'cg1',
          codigo: 'DESP.10',
          descricao: 'Despesa Operacional',
          tipo: 'Despesa',
          contaPaiId: 'cg-parent',
          contaPaiDescricao: 'Despesas',
          ativo: true,
          aceitaLancamentos: true
        }
      ],
      page: 1,
      pageSize: 100,
      totalItems: 3,
      totalPages: 1
    } as never);

    await expect(contasPagarModuleConfig.loadPessoaOptions()).resolves.toEqual([{ label: 'Fornecedor', value: 'p1' }]);
    await expect(contasPagarModuleConfig.loadFormaPagamentoOptions()).resolves.toEqual([
      { label: 'Credito', value: 'f1', ehCartao: true, baixarAutomaticamente: false }
    ]);
    await expect(contasPagarModuleConfig.loadContaBancariaOptions()).resolves.toEqual([{ label: 'Conta principal - Banco Exemplo', value: 'cb1' }]);
    await expect(contasPagarModuleConfig.loadCartaoOptions()).resolves.toEqual([{ label: 'Visa Corporate - final 4242', value: 'c1' }]);
    await expect(contasPagarModuleConfig.loadRateioOptions()).resolves.toEqual([
      { label: 'DESP.02 - Alimentação', value: 'cg2' },
      { label: 'DESP.10 - Despesa Operacional', value: 'cg1' }
    ]);

    expect(cadastrosApi.contasGerenciais.listar).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'Despesa', aceitaLancamentos: true }));
    expect(
      resolveFormaPagamentoBehavior('f1', [{ label: 'Credito', value: 'f1', ehCartao: true, baixarAutomaticamente: false }])
    ).toEqual({ ehCartao: true, baixarAutomaticamente: false });
    expect(resolveFormaPagamentoBehavior('missing', [])).toEqual({ ehCartao: false, baixarAutomaticamente: false });
  });
});

import { isValidElement } from 'react';
import {
  calculateValorLiquido,
  contasPagarModuleConfig,
  contasReceberModuleConfig,
  resolveFormaPagamentoBehavior,
  resolveStatusTone,
  statusFilterOptions,
  statusOptions,
  type FinanceiroFormValues
} from './module-config';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { financeiroApi } from '../../services/http/financeiro-api';
import { comprasPlanejadasApi } from '../../services/http/compras-planejadas-api';

vi.mock('../../services/http/cadastros-api', () => ({
  cadastrosApi: {
    pessoas: { listar: vi.fn() },
    formasPagamento: { listar: vi.fn() },
    contasBancarias: { listar: vi.fn() },
    cartoes: { listar: vi.fn() },
    contasGerenciais: { listar: vi.fn() }
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
      estornar: vi.fn(),
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
      estornar: vi.fn(),
      cancelar: vi.fn()
    }
  }
}));

vi.mock('../../services/http/compras-planejadas-api', () => ({
  comprasPlanejadasApi: {
    obterPorId: vi.fn()
  }
}));

function formValues(overrides: Partial<FinanceiroFormValues> = {}): FinanceiroFormValues {
  return {
    ...contasPagarModuleConfig.defaultValues,
    origemCompraPlanejadaId: '',
    numeroDocumento: ' DOC-1 ',
    pessoaId: 'pessoa-1',
    responsavelId: 'resp-1',
    dataEmissao: '2026-06-10',
    dataVencimento: '2026-06-20',
    formaPagamentoId: 'forma-1',
    cartaoId: '',
    contaBancariaId: '',
    dataLiquidacao: '',
    valorOriginal: 100,
    valorDesconto: 10,
    valorJuros: 2,
    valorMulta: 3,
    quantidadeParcelas: 2,
    descricao: ' Descricao ',
    observacao: ' Observacao ',
    rateios: [{ contaGerencialId: 'conta-1', valor: 95 }],
    ehRecorrente: true,
    recorrenciaTipoPeriodicidade: 'Mensal',
    recorrenciaTipoDia: 'DiaFixo',
    recorrenciaDiaOrdemMensal: 31,
    recorrenciaDataInicio: '2026-02',
    recorrenciaDataFim: '2026-04',
    recorrenciaPermiteEdicaoOcorrenciaIndividual: false,
    recorrenciaObservacao: ' Recorrencia ',
    recorrenciaGerarAteData: '',
    ...overrides
  };
}

const detailBase = {
  numeroDocumento: null,
  dataEmissao: '2026-06-10',
  dataVencimento: '2026-06-20',
  formaPagamentoId: 'forma-1',
  cartaoId: null,
  contaBancariaId: null,
  dataLiquidacao: null,
  valorOriginal: 100,
  valorDesconto: 10,
  valorJuros: 2,
  valorMulta: 3,
  quantidadeParcelas: 2,
  descricao: 'Descricao',
  observacao: null,
  rateios: [{ contaGerencialId: 'conta-1', valor: 95 }],
  ehRecorrente: true,
  recorrencia: {
    tipoPeriodicidade: 'Mensal' as const,
    tipoDia: 'DiaUtil' as const,
    diaOrdemMensal: 5,
    dataInicio: '2026-06-01',
    dataFim: null,
    permiteEdicaoOcorrenciaIndividual: true,
    observacao: null
  }
};

describe('financeiro module config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(financeiroApi.contasPagar.criar).mockResolvedValue({ id: 'cp-1' } as never);
    vi.mocked(financeiroApi.contasPagar.atualizar).mockResolvedValue({ id: 'cp-1' } as never);
    vi.mocked(financeiroApi.contasPagar.alterarFuturas).mockResolvedValue({ id: 'cp-1' } as never);
    vi.mocked(financeiroApi.contasPagar.liquidar).mockResolvedValue({ id: 'cp-1' } as never);
    vi.mocked(financeiroApi.contasReceber.criar).mockResolvedValue({ id: 'cr-1' } as never);
    vi.mocked(financeiroApi.contasReceber.atualizar).mockResolvedValue({ id: 'cr-1' } as never);
    vi.mocked(cadastrosApi.pessoas.listar).mockResolvedValue({ items: [{ id: 'p1', nome: 'Pessoa' }] } as never);
    vi.mocked(cadastrosApi.formasPagamento.listar).mockResolvedValue({
      items: [{ id: 'f1', nome: 'Pix', ehCartao: false, baixarAutomaticamente: true }]
    } as never);
    vi.mocked(cadastrosApi.contasBancarias.listar).mockResolvedValue({ items: [{ id: 'b1', nome: 'Conta', banco: 'Banco' }] } as never);
    vi.mocked(cadastrosApi.cartoes.listar).mockResolvedValue({ items: [{ id: 'c1', nome: 'Visa', numeroFinal: '1234' }] } as never);
    vi.mocked(cadastrosApi.contasGerenciais.listar).mockResolvedValue({
      items: [
        { id: 'g2', codigo: '2.1', descricao: 'Receita', aceitaLancamentos: true },
        { id: 'g1', codigo: '1', descricao: 'Sintetica', aceitaLancamentos: false }
      ]
    } as never);
    vi.mocked(comprasPlanejadasApi.obterPorId).mockResolvedValue({
      id: 'compra-1',
      titulo: 'Notebook',
      link: 'https://example.test/produto',
      valorEstimado: 3000,
      quantidadeParcelasDesejada: null,
      responsavelId: 'resp-2',
      dataDesejada: null,
      contaGerencialId: 'conta-2'
    } as never);
  });

  it('calculates totals, payment behavior and status tones', () => {
    expect(calculateValorLiquido({ valorOriginal: 100, valorDesconto: 10, valorJuros: 2.335, valorMulta: 1 })).toBe(93.34);
    expect(resolveFormaPagamentoBehavior('f-card', [{ label: 'Cartao', value: 'f-card', ehCartao: true, baixarAutomaticamente: false }])).toEqual({
      ehCartao: true,
      baixarAutomaticamente: false
    });
    expect(resolveFormaPagamentoBehavior('missing', [])).toEqual({ ehCartao: false, baixarAutomaticamente: false });
    expect(resolveStatusTone('LIQUIDADA')).toBe('positive');
    expect(resolveStatusTone('CANCELADA')).toBe('neutral');
    expect(resolveStatusTone('EM_FATURA')).toBe('neutral');
    expect(resolveStatusTone('VENCIDA')).toBe('negative');
    expect(resolveStatusTone('PENDENTE')).toBe('warning');
    expect(statusOptions).toHaveLength(6);
    expect(statusFilterOptions.every((option) => option.value)).toBe(true);
  });

  it('builds payable payloads, recurrence dates and planned purchase defaults', async () => {
    const values = formValues({ origemCompraPlanejadaId: 'compra-1', cartaoId: 'cartao-1', contaBancariaId: 'banco-1' });

    await contasPagarModuleConfig.create(values);
    expect(financeiroApi.contasPagar.criar).toHaveBeenCalledWith(
      expect.objectContaining({
        origemCompraPlanejadaId: 'compra-1',
        numeroDocumento: 'DOC-1',
        descricao: 'Descricao',
        observacao: 'Observacao',
        cartaoId: 'cartao-1',
        contaBancariaId: 'banco-1',
        responsavelCompraId: 'resp-1',
        recebedorId: 'pessoa-1',
        recorrencia: expect.objectContaining({
          dataInicio: '2026-02-28',
          dataFim: '2026-04-30',
          observacao: 'Recorrencia'
        })
      })
    );

    await contasPagarModuleConfig.update('cp-1', values);
    await contasPagarModuleConfig.alterarFuturas?.('cp-1', values);
    await contasPagarModuleConfig.liquidar?.('cp-1', {
      valorLiquidacao: 90,
      dataLiquidacao: '2026-06-21',
      contaBancariaId: 'banco-1',
      formaPagamentoId: 'forma-1',
      atualizarValorConta: true,
      atualizarRecorrencia: false,
      cancelarValorRestante: false
    });

    expect(financeiroApi.contasPagar.atualizar).toHaveBeenCalled();
    expect(financeiroApi.contasPagar.alterarFuturas).toHaveBeenCalled();
    expect(financeiroApi.contasPagar.liquidar).toHaveBeenCalledWith('cp-1', {
      valorLiquidacao: 90,
      dataLiquidacao: '2026-06-21',
      contaBancariaId: 'banco-1',
      formaPagamentoId: 'forma-1',
      atualizarValorConta: true,
      atualizarRecorrencia: false,
      cancelarValorRestante: false
    });

    await expect(contasPagarModuleConfig.resolveCreateDefaults?.(new URLSearchParams())).resolves.toBeNull();
    await expect(
      contasPagarModuleConfig.resolveCreateDefaults?.(new URLSearchParams('origemCompraPlanejadaId=compra-1'))
    ).resolves.toEqual(
      expect.objectContaining({
        origemCompraPlanejadaId: 'compra-1',
        descricao: 'Notebook',
        quantidadeParcelas: 1,
        observacao: 'Origem: compra planejada\nhttps://example.test/produto'
      })
    );
  });

  it('builds receivable payloads and omits optional recurrence fields when disabled', async () => {
    const values = formValues({
      ehRecorrente: false,
      numeroDocumento: '',
      observacao: '',
      dataLiquidacao: ' ',
      cartaoId: '',
      contaBancariaId: ''
    });

    await contasReceberModuleConfig.create(values);
    await contasReceberModuleConfig.update('cr-1', values);

    expect(financeiroApi.contasReceber.criar).toHaveBeenCalledWith(
      expect.objectContaining({
        numeroDocumento: null,
        observacao: null,
        dataLiquidacao: null,
        cartaoId: null,
        contaBancariaId: null,
        pagadorId: 'pessoa-1',
        responsavelId: 'resp-1',
        recorrencia: null
      })
    );
    expect(financeiroApi.contasReceber.atualizar).toHaveBeenCalled();
  });

  it('maps details back to form values for payable and receivable accounts', () => {
    expect(
      contasPagarModuleConfig.toFormValues({
        ...detailBase,
        origemCompraPlanejadaId: 'compra-1',
        recebedorId: 'pessoa-1',
        responsavelCompraId: null
      } as never)
    ).toEqual(
      expect.objectContaining({
        origemCompraPlanejadaId: 'compra-1',
        pessoaId: 'pessoa-1',
        responsavelId: '',
        formaPagamentoId: 'forma-1',
        recorrenciaTipoDia: 'DiaUtil',
        recorrenciaDataInicio: '2026-06',
        recorrenciaDataFim: ''
      })
    );

    expect(
      contasReceberModuleConfig.toFormValues({
        ...detailBase,
        pagadorId: 'pessoa-2',
        responsavelId: 'resp-2'
      } as never)
    ).toEqual(expect.objectContaining({ pessoaId: 'pessoa-2', responsavelId: 'resp-2', formaPagamentoId: 'forma-1' }));
  });

  it('loads select options and builds summary items', async () => {
    await expect(contasPagarModuleConfig.loadPessoaOptions()).resolves.toEqual([{ label: 'Pessoa', value: 'p1' }]);
    await expect(contasPagarModuleConfig.loadFormaPagamentoOptions()).resolves.toEqual([
      { label: 'Pix', value: 'f1', ehCartao: false, baixarAutomaticamente: true }
    ]);
    await expect(contasPagarModuleConfig.loadContaBancariaOptions()).resolves.toEqual([{ label: 'Conta - Banco', value: 'b1' }]);
    await expect(contasPagarModuleConfig.loadCartaoOptions()).resolves.toEqual([{ label: 'Visa - final 1234', value: 'c1' }]);
    await expect(contasPagarModuleConfig.loadRateioOptions()).resolves.toEqual([
      expect.objectContaining({ value: 'g2', displayText: '2.1 - Receita', label: '2.1 - Receita' })
    ]);
    expect(cadastrosApi.contasGerenciais.listar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'Despesa', ativo: true })
    );

    const summary = contasReceberModuleConfig.buildSummaryItems?.({
      totalRegistros: 2,
      totalPendente: 100,
      totalVencendoHoje: 1,
      totalLiquidado: 30,
      valorTotal: 130
    });

    expect(summary?.map((item) => item.key)).toEqual(['registros', 'total-pendente', 'total-hoje', 'total-liquidado', 'valor-total']);
    expect(summary?.[1].tone).toBe('danger');
  });

  it('renders configured columns for table-only values', () => {
    const payableRow = {
      numeroParcela: 1,
      quantidadeParcelas: 3,
      dataVencimento: '2026-06-21',
      valorLiquido: 95,
      statusCodigo: 'PENDENTE'
    };

    const renderResults = contasPagarModuleConfig.columns
      .map((column) => ('render' in column && typeof column.render === 'function' ? column.render(payableRow[column.dataIndex as never], payableRow as never, 0) : null))
      .filter(Boolean);

    expect(renderResults).toEqual(expect.arrayContaining(['21/06/2026', 'R$95,00', '1/3']));
    expect(contasPagarModuleConfig.defaultFilters.statusCodigo).toEqual(['PENDENTE', 'VENCIDA']);
  });

  it('keeps direct service delegates wired for recurring actions', async () => {
    await contasPagarModuleConfig.gerarOcorrencias?.('cp-1', { ateData: '2026-12-31' });
    await contasPagarModuleConfig.pausarRecorrencia?.('cp-1');
    await contasPagarModuleConfig.encerrarRecorrencia?.('cp-1', { dataFim: '2026-12-31' });
    await contasPagarModuleConfig.estornar?.('cp-1');
    await contasPagarModuleConfig.cancelar?.('cp-1');

    expect(isValidElement(contasPagarModuleConfig.columns[0].title as never)).toBe(false);
    expect(financeiroApi.contasPagar.gerarOcorrencias).toHaveBeenCalledWith('cp-1', { ateData: '2026-12-31' });
    expect(financeiroApi.contasPagar.pausarRecorrencia).toHaveBeenCalledWith('cp-1');
    expect(financeiroApi.contasPagar.encerrarRecorrencia).toHaveBeenCalledWith('cp-1', { dataFim: '2026-12-31' });
    expect(financeiroApi.contasPagar.estornar).toHaveBeenCalledWith('cp-1');
    expect(financeiroApi.contasPagar.cancelar).toHaveBeenCalledWith('cp-1');
  });
});

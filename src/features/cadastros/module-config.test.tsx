import {
  cartoesModuleConfig,
  contasBancariasModuleConfig,
  contasGerenciaisModuleConfig,
  formasPagamentoModuleConfig,
  pessoasModuleConfig
} from './module-config';
import { cadastrosApi } from '../../services/http/cadastros-api';

vi.mock('../../services/http/cadastros-api', () => ({
  cadastrosApi: {
    pessoas: {
      listar: vi.fn(),
      obterPorId: vi.fn(),
      criar: vi.fn(),
      atualizar: vi.fn(),
      ativar: vi.fn(),
      inativar: vi.fn()
    },
    formasPagamento: {
      listar: vi.fn(),
      obterPorId: vi.fn(),
      criar: vi.fn(),
      atualizar: vi.fn()
    },
    contasBancarias: {
      listar: vi.fn(),
      obterPorId: vi.fn(),
      criar: vi.fn(),
      atualizar: vi.fn()
    },
    cartoes: {
      listar: vi.fn(),
      obterPorId: vi.fn(),
      criar: vi.fn(),
      atualizar: vi.fn()
    },
    contasGerenciais: {
      listar: vi.fn(),
      obterPorId: vi.fn(),
      criar: vi.fn(),
      atualizar: vi.fn()
    }
  }
}));

describe('cadastro module config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps detail payloads to form values', () => {
    expect(
      pessoasModuleConfig.toFormValues({
        id: '1',
        nome: 'Pessoa',
        tipoPessoa: 'Fisica',
        cpfCnpj: null,
        email: null,
        telefone: null,
        observacao: null,
        chavesPix: [{ tipo: 'Email', chave: 'pix@example.com' }],
        ativo: true,
        createdAtUtc: '2026-04-03T00:00:00Z',
        updatedAtUtc: '2026-04-03T00:00:00Z'
      })
    ).toEqual({
      nome: 'Pessoa',
      tipoPessoa: 'Fisica',
      cpfCnpj: '',
      email: '',
      telefone: '',
      observacao: '',
      chavesPix: [{ tipo: 'Email', chave: 'pix@example.com' }]
    });

    expect(
      contasBancariasModuleConfig.toFormValues({
        id: '1',
        nome: 'Conta',
        banco: 'Banco',
        agencia: null,
        numeroConta: null,
        tipoConta: null,
        saldoInicial: 10,
        dataSaldoInicial: '2026-04-03',
        saldoAtual: 10,
        limiteCartoesCompartilhado: 5000,
        limiteCartoesComprometido: 350,
        limiteCartoesDisponivel: 4650,
        ativo: true,
        createdAtUtc: '',
        updatedAtUtc: ''
      })
    ).toMatchObject({
      agencia: '',
      numeroConta: '',
      tipoConta: '',
      limiteCartoesCompartilhado: 5000
    });

    expect(
      formasPagamentoModuleConfig.toFormValues({
        id: '1',
        nome: 'Pix',
        tipo: 'Pix',
        ehCartao: false,
        baixarAutomaticamente: false,
        ativo: true,
        createdAtUtc: '',
        updatedAtUtc: ''
      })
    ).toEqual({
      nome: 'Pix',
      tipo: 'Pix',
      ehCartao: false,
      baixarAutomaticamente: false,
      ativo: true
    });

    expect(
      cartoesModuleConfig.toFormValues({
        id: '1',
        nome: 'Cartao',
        bandeira: 'Visa',
        numeroFinal: '1234',
        diaFechamentoFatura: 8,
        diaVencimentoFatura: 15,
        contaBancariaPagamentoPadraoId: null,
        limiteCredito: null,
        usaLimiteCompartilhado: true,
        limiteEfetivo: 6000,
        limiteComprometido: 350,
        limiteDisponivel: 5650,
        ativo: true,
        createdAtUtc: '',
        updatedAtUtc: ''
      })
    ).toMatchObject({
      contaBancariaPagamentoPadraoId: '',
      limiteCredito: null
    });

    expect(
      contasGerenciaisModuleConfig.toFormValues({
        id: '1',
        codigo: null,
        descricao: 'Despesa',
        tipo: 'Despesa',
        contaPaiId: null,
        contaPaiDescricao: null,
        ativo: true,
        aceitaLancamentos: true,
        ehPadraoRecebimentoFaturaCartao: false,
        responsavelPadraoId: 'p1',
        responsavelPadraoNome: 'Matheus',
        createdAtUtc: '',
        updatedAtUtc: ''
      })
    ).toMatchObject({
      codigo: '',
      contaPaiId: '',
      ehPadraoRecebimentoFaturaCartao: false,
      responsavelPadraoId: 'p1'
    });

    expect(contasGerenciaisModuleConfig.listDescription).toBe(
      'Cadastre a estrutura de receita e despesa para rateio e visão gerencial.'
    );
    expect(contasGerenciaisModuleConfig.formDescription).toBe(
      'Contas pai são estruturais; somente contas sem filhos podem receber lançamentos e planejamentos.'
    );
    expect(contasGerenciaisModuleConfig.columns.find((column) => column.key === 'responsavelPadraoNome')?.title).toBe(
      'Responsável padrão'
    );
    expect(contasGerenciaisModuleConfig.fields.find((field) => field.name === 'responsavelPadraoId')?.label).toBe(
      'Responsável padrão'
    );
  });

  it('normalizes create and update payloads for related ids', async () => {
    vi.mocked(cadastrosApi.cartoes.criar).mockResolvedValue({} as never);
    vi.mocked(cadastrosApi.cartoes.atualizar).mockResolvedValue({} as never);
    vi.mocked(cadastrosApi.contasGerenciais.criar).mockResolvedValue({} as never);
    vi.mocked(cadastrosApi.contasGerenciais.atualizar).mockResolvedValue({} as never);

    await cartoesModuleConfig.create({
      nome: 'Cartao',
      bandeira: 'Visa',
      numeroFinal: '1234',
      diaFechamentoFatura: 8,
      diaVencimentoFatura: 15,
      contaBancariaPagamentoPadraoId: '',
      limiteCredito: null,
      ativo: true
    });

    await cartoesModuleConfig.update('1', {
      nome: 'Cartao',
      bandeira: 'Visa',
      numeroFinal: '1234',
      diaFechamentoFatura: 8,
      diaVencimentoFatura: 15,
      contaBancariaPagamentoPadraoId: '',
      limiteCredito: null,
      ativo: true
    });

    await contasGerenciaisModuleConfig.create({
      codigo: '',
      descricao: 'Despesa',
      tipo: 'Despesa',
      contaPaiId: '',
      ehPadraoRecebimentoFaturaCartao: false,
      responsavelPadraoId: '',
      ativo: true
    });

    await contasGerenciaisModuleConfig.update('1', {
      codigo: '',
      descricao: 'Despesa',
      tipo: 'Despesa',
      contaPaiId: '',
      ehPadraoRecebimentoFaturaCartao: false,
      responsavelPadraoId: '',
      ativo: true
    });

    expect(cadastrosApi.cartoes.criar).toHaveBeenCalledWith(expect.objectContaining({ contaBancariaPagamentoPadraoId: null }));
    expect(cadastrosApi.cartoes.atualizar).toHaveBeenCalledWith('1', expect.objectContaining({ contaBancariaPagamentoPadraoId: null }));
    expect(cadastrosApi.contasGerenciais.criar).toHaveBeenCalledWith(expect.objectContaining({ contaPaiId: null, responsavelPadraoId: null }));
    expect(cadastrosApi.contasGerenciais.atualizar).toHaveBeenCalledWith('1', expect.objectContaining({ contaPaiId: null, responsavelPadraoId: null }));
  });

  it('loads related options and triggers person status actions', async () => {
    vi.mocked(cadastrosApi.contasBancarias.listar).mockResolvedValue({
      items: [
        {
          id: 'b1',
          nome: 'Conta principal',
          banco: 'Banco Exemplo',
          agencia: null,
          numeroConta: null,
          tipoConta: null,
          saldoInicial: 0,
          dataSaldoInicial: '2026-04-01',
          saldoAtual: 0,
          limiteCartoesCompartilhado: 5000,
          limiteCartoesComprometido: 350,
          limiteCartoesDisponivel: 4650,
          ativo: true
        }
      ],
      page: 1,
      pageSize: 100,
      totalItems: 1,
      totalPages: 1
    } as never);
    vi.mocked(cadastrosApi.contasGerenciais.listar).mockResolvedValue({
      items: [
        {
          id: 'c2',
          codigo: 'DES.10',
          descricao: 'Tecnologia',
          tipo: 'Despesa',
          contaPaiId: null,
          contaPaiDescricao: null,
          ativo: true,
          aceitaLancamentos: false,
          ehPadraoRecebimentoFaturaCartao: false,
          responsavelPadraoId: 'p2',
          responsavelPadraoNome: 'Matheus'
        },
        {
          id: 'c1',
          codigo: 'DES.02',
          descricao: 'Alimentação',
          tipo: 'Despesa',
          contaPaiId: null,
          contaPaiDescricao: null,
          ativo: true,
          aceitaLancamentos: false,
          ehPadraoRecebimentoFaturaCartao: false,
          responsavelPadraoId: null,
          responsavelPadraoNome: null
        },
        {
          id: 'c3',
          codigo: null,
          descricao: 'Sem código',
          tipo: 'Despesa',
          contaPaiId: null,
          contaPaiDescricao: null,
          ativo: true,
          aceitaLancamentos: false,
          ehPadraoRecebimentoFaturaCartao: false,
          responsavelPadraoId: null,
          responsavelPadraoNome: null
        }
      ],
      page: 1,
      pageSize: 100,
      totalItems: 3,
      totalPages: 1
    } as never);
    vi.mocked(cadastrosApi.pessoas.listar).mockResolvedValue({
      items: [
        {
          id: 'p2',
          nome: 'Matheus',
          tipoPessoa: 'Fisica',
          cpfCnpj: null,
          email: null,
          telefone: null,
          ativo: true
        }
      ],
      page: 1,
      pageSize: 100,
      totalItems: 1,
      totalPages: 1
    } as never);

    const contaField = cartoesModuleConfig.fields.find((field) => field.name === 'contaBancariaPagamentoPadraoId');
    const contaPaiField = contasGerenciaisModuleConfig.fields.find((field) => field.name === 'contaPaiId');
    const responsavelField = contasGerenciaisModuleConfig.fields.find((field) => field.name === 'responsavelPadraoId');

    await expect(contaField?.loadOptions?.()).resolves.toEqual([{ label: 'Conta principal - Banco Exemplo', value: 'b1' }]);
    await expect(contaPaiField?.loadOptions?.()).resolves.toEqual([
      {
        label: 'DES.02 - Alimentação',
        value: 'c1',
        data: {
          codigo: 'DES.02',
          descricao: 'Alimentação',
          tipo: 'Despesa',
          contaPaiId: null,
          responsavelPadraoId: null,
          responsavelPadraoNome: null
        }
      },
      {
        label: 'DES.10 - Tecnologia',
        value: 'c2',
        data: {
          codigo: 'DES.10',
          descricao: 'Tecnologia',
          tipo: 'Despesa',
          contaPaiId: null,
          responsavelPadraoId: 'p2',
          responsavelPadraoNome: 'Matheus'
        }
      },
      {
        label: 'Sem código',
        value: 'c3',
        data: {
          codigo: null,
          descricao: 'Sem código',
          tipo: 'Despesa',
          contaPaiId: null,
          responsavelPadraoId: null,
          responsavelPadraoNome: null
        }
      }
    ]);
    await expect(responsavelField?.loadOptions?.()).resolves.toEqual([{ label: 'Matheus', value: 'p2' }]);

    await pessoasModuleConfig.rowActions?.[1].onClick?.({
      id: '1',
      nome: 'Pessoa',
      tipoPessoa: 'Fisica',
      cpfCnpj: null,
      email: null,
      telefone: null,
      ativo: true
    });

    await pessoasModuleConfig.rowActions?.[1].onClick?.({
      id: '2',
      nome: 'Pessoa 2',
      tipoPessoa: 'Juridica',
      cpfCnpj: null,
      email: null,
      telefone: null,
      ativo: false
    });

    expect(cadastrosApi.pessoas.inativar).toHaveBeenCalledWith('1');
    expect(cadastrosApi.pessoas.ativar).toHaveBeenCalledWith('2');
    expect(formasPagamentoModuleConfig.columns.length).toBeGreaterThan(0);
    expect(pessoasModuleConfig.rowActions?.[0].href?.({ id: '1' } as never)).toBe('/pessoas/1');

    const toggleStatusLabel = pessoasModuleConfig.rowActions?.[1].label;
    expect(typeof toggleStatusLabel).toBe('function');

    if (typeof toggleStatusLabel !== 'function') {
      throw new Error('Expected toggle status label to be a function.');
    }

    expect(toggleStatusLabel({ ativo: true } as never)).toBe('Inativar');
    expect(toggleStatusLabel({ ativo: false } as never)).toBe('Ativar');
  });

  it('executes render callbacks from the support module columns', () => {
    const pessoaDocumentoRender = pessoasModuleConfig.columns[2].render;
    const pessoaStatusRender = pessoasModuleConfig.columns[4].render;
    const formaCartaoRender = formasPagamentoModuleConfig.columns[2].render;
    const formaBaixaRender = formasPagamentoModuleConfig.columns[3].render;
    const contaBancoRender = contasBancariasModuleConfig.columns[2].render;
    const contaSaldoRender = contasBancariasModuleConfig.columns[3].render;
    const contaLimiteRender = contasBancariasModuleConfig.columns[4].render;
    const cartaoOrigemRender = cartoesModuleConfig.columns[5].render;
    const cartaoDisponivelRender = cartoesModuleConfig.columns[7].render;
    const cartaoStatusRender = cartoesModuleConfig.columns[8].render;
    const contaGerencialPaiRender = contasGerenciaisModuleConfig.columns[3].render;
    const contaGerencialResponsavelRender = contasGerenciaisModuleConfig.columns[4].render;
    const contaGerencialUsoRender = contasGerenciaisModuleConfig.columns[5].render;
    const contaGerencialPadraoRender = contasGerenciaisModuleConfig.columns[6].render;
    const contaGerencialStatusRender = contasGerenciaisModuleConfig.columns[7].render;

    expect(pessoaDocumentoRender?.('43778209825', {} as never, 0)).toBe('437.782.098-25');
    expect(pessoaDocumentoRender?.(null, {} as never, 0)).toBe('-');
    expect(pessoaStatusRender?.(true, { ativo: true } as never, 0)).toBeTruthy();
    expect(formaCartaoRender?.(true, { ehCartao: true } as never, 0)).toBeTruthy();
    expect(formaBaixaRender?.(false, { baixarAutomaticamente: false } as never, 0)).toBeTruthy();
    expect(contaBancoRender?.(null, {} as never, 0)).toBe('-');
    expect(contaSaldoRender?.(123.45, {} as never, 0)).toContain('R$');
    expect(contaSaldoRender?.(undefined, {} as never, 0)).toBe('-');
    expect(contaLimiteRender?.(5000, {} as never, 0)).toContain('R$');
    expect(cartaoOrigemRender?.(true, { usaLimiteCompartilhado: true } as never, 0)).toBeTruthy();
    expect(cartaoDisponivelRender?.(5650, {} as never, 0)).toContain('R$');
    expect(cartaoStatusRender?.(false, { ativo: false } as never, 0)).toBeTruthy();
    expect(contaGerencialPaiRender?.(null, {} as never, 0)).toBe('-');
    expect(contaGerencialResponsavelRender?.('Matheus', {} as never, 0)).toBe('Matheus');
    expect(contaGerencialUsoRender?.(true, { aceitaLancamentos: true } as never, 0)).toBeTruthy();
    expect(contaGerencialPadraoRender?.(true, { ehPadraoRecebimentoFaturaCartao: true } as never, 0)).toBeTruthy();
    expect(contaGerencialStatusRender?.(true, { ativo: true } as never, 0)).toBeTruthy();
  });

  it('opens contas gerenciais ordered by codigo by default', () => {
    expect(contasGerenciaisModuleConfig.defaultFilters).toMatchObject({
      page: 1,
      pageSize: 20,
      sortBy: 'codigo',
      sortDirection: 'Asc'
    });
  });
});

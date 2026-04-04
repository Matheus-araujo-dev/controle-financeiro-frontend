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
      observacao: ''
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
        ativo: true,
        createdAtUtc: '',
        updatedAtUtc: ''
      })
    ).toMatchObject({
      agencia: '',
      numeroConta: '',
      tipoConta: ''
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
        createdAtUtc: '',
        updatedAtUtc: ''
      })
    ).toMatchObject({
      codigo: '',
      contaPaiId: ''
    });
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
      ativo: true
    });

    await contasGerenciaisModuleConfig.update('1', {
      codigo: '',
      descricao: 'Despesa',
      tipo: 'Despesa',
      contaPaiId: '',
      ativo: true
    });

    expect(cadastrosApi.cartoes.criar).toHaveBeenCalledWith(expect.objectContaining({ contaBancariaPagamentoPadraoId: null }));
    expect(cadastrosApi.cartoes.atualizar).toHaveBeenCalledWith('1', expect.objectContaining({ contaBancariaPagamentoPadraoId: null }));
    expect(cadastrosApi.contasGerenciais.criar).toHaveBeenCalledWith(expect.objectContaining({ contaPaiId: null }));
    expect(cadastrosApi.contasGerenciais.atualizar).toHaveBeenCalledWith('1', expect.objectContaining({ contaPaiId: null }));
  });

  it('loads related options and triggers person status actions', async () => {
    vi.mocked(cadastrosApi.contasBancarias.listar).mockResolvedValue({
      items: [{ id: 'b1', nome: 'Conta principal', banco: 'Banco Exemplo' }],
      page: 1,
      pageSize: 100,
      totalItems: 1,
      totalPages: 1
    } as never);
    vi.mocked(cadastrosApi.contasGerenciais.listar).mockResolvedValue({
      items: [{ id: 'c1', codigo: 'DESP', descricao: 'Despesa', tipo: 'Despesa', contaPaiId: null, contaPaiDescricao: null, ativo: true }],
      page: 1,
      pageSize: 100,
      totalItems: 1,
      totalPages: 1
    } as never);

    const contaField = cartoesModuleConfig.fields.find((field) => field.name === 'contaBancariaPagamentoPadraoId');
    const contaPaiField = contasGerenciaisModuleConfig.fields.find((field) => field.name === 'contaPaiId');

    await expect(contaField?.loadOptions?.()).resolves.toEqual([{ label: 'Conta principal - Banco Exemplo', value: 'b1' }]);
    await expect(contaPaiField?.loadOptions?.()).resolves.toEqual([{ label: 'DESP - Despesa', value: 'c1' }]);

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
    const pessoaStatusRender = pessoasModuleConfig.columns[4].render;
    const formaCartaoRender = formasPagamentoModuleConfig.columns[2].render;
    const formaBaixaRender = formasPagamentoModuleConfig.columns[3].render;
    const contaBancoRender = contasBancariasModuleConfig.columns[2].render;
    const contaSaldoRender = contasBancariasModuleConfig.columns[3].render;
    const cartaoStatusRender = cartoesModuleConfig.columns[5].render;
    const contaGerencialPaiRender = contasGerenciaisModuleConfig.columns[3].render;
    const contaGerencialStatusRender = contasGerenciaisModuleConfig.columns[4].render;

    expect(pessoaStatusRender?.(true, { ativo: true } as never, 0)).toBeTruthy();
    expect(formaCartaoRender?.(true, { ehCartao: true } as never, 0)).toBeTruthy();
    expect(formaBaixaRender?.(false, { baixarAutomaticamente: false } as never, 0)).toBeTruthy();
    expect(contaBancoRender?.(null, {} as never, 0)).toBe('-');
    expect(contaSaldoRender?.(123.45, {} as never, 0)).toContain('R$');
    expect(cartaoStatusRender?.(false, { ativo: false } as never, 0)).toBeTruthy();
    expect(contaGerencialPaiRender?.(null, {} as never, 0)).toBe('-');
    expect(contaGerencialStatusRender?.(true, { ativo: true } as never, 0)).toBeTruthy();
  });
});

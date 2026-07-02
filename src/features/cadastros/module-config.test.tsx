import { isValidElement } from 'react';
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

function renderColumn(config: typeof pessoasModuleConfig, key: string, value: unknown, record: unknown) {
  const column = config.columns.find((item) => item.key === key);
  return column && 'render' in column && typeof column.render === 'function' ? column.render(value as never, record as never, 0) : null;
}

describe('cadastros module config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cadastrosApi.pessoas.ativar).mockResolvedValue({} as never);
    vi.mocked(cadastrosApi.pessoas.inativar).mockResolvedValue({} as never);
    vi.mocked(cadastrosApi.cartoes.criar).mockResolvedValue({ id: 'cartao-1' } as never);
    vi.mocked(cadastrosApi.cartoes.atualizar).mockResolvedValue({ id: 'cartao-1' } as never);
    vi.mocked(cadastrosApi.contasGerenciais.criar).mockResolvedValue({ id: 'cg-1' } as never);
    vi.mocked(cadastrosApi.contasGerenciais.atualizar).mockResolvedValue({ id: 'cg-1' } as never);
    vi.mocked(cadastrosApi.contasBancarias.listar).mockResolvedValue({
      items: [{ id: 'conta-1', nome: 'Conta Principal', banco: 'Banco A' }]
    } as never);
    vi.mocked(cadastrosApi.contasGerenciais.listar).mockResolvedValue({
      items: [
        {
          id: 'pai-1',
          codigo: '1.1',
          descricao: 'Alimentacao',
          tipo: 'Despesa',
          contaPaiId: null,
          responsavelPadraoId: 'pessoa-1',
          responsavelPadraoNome: 'Responsavel',
          aceitaLancamentos: true
        }
      ]
    } as never);
    vi.mocked(cadastrosApi.pessoas.listar).mockResolvedValue({
      items: [{ id: 'pessoa-1', nome: 'Responsavel' }]
    } as never);
  });

  it('maps pessoas details, summary, export columns and toggle actions', async () => {
    const detail = {
      nome: 'Maria',
      tipoPessoa: 'Fisica',
      cpfCnpj: null,
      email: null,
      telefone: null,
      observacao: null,
      chavesPix: null
    };

    expect(pessoasModuleConfig.toFormValues(detail as never)).toEqual({
      nome: 'Maria',
      tipoPessoa: 'Fisica',
      cpfCnpj: '',
      email: '',
      telefone: '',
      observacao: '',
      chavesPix: []
    });
    expect(pessoasModuleConfig.exportColumns?.map((column) => column.value({ cpfCnpj: '12345678901', ativo: true } as never))).toEqual([
      undefined,
      undefined,
      '123.456.789-01',
      '',
      '',
      'Ativo'
    ]);

    const [editAction, toggleAction] = pessoasModuleConfig.rowActions ?? [];
    expect(editAction.href?.({ id: 'p1' } as never)).toBe('/pessoas/p1');
    expect(typeof toggleAction.label).toBe('function');
    expect(typeof toggleAction.icon).toBe('function');
    expect((toggleAction.label as (record: { ativo: boolean }) => string)({ ativo: true })).toBe('Inativar');
    expect(isValidElement((toggleAction.icon as (record: { ativo: boolean }) => unknown)({ ativo: false }))).toBe(true);
    await toggleAction.onClick?.({ id: 'p1', ativo: true } as never);
    await toggleAction.onClick?.({ id: 'p1', ativo: false } as never);
    expect(cadastrosApi.pessoas.inativar).toHaveBeenCalledWith('p1');
    expect(cadastrosApi.pessoas.ativar).toHaveBeenCalledWith('p1');
  });

  it('renders cadastro table columns with fallback formatting', () => {
    expect(renderColumn(pessoasModuleConfig, 'cpfCnpj', null, { ativo: true })).toBe('-');
    expect(renderColumn(pessoasModuleConfig, 'email', null, { ativo: true })).toBe('-');
    expect(isValidElement(renderColumn(pessoasModuleConfig, 'ativo', undefined, { ativo: true }))).toBe(true);

    expect(isValidElement(renderColumn(formasPagamentoModuleConfig as never, 'ehCartao', undefined, { ehCartao: true }))).toBe(true);
    expect(isValidElement(renderColumn(formasPagamentoModuleConfig as never, 'baixarAutomaticamente', undefined, { baixarAutomaticamente: false }))).toBe(
      true
    );
    expect(isValidElement(renderColumn(formasPagamentoModuleConfig as never, 'ativo', undefined, { ativo: false }))).toBe(true);

    expect(renderColumn(contasBancariasModuleConfig as never, 'numeroConta', null, { ativo: true })).toBe('-');
    expect(renderColumn(contasBancariasModuleConfig as never, 'saldoInicial', 100, { ativo: true })).toBe('R$100,00');
    expect(renderColumn(contasBancariasModuleConfig as never, 'limiteCartoesCompartilhado', null, { ativo: true })).toBe('-');

    expect(isValidElement(renderColumn(cartoesModuleConfig as never, 'usaLimiteCompartilhado', undefined, { usaLimiteCompartilhado: false }))).toBe(
      true
    );
    expect(renderColumn(cartoesModuleConfig as never, 'limiteEfetivo', 500, { ativo: true })).toBe('R$500,00');

    expect(renderColumn(contasGerenciaisModuleConfig as never, 'codigo', null, { ativo: true })).toBe('-');
    expect(renderColumn(contasGerenciaisModuleConfig as never, 'contaPaiDescricao', null, { ativo: true })).toBe('-');
    expect(renderColumn(contasGerenciaisModuleConfig as never, 'responsavelPadraoNome', null, { ativo: true })).toBe('-');
    expect(
      isValidElement(renderColumn(contasGerenciaisModuleConfig as never, 'aceitaLancamentos', undefined, { aceitaLancamentos: true }))
    ).toBe(true);
    expect(
      isValidElement(
        renderColumn(contasGerenciaisModuleConfig as never, 'ehPadraoRecebimentoFaturaCartao', undefined, {
          ehPadraoRecebimentoFaturaCartao: false
        })
      )
    ).toBe(true);
  });

  it('maps simple form values for payment methods and bank accounts', () => {
    expect(
      formasPagamentoModuleConfig.toFormValues({
        nome: 'Pix',
        tipo: 'Pix',
        ehCartao: false,
        baixarAutomaticamente: true,
        ativo: true
      } as never)
    ).toEqual({
      nome: 'Pix',
      tipo: 'Pix',
      ehCartao: false,
      baixarAutomaticamente: true,
      ativo: true
    });

    expect(
      contasBancariasModuleConfig.toFormValues({
        nome: 'Conta',
        banco: 'Banco',
        agencia: null,
        numeroConta: null,
        tipoConta: null,
        saldoInicial: 100,
        dataSaldoInicial: '2026-06-01',
        limiteCartoesCompartilhado: null,
        ativo: true
      } as never)
    ).toEqual(
      expect.objectContaining({
        agencia: '',
        numeroConta: '',
        tipoConta: '',
        limiteCartoesCompartilhado: null
      })
    );
  });

  it('normalizes card payloads and loads bank account options', async () => {
    const payload = {
      nome: 'Visa',
      bandeira: 'Visa',
      numeroFinal: '1234',
      diaFechamentoFatura: 5,
      diaVencimentoFatura: 12,
      contaBancariaPagamentoPadraoId: '',
      limiteCredito: null,
      ativo: true
    };

    await cartoesModuleConfig.create(payload);
    await cartoesModuleConfig.update('cartao-1', { ...payload, contaBancariaPagamentoPadraoId: 'conta-1' });

    expect(cadastrosApi.cartoes.criar).toHaveBeenCalledWith(expect.objectContaining({ contaBancariaPagamentoPadraoId: null }));
    expect(cadastrosApi.cartoes.atualizar).toHaveBeenCalledWith('cartao-1', expect.objectContaining({ contaBancariaPagamentoPadraoId: 'conta-1' }));
    expect(cartoesModuleConfig.toFormValues({ ...payload, contaBancariaPagamentoPadraoId: null } as never).contaBancariaPagamentoPadraoId).toBe('');

    const field = cartoesModuleConfig.fields.find((item) => item.name === 'contaBancariaPagamentoPadraoId');
    await expect(field?.loadOptions?.()).resolves.toEqual([{ label: 'Conta Principal - Banco A', value: 'conta-1' }]);
  });

  it('normalizes managerial account payloads and loads parent/person options', async () => {
    const payload = {
      codigo: '1.1',
      descricao: 'Alimentacao',
      tipo: 'Despesa' as const,
      contaPaiId: '',
      responsavelPadraoId: '',
      ehPadraoRecebimentoFaturaCartao: false,
      ativo: true
    };

    await contasGerenciaisModuleConfig.create(payload);
    await contasGerenciaisModuleConfig.update('cg-1', { ...payload, contaPaiId: 'pai-1', responsavelPadraoId: 'pessoa-1' });

    expect(cadastrosApi.contasGerenciais.criar).toHaveBeenCalledWith(
      expect.objectContaining({ contaPaiId: null, responsavelPadraoId: null })
    );
    expect(cadastrosApi.contasGerenciais.atualizar).toHaveBeenCalledWith(
      'cg-1',
      expect.objectContaining({ contaPaiId: 'pai-1', responsavelPadraoId: 'pessoa-1' })
    );
    expect(
      contasGerenciaisModuleConfig.toFormValues({
        ...payload,
        contaPaiId: null,
        responsavelPadraoId: null,
        ehPadraoRecebimentoFaturaCartao: true
      } as never)
    ).toEqual(expect.objectContaining({ contaPaiId: '', responsavelPadraoId: '', ehPadraoRecebimentoFaturaCartao: true }));

    await expect(contasGerenciaisModuleConfig.fields.find((item) => item.name === 'contaPaiId')?.loadOptions?.()).resolves.toEqual([
      expect.objectContaining({ label: '1.1 - Alimentacao', value: 'pai-1' })
    ]);
    await expect(contasGerenciaisModuleConfig.fields.find((item) => item.name === 'responsavelPadraoId')?.loadOptions?.()).resolves.toEqual([
      { label: 'Responsavel', value: 'pessoa-1' }
    ]);
  });
});

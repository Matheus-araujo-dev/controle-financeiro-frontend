import {
  pessoaSchema,
  formaPagamentoSchema,
  contaBancariaSchema,
  cartaoSchema,
  contaGerencialSchema
} from './schemas';

function validPessoa(overrides = {}) {
  return {
    nome: 'João Silva',
    tipoPessoa: 'Fisica' as const,
    cpfCnpj: '',
    email: '',
    telefone: '',
    observacao: '',
    chavesPix: [],
    ehPagador: false,
    ehRecebedor: false,
    ehResponsavel: false,
    contaGerencialDespesaId: '',
    contaGerencialReceitaId: '',
    ...overrides
  };
}

describe('pessoaSchema', () => {
  it('validates a minimal valid person', () => {
    const result = pessoaSchema.safeParse(validPessoa());
    expect(result.success).toBe(true);
  });

  it('requires nome', () => {
    const result = pessoaSchema.safeParse(validPessoa({ nome: '' }));
    expect(result.success).toBe(false);
  });

  it('allows empty email', () => {
    const result = pessoaSchema.safeParse(validPessoa({ email: '' }));
    expect(result.success).toBe(true);
  });

  it('accepts valid email format', () => {
    const result = pessoaSchema.safeParse(validPessoa({ email: 'joao@exemplo.com' }));
    expect(result.success).toBe(true);
  });

  it('rejects invalid email format', () => {
    const result = pessoaSchema.safeParse(validPessoa({ email: 'nao-e-email' }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(i => i.message === 'E-mail inválido.')).toBe(true);
    }
  });

  it('accepts valid chave pix - aleatoria type', () => {
    const result = pessoaSchema.safeParse(validPessoa({
      chavesPix: [{ tipo: 'Aleatoria', chave: 'abc123-uuid' }]
    }));
    expect(result.success).toBe(true);
  });

  it('rejects email-type chave pix with invalid email', () => {
    const result = pessoaSchema.safeParse(validPessoa({
      chavesPix: [{ tipo: 'Email', chave: 'invalido' }]
    }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(i => i.message === 'E-mail inválido.')).toBe(true);
    }
  });

  it('accepts email-type chave pix with valid email', () => {
    const result = pessoaSchema.safeParse(validPessoa({
      chavesPix: [{ tipo: 'Email', chave: 'pix@email.com' }]
    }));
    expect(result.success).toBe(true);
  });

  it('rejects duplicate chave pix of same type', () => {
    const result = pessoaSchema.safeParse(validPessoa({
      chavesPix: [
        { tipo: 'Aleatoria', chave: 'chave-abc' },
        { tipo: 'Aleatoria', chave: 'chave-abc' }
      ]
    }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(i => i.message === 'Chave Pix duplicada.')).toBe(true);
    }
  });

  it('allows same value for different tipos', () => {
    const result = pessoaSchema.safeParse(validPessoa({
      chavesPix: [
        { tipo: 'Aleatoria', chave: '12345' },
        { tipo: 'Email', chave: '12345@test.com' }
      ]
    }));
    expect(result.success).toBe(true);
  });

  it('normalizes CpfCnpj type by removing non-digits for deduplication', () => {
    const result = pessoaSchema.safeParse(validPessoa({
      chavesPix: [
        { tipo: 'CpfCnpj', chave: '123.456.789-00' },
        { tipo: 'CpfCnpj', chave: '12345678900' }
      ]
    }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(i => i.message === 'Chave Pix duplicada.')).toBe(true);
    }
  });

  it('normalizes Telefone type by removing non-digits', () => {
    const result = pessoaSchema.safeParse(validPessoa({
      chavesPix: [
        { tipo: 'Telefone', chave: '(11) 99999-8888' },
        { tipo: 'Telefone', chave: '11999998888' }
      ]
    }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(i => i.message === 'Chave Pix duplicada.')).toBe(true);
    }
  });

  it('normalizes email-type chave to lowercase for deduplication', () => {
    const result = pessoaSchema.safeParse(validPessoa({
      chavesPix: [
        { tipo: 'Email', chave: 'PIX@EMAIL.COM' },
        { tipo: 'Email', chave: 'pix@email.com' }
      ]
    }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(i => i.message === 'Chave Pix duplicada.')).toBe(true);
    }
  });

  it('requires non-empty chave for pix items', () => {
    const result = pessoaSchema.safeParse(validPessoa({
      chavesPix: [{ tipo: 'Aleatoria', chave: '' }]
    }));
    expect(result.success).toBe(false);
  });
});

describe('formaPagamentoSchema', () => {
  it('validates a valid forma pagamento', () => {
    const result = formaPagamentoSchema.safeParse({
      nome: 'Cartão Visa',
      tipo: 'Credito',
      ehCartao: true,
      baixarAutomaticamente: false,
      ativo: true
    });
    expect(result.success).toBe(true);
  });

  it('requires nome', () => {
    const result = formaPagamentoSchema.safeParse({
      nome: '',
      tipo: 'Pix',
      ehCartao: false,
      baixarAutomaticamente: false,
      ativo: true
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid tipo', () => {
    const result = formaPagamentoSchema.safeParse({
      nome: 'Teste',
      tipo: 'InvalidType',
      ehCartao: false,
      baixarAutomaticamente: false,
      ativo: true
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid tipos', () => {
    const tipos = ['Dinheiro', 'Pix', 'Boleto', 'Transferencia', 'Debito', 'Credito', 'Outro'] as const;
    for (const tipo of tipos) {
      const result = formaPagamentoSchema.safeParse({ nome: 'T', tipo, ehCartao: false, baixarAutomaticamente: false, ativo: true });
      expect(result.success).toBe(true);
    }
  });
});

describe('contaBancariaSchema', () => {
  it('validates a valid conta bancaria', () => {
    const result = contaBancariaSchema.safeParse({
      nome: 'Conta Corrente',
      banco: 'Banco do Brasil',
      agencia: '1234',
      numeroConta: '56789-0',
      tipoConta: 'corrente',
      saldoInicial: 1000,
      dataSaldoInicial: '2026-01-01',
      limiteCartoesCompartilhado: null,
      ativo: true,
      icone: null,
      cor: null
    });
    expect(result.success).toBe(true);
  });

  it('requires nome', () => {
    const result = contaBancariaSchema.safeParse({
      nome: '',
      banco: 'BB',
      agencia: '',
      numeroConta: '',
      tipoConta: '',
      saldoInicial: 0,
      dataSaldoInicial: '2026-01-01',
      limiteCartoesCompartilhado: null,
      ativo: true,
      icone: null,
      cor: null
    });
    expect(result.success).toBe(false);
  });

  it('requires banco', () => {
    const result = contaBancariaSchema.safeParse({
      nome: 'Conta',
      banco: '',
      agencia: '',
      numeroConta: '',
      tipoConta: '',
      saldoInicial: 0,
      dataSaldoInicial: '2026-01-01',
      limiteCartoesCompartilhado: null,
      ativo: true,
      icone: null,
      cor: null
    });
    expect(result.success).toBe(false);
  });
});

describe('cartaoSchema', () => {
  function validCartao(overrides = {}) {
    return {
      nome: 'Nubank',
      bandeira: 'Mastercard',
      numeroFinal: '1234',
      diaFechamentoFatura: 15,
      diaVencimentoFatura: 22,
      contaBancariaPagamentoPadraoId: '',
      limiteCredito: null,
      ativo: true,
      icone: null,
      cor: null,
      ...overrides
    };
  }

  it('validates a valid cartao', () => {
    expect(cartaoSchema.safeParse(validCartao()).success).toBe(true);
  });

  it('rejects numeroFinal with less than 4 digits', () => {
    const result = cartaoSchema.safeParse(validCartao({ numeroFinal: '123' }));
    expect(result.success).toBe(false);
  });

  it('rejects numeroFinal with more than 4 digits', () => {
    const result = cartaoSchema.safeParse(validCartao({ numeroFinal: '12345' }));
    expect(result.success).toBe(false);
  });

  it('rejects diaFechamento below 1', () => {
    const result = cartaoSchema.safeParse(validCartao({ diaFechamentoFatura: 0 }));
    expect(result.success).toBe(false);
  });

  it('rejects diaFechamento above 31', () => {
    const result = cartaoSchema.safeParse(validCartao({ diaFechamentoFatura: 32 }));
    expect(result.success).toBe(false);
  });

  it('accepts diaFechamento at boundary values (1 and 31)', () => {
    expect(cartaoSchema.safeParse(validCartao({ diaFechamentoFatura: 1 })).success).toBe(true);
    expect(cartaoSchema.safeParse(validCartao({ diaFechamentoFatura: 31 })).success).toBe(true);
  });

  it('requires nome', () => {
    expect(cartaoSchema.safeParse(validCartao({ nome: '' })).success).toBe(false);
  });

  it('requires bandeira', () => {
    expect(cartaoSchema.safeParse(validCartao({ bandeira: '' })).success).toBe(false);
  });
});

describe('contaGerencialSchema', () => {
  it('validates a valid conta gerencial', () => {
    const result = contaGerencialSchema.safeParse({
      codigo: '1.1',
      descricao: 'Despesas Operacionais',
      tipo: 'Despesa',
      contaPaiId: '',
      responsavelPadraoId: '',
      contaGerencialContrariaId: '',
      ativo: true,
      ehPadraoRecebimentoFaturaCartao: false
    });
    expect(result.success).toBe(true);
  });

  it('requires descricao', () => {
    const result = contaGerencialSchema.safeParse({
      codigo: '1.1',
      descricao: '',
      tipo: 'Despesa',
      contaPaiId: '',
      responsavelPadraoId: '',
      contaGerencialContrariaId: '',
      ativo: true,
      ehPadraoRecebimentoFaturaCartao: false
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid tipo', () => {
    const result = contaGerencialSchema.safeParse({
      codigo: '1.1',
      descricao: 'Test',
      tipo: 'Invalido',
      contaPaiId: '',
      responsavelPadraoId: '',
      contaGerencialContrariaId: '',
      ativo: true,
      ehPadraoRecebimentoFaturaCartao: false
    });
    expect(result.success).toBe(false);
  });

  it('accepts Receita tipo', () => {
    const result = contaGerencialSchema.safeParse({
      codigo: '2.1',
      descricao: 'Receitas',
      tipo: 'Receita',
      contaPaiId: '',
      responsavelPadraoId: '',
      contaGerencialContrariaId: '',
      ativo: true,
      ehPadraoRecebimentoFaturaCartao: false
    });
    expect(result.success).toBe(true);
  });
});

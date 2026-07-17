import { buildCardInvoiceLink, extractCardInvoicePreview } from './card-invoice';

describe('extractCardInvoicePreview', () => {
  it('returns undefined when cartaoId is missing', () => {
    expect(
      extractCardInvoicePreview({
        cartaoId: null,
        competenciaFaturaCartao: '2026-06',
        dataFechamentoFaturaCartao: '2026-06-15',
        dataVencimentoFaturaCartao: '2026-06-20'
      })
    ).toBeUndefined();
  });

  it('returns undefined when competenciaFaturaCartao is missing', () => {
    expect(
      extractCardInvoicePreview({
        cartaoId: 'card-1',
        competenciaFaturaCartao: null,
        dataFechamentoFaturaCartao: '2026-06-15',
        dataVencimentoFaturaCartao: '2026-06-20'
      })
    ).toBeUndefined();
  });

  it('returns undefined when dataFechamentoFaturaCartao is missing', () => {
    expect(
      extractCardInvoicePreview({
        cartaoId: 'card-1',
        competenciaFaturaCartao: '2026-06',
        dataFechamentoFaturaCartao: null,
        dataVencimentoFaturaCartao: '2026-06-20'
      })
    ).toBeUndefined();
  });

  it('returns undefined when dataVencimentoFaturaCartao is missing', () => {
    expect(
      extractCardInvoicePreview({
        cartaoId: 'card-1',
        competenciaFaturaCartao: '2026-06',
        dataFechamentoFaturaCartao: '2026-06-15',
        dataVencimentoFaturaCartao: null
      })
    ).toBeUndefined();
  });

  it('returns undefined when all fields are missing', () => {
    expect(extractCardInvoicePreview({})).toBeUndefined();
  });

  it('returns a CardInvoicePreview when all required fields are present', () => {
    const result = extractCardInvoicePreview({
      cartaoId: 'card-1',
      cartaoNome: 'Nubank',
      competenciaFaturaCartao: '2026-06',
      dataFechamentoFaturaCartao: '2026-06-15',
      dataVencimentoFaturaCartao: '2026-06-20'
    });

    expect(result).toEqual({
      cartaoId: 'card-1',
      cartaoNome: 'Nubank',
      competencia: '2026-06',
      dataFechamento: '2026-06-15',
      dataVencimento: '2026-06-20'
    });
  });

  it('includes cartaoNome as null when not provided', () => {
    const result = extractCardInvoicePreview({
      cartaoId: 'card-2',
      cartaoNome: null,
      competenciaFaturaCartao: '2026-07',
      dataFechamentoFaturaCartao: '2026-07-15',
      dataVencimentoFaturaCartao: '2026-07-22'
    });

    expect(result).not.toBeUndefined();
    expect(result!.cartaoNome).toBeNull();
  });

  it('includes cartaoNome as undefined when the field is omitted', () => {
    const result = extractCardInvoicePreview({
      cartaoId: 'card-3',
      competenciaFaturaCartao: '2026-08',
      dataFechamentoFaturaCartao: '2026-08-15',
      dataVencimentoFaturaCartao: '2026-08-22'
    });

    expect(result).not.toBeUndefined();
    expect(result!.cartaoNome).toBeUndefined();
  });
});

describe('buildCardInvoiceLink', () => {
  it('builds the correct URL with cartaoId, competencia and origem parameters', () => {
    const link = buildCardInvoiceLink({
      cartaoId: 'card-1',
      competencia: '2026-06',
      dataFechamento: '2026-06-15',
      dataVencimento: '2026-06-20'
    });

    expect(link).toMatch(/^\/faturas\?/);
    expect(link).toContain('cartaoId=card-1');
    expect(link).toContain('competencia=2026-06');
    expect(link).toContain('origem=conta-cartao');
  });

  it('returns a string starting with /faturas', () => {
    const link = buildCardInvoiceLink({
      cartaoId: 'my-card',
      competencia: '2026-01',
      dataFechamento: '2026-01-10',
      dataVencimento: '2026-01-15'
    });
    expect(link.startsWith('/faturas?')).toBe(true);
  });
});

import { normalizeContaFilters, normalizeMovimentacaoFilters } from './filters';

describe('normalizeContaFilters', () => {
  it('joins statusCodigo array into comma-separated string', () => {
    const result = normalizeContaFilters({ statusCodigo: ['PENDENTE', 'VENCIDA'] });
    expect(result.statusCodigo).toBe('PENDENTE,VENCIDA');
  });

  it('returns undefined for empty statusCodigo array', () => {
    const result = normalizeContaFilters({ statusCodigo: [] });
    expect(result.statusCodigo).toBeUndefined();
  });

  it('passes through string statusCodigo unchanged', () => {
    const result = normalizeContaFilters({ statusCodigo: 'LIQUIDADA' });
    expect(result.statusCodigo).toBe('LIQUIDADA');
  });

  it('keeps non-empty recebedorIds array', () => {
    const result = normalizeContaFilters({ recebedorIds: ['p1', 'p2'] });
    expect(result.recebedorIds).toEqual(['p1', 'p2']);
  });

  it('returns undefined for empty recebedorIds array', () => {
    const result = normalizeContaFilters({ recebedorIds: [] });
    expect(result.recebedorIds).toBeUndefined();
  });

  it('keeps non-empty pagadorIds array', () => {
    const result = normalizeContaFilters({ pagadorIds: ['p1'] });
    expect(result.pagadorIds).toEqual(['p1']);
  });

  it('returns undefined for empty pagadorIds array', () => {
    const result = normalizeContaFilters({ pagadorIds: [] });
    expect(result.pagadorIds).toBeUndefined();
  });

  it('keeps non-empty formaPagamentoIds array', () => {
    const result = normalizeContaFilters({ formaPagamentoIds: ['fp1'] });
    expect(result.formaPagamentoIds).toEqual(['fp1']);
  });

  it('returns undefined for empty formaPagamentoIds array', () => {
    const result = normalizeContaFilters({ formaPagamentoIds: [] });
    expect(result.formaPagamentoIds).toBeUndefined();
  });

  it('keeps non-empty responsavelIds array', () => {
    const result = normalizeContaFilters({ responsavelIds: ['r1'] });
    expect(result.responsavelIds).toEqual(['r1']);
  });

  it('returns undefined for empty responsavelIds', () => {
    const result = normalizeContaFilters({ responsavelIds: [] });
    expect(result.responsavelIds).toBeUndefined();
  });

  it('renames dataInicial/dataFinal to dataVencimentoInicial/dataVencimentoFinal', () => {
    const result = normalizeContaFilters({ dataInicial: '2026-01-01', dataFinal: '2026-12-31' });
    expect(result.dataVencimentoInicial).toBe('2026-01-01');
    expect(result.dataVencimentoFinal).toBe('2026-12-31');
    expect((result as Record<string, unknown>).dataInicial).toBeUndefined();
    expect((result as Record<string, unknown>).dataFinal).toBeUndefined();
  });

  it('trims and keeps non-empty numeroDocumento', () => {
    const result = normalizeContaFilters({ numeroDocumento: '  NF-123  ' });
    expect(result.numeroDocumento).toBe('NF-123');
  });

  it('sets numeroDocumento to undefined when blank', () => {
    const result = normalizeContaFilters({ numeroDocumento: '   ' });
    expect(result.numeroDocumento).toBeUndefined();
  });

  it('trims and keeps non-empty descricao', () => {
    const result = normalizeContaFilters({ descricao: '  Aluguel  ' });
    expect(result.descricao).toBe('Aluguel');
  });

  it('sets descricao to undefined when blank', () => {
    const result = normalizeContaFilters({ descricao: '' });
    expect(result.descricao).toBeUndefined();
  });

  it('passes dataEmissaoInicial/Final as-is when provided', () => {
    const result = normalizeContaFilters({ dataEmissaoInicial: '2026-01-01', dataEmissaoFinal: '2026-06-30' });
    expect(result.dataEmissaoInicial).toBe('2026-01-01');
    expect(result.dataEmissaoFinal).toBe('2026-06-30');
  });

  it('sets dataEmissaoInicial to undefined when empty string', () => {
    const result = normalizeContaFilters({ dataEmissaoInicial: '', dataEmissaoFinal: '' });
    expect(result.dataEmissaoInicial).toBeUndefined();
    expect(result.dataEmissaoFinal).toBeUndefined();
  });

  it('keeps non-empty statusCodigos array', () => {
    const result = normalizeContaFilters({ statusCodigos: ['ATIVA'] });
    expect(result.statusCodigos).toEqual(['ATIVA']);
  });

  it('returns undefined for empty statusCodigos array', () => {
    const result = normalizeContaFilters({ statusCodigos: [] });
    expect(result.statusCodigos).toBeUndefined();
  });
});

describe('normalizeMovimentacaoFilters', () => {
  it('joins non-empty contaBancariaIds into comma-separated string', () => {
    const result = normalizeMovimentacaoFilters({
      page: 1, pageSize: 20, contaBancariaIds: ['cb1', 'cb2']
    } as never);
    expect(result.contaBancariaIds).toBe('cb1,cb2');
  });

  it('returns undefined for empty contaBancariaIds', () => {
    const result = normalizeMovimentacaoFilters({ page: 1, pageSize: 20, contaBancariaIds: [] } as never);
    expect(result.contaBancariaIds).toBeUndefined();
  });

  it('filters out blank contaBancariaIds entries', () => {
    const result = normalizeMovimentacaoFilters({ page: 1, pageSize: 20, contaBancariaIds: ['cb1', '  ', 'cb2'] } as never);
    expect(result.contaBancariaIds).toBe('cb1,cb2');
  });

  it('joins non-empty responsavelIds into comma-separated string', () => {
    const result = normalizeMovimentacaoFilters({ page: 1, pageSize: 20, responsavelIds: ['r1'] } as never);
    expect(result.responsavelIds).toBe('r1');
  });

  it('returns undefined for empty responsavelIds', () => {
    const result = normalizeMovimentacaoFilters({ page: 1, pageSize: 20, responsavelIds: [] } as never);
    expect(result.responsavelIds).toBeUndefined();
  });

  it('joins non-empty pessoaIds into comma-separated string', () => {
    const result = normalizeMovimentacaoFilters({ page: 1, pageSize: 20, pessoaIds: ['p1', 'p2'] } as never);
    expect(result.pessoaIds).toBe('p1,p2');
  });

  it('returns undefined for empty pessoaIds', () => {
    const result = normalizeMovimentacaoFilters({ page: 1, pageSize: 20, pessoaIds: [] } as never);
    expect(result.pessoaIds).toBeUndefined();
  });

  it('spreads remaining filter fields through unchanged', () => {
    const result = normalizeMovimentacaoFilters({
      page: 2,
      pageSize: 50,
      search: 'Salário',
      contaBancariaIds: [],
      responsavelIds: [],
      pessoaIds: []
    } as never);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(50);
    expect(result.search).toBe('Salário');
  });
});

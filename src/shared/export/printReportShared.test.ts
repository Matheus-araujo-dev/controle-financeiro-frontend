import {
  esc, buildHeader, buildSummary, buildFiltersBar, buildFooter, buildPeriodStr,
  parseDateGroupHeader, fmtCurrency,
} from './printReportShared';

describe('esc', () => {
  it('escapa &, <, >, "', () => {
    expect(esc('a & b')).toBe('a &amp; b');
    expect(esc('<tag>')).toBe('&lt;tag&gt;');
    expect(esc('"quoted"')).toBe('&quot;quoted&quot;');
  });

  it('retorna string sem caracteres especiais sem alteração', () => {
    expect(esc('Salário julho')).toBe('Salário julho');
  });
});

describe('buildHeader', () => {
  it('contém o título e "controle"', () => {
    const html = buildHeader('Extrato', '25/07/2026 10:00', '');
    expect(html).toContain('Extrato');
    expect(html).toContain('controle');
    expect(html).toContain('doc-header');
  });

  it('inclui periodStr quando fornecido', () => {
    const html = buildHeader('Título', '01/07/2026', ' · Jan/2026');
    expect(html).toContain('Jan/2026');
  });
});

describe('buildSummary', () => {
  it('retorna string vazia para array vazio', () => {
    expect(buildSummary([])).toBe('');
  });

  it('renderiza cards com label e valor', () => {
    const html = buildSummary([
      { label: 'Entradas', value: 'R$ 1.000,00', type: 'pos' },
      { label: 'Saídas', value: 'R$ 500,00', type: 'neg' },
    ]);
    expect(html).toContain('Entradas');
    expect(html).toContain('R$ 1.000,00');
    expect(html).toContain('sum-value pos');
    expect(html).toContain('sum-value neg');
  });

  it('aplica classe vazia quando type é undefined', () => {
    const html = buildSummary([{ label: 'Total', value: 'R$ 0,00' }]);
    expect(html).toContain('sum-value ');
  });
});

describe('buildFiltersBar', () => {
  it('retorna string vazia para array vazio', () => {
    expect(buildFiltersBar([])).toBe('');
  });

  it('renderiza filtros com separador', () => {
    const html = buildFiltersBar([['Período:', 'Jul/2026'], ['Status:', 'Ativo']]);
    expect(html).toContain('Período:');
    expect(html).toContain('Jul/2026');
    expect(html).toContain('Status:');
    expect(html).toContain('Ativo');
    expect(html).toContain('·');
  });
});

describe('buildFooter', () => {
  it('exibe contagem no singular', () => {
    const html = buildFooter(1);
    expect(html).toContain('1 registro');
    expect(html).not.toContain('registros');
  });

  it('exibe contagem no plural', () => {
    const html = buildFooter(5);
    expect(html).toContain('5 registros');
  });
});

describe('parseDateGroupHeader', () => {
  it('formata data ISO como "d mmm · Dia"', () => {
    const result = parseDateGroupHeader('2026-07-24');
    expect(result).toContain('24 jul');
    expect(result).toContain('Sex');
  });

  it('usa nome correto do mês', () => {
    expect(parseDateGroupHeader('2026-01-01')).toContain('jan');
    expect(parseDateGroupHeader('2026-12-31')).toContain('dez');
  });
});

describe('fmtCurrency', () => {
  it('formata valores positivos em pt-BR', () => {
    expect(fmtCurrency(1500)).toBe('R$ 1.500,00');
  });

  it('formata valores negativos em pt-BR', () => {
    expect(fmtCurrency(-287.5)).toMatch(/-R\$|R\$\s*-/);
  });
});

describe('buildPeriodStr', () => {
  it('retorna string vazia quando não há filtro Período:', () => {
    expect(buildPeriodStr([])).toBe('');
    expect(buildPeriodStr([['Status:', 'Ativo']])).toBe('');
  });

  it('retorna período formatado quando filtro Período: está presente', () => {
    const result = buildPeriodStr([['Período:', 'Jul/2026']]);
    expect(result).toContain('Jul/2026');
  });
});

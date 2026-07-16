import { openPrintReport, type PrintColumn, type PrintReportDefinition } from './printReport';

type Row = { descricao: string; valor: number; tipo: 'entrada' | 'saida' };

const columns: PrintColumn<Row>[] = [
  { header: 'Descricao', value: (r) => r.descricao },
  {
    header: 'Valor (R$)',
    value: (r) => r.valor.toFixed(2),
    align: 'right',
    cellClass: (r) => (r.tipo === 'entrada' ? 'pos' : 'neg'),
    totalValue: (rows) => rows.reduce((acc, r) => acc + r.valor, 0).toFixed(2),
  },
];

const rows: Row[] = [
  { descricao: 'Salario', valor: 5000, tipo: 'entrada' },
  { descricao: 'Aluguel', valor: -1500, tipo: 'saida' },
];

const baseDef: PrintReportDefinition<Row> = {
  title: 'Extrato Mensal',
  columns,
  rows,
};

function captureHtml(): { write: ReturnType<typeof vi.fn> } {
  const write = vi.fn();
  const fakeWin = { document: { write, close: vi.fn() } } as unknown as Window;
  vi.spyOn(window, 'open').mockReturnValue(fakeWin);
  return { write };
}

describe('openPrintReport', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('abre nova janela e escreve HTML quando window.open retorna um objeto', () => {
    const { write } = captureHtml();

    openPrintReport(baseDef);

    expect(window.open).toHaveBeenCalledWith('', '_blank', 'noopener,noreferrer');
    expect(write).toHaveBeenCalledOnce();
    const html: string = write.mock.calls[0][0];
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Extrato Mensal');
  });

  it('inclui dados das linhas no HTML gerado', () => {
    const { write } = captureHtml();

    openPrintReport(baseDef);

    const html: string = write.mock.calls[0][0];
    expect(html).toContain('Salario');
    expect(html).toContain('5000.00');
    expect(html).toContain('Aluguel');
    expect(html).toContain('-1500.00');
  });

  it('inclui linha de totais quando showTotals = true', () => {
    const { write } = captureHtml();

    openPrintReport({ ...baseDef, showTotals: true });

    const html: string = write.mock.calls[0][0];
    expect(html).toContain('total-row');
    expect(html).toContain('TOTAL');
    expect(html).toContain('3500.00');
  });

  it('nao inclui linha de totais quando showTotals = false (padrao)', () => {
    const { write } = captureHtml();

    openPrintReport(baseDef);

    const html: string = write.mock.calls[0][0];
    // CSS always references .total-row; check that no <tr> element with that class was rendered
    expect(html).not.toContain('<tr class="total-row">');
  });

  it('inclui cards de summary quando fornecidos', () => {
    const { write } = captureHtml();

    openPrintReport({
      ...baseDef,
      summary: [
        { label: 'Entradas', value: 'R$ 5.000,00', type: 'pos' },
        { label: 'Saidas', value: 'R$ 1.500,00', type: 'neg' },
      ],
    });

    const html: string = write.mock.calls[0][0];
    expect(html).toContain('Entradas');
    expect(html).toContain('R$ 5.000,00');
    expect(html).toContain('sum-value pos');
    expect(html).toContain('sum-value neg');
  });

  it('inclui barra de filtros quando filtros sao fornecidos', () => {
    const { write } = captureHtml();

    openPrintReport({
      ...baseDef,
      filters: [['Periodo:', 'Jan/2026'], ['Status:', 'Ativo']],
    });

    const html: string = write.mock.calls[0][0];
    expect(html).toContain('filters-bar');
    expect(html).toContain('Periodo:');
    expect(html).toContain('Jan/2026');
  });

  it('inclui periodo no subtitulo do cabecalho quando filtro "Periodo:" esta presente', () => {
    const { write } = captureHtml();

    openPrintReport({ ...baseDef, filters: [['Periodo:', 'Fev/2026']] });

    const html: string = write.mock.calls[0][0];
    expect(html).toContain('Fev/2026');
  });

  it('aplica classe pos/neg e alinhamento right nas celulas de dados', () => {
    const { write } = captureHtml();

    openPrintReport(baseDef);

    const html: string = write.mock.calls[0][0];
    expect(html).toContain('class="right pos"');
    expect(html).toContain('class="right neg"');
  });

  it('escapa caracteres HTML especiais no conteudo das celulas', () => {
    const { write } = captureHtml();

    const specialRows: Row[] = [{ descricao: '<script>alert("xss")</script>', valor: 0, tipo: 'entrada' }];
    openPrintReport({ ...baseDef, rows: specialRows });

    const html: string = write.mock.calls[0][0];
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&quot;xss&quot;');
  });

  it('funciona com lista de linhas vazia', () => {
    const { write } = captureHtml();

    openPrintReport({ ...baseDef, rows: [] });

    const html: string = write.mock.calls[0][0];
    expect(html).toContain('Extrato Mensal');
    expect(html).toContain('0 registro');
  });

  it('usa fallback de blob URL quando window.open retorna null', () => {
    vi.useFakeTimers();
    vi.spyOn(window, 'open').mockReturnValue(null);
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:print');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const click = vi.fn();
    const originalCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreate(tag);
      if (tag === 'a') vi.spyOn(el, 'click').mockImplementation(click);
      return el;
    });

    openPrintReport(baseDef);

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();

    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:print');
    vi.useRealTimers();
  });
});

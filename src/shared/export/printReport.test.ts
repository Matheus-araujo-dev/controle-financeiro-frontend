import { openPrintReport, type PrintColumn, type PrintReportDefinition } from './printReport';
import * as shared from './printReportShared';

vi.mock('./printReportShared', async () => {
  const actual = await vi.importActual<typeof import('./printReportShared')>('./printReportShared');
  return { ...actual, openInWindow: vi.fn() };
});

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

function captureHtml(): string {
  openPrintReport(baseDef);
  return vi.mocked(shared.openInWindow).mock.calls[0][0];
}

describe('openPrintReport', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.mocked(shared.openInWindow).mockClear();
  });

  it('chama openInWindow com HTML gerado contendo DOCTYPE e titulo', () => {
    const html = captureHtml();
    expect(vi.mocked(shared.openInWindow)).toHaveBeenCalledOnce();
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Extrato Mensal');
  });

  it('inclui dados das linhas no HTML gerado', () => {
    const html = captureHtml();
    expect(html).toContain('Salario');
    expect(html).toContain('5000.00');
    expect(html).toContain('Aluguel');
    expect(html).toContain('-1500.00');
  });

  it('inclui linha de totais quando showTotals = true', () => {
    openPrintReport({ ...baseDef, showTotals: true });
    const html: string = vi.mocked(shared.openInWindow).mock.calls[0][0];
    expect(html).toContain('total-row');
    expect(html).toContain('TOTAL');
    expect(html).toContain('3500.00');
  });

  it('nao inclui linha de totais quando showTotals = false (padrao)', () => {
    const html = captureHtml();
    expect(html).not.toContain('<tr class="total-row">');
  });

  it('inclui cards de summary quando fornecidos', () => {
    openPrintReport({
      ...baseDef,
      summary: [
        { label: 'Entradas', value: 'R$ 5.000,00', type: 'pos' },
        { label: 'Saidas', value: 'R$ 1.500,00', type: 'neg' },
      ],
    });
    const html: string = vi.mocked(shared.openInWindow).mock.calls[0][0];
    expect(html).toContain('Entradas');
    expect(html).toContain('R$ 5.000,00');
    expect(html).toContain('sum-value pos');
    expect(html).toContain('sum-value neg');
  });

  it('inclui barra de filtros quando filtros sao fornecidos', () => {
    openPrintReport({
      ...baseDef,
      filters: [['Periodo:', 'Jan/2026'], ['Status:', 'Ativo']],
    });
    const html: string = vi.mocked(shared.openInWindow).mock.calls[0][0];
    expect(html).toContain('filters-bar');
    expect(html).toContain('Periodo:');
    expect(html).toContain('Jan/2026');
  });

  it('inclui periodo no subtitulo do cabecalho quando filtro "Periodo:" esta presente', () => {
    openPrintReport({ ...baseDef, filters: [['Periodo:', 'Fev/2026']] });
    const html: string = vi.mocked(shared.openInWindow).mock.calls[0][0];
    expect(html).toContain('Fev/2026');
  });

  it('aplica classe pos/neg e alinhamento right nas celulas de dados', () => {
    const html = captureHtml();
    expect(html).toContain('class="right pos"');
    expect(html).toContain('class="right neg"');
  });

  it('escapa caracteres HTML especiais no conteudo das celulas', () => {
    const specialRows: Row[] = [{ descricao: '<script>alert("xss")</script>', valor: 0, tipo: 'entrada' }];
    openPrintReport({ ...baseDef, rows: specialRows });
    const html: string = vi.mocked(shared.openInWindow).mock.calls[0][0];
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&quot;xss&quot;');
  });

  it('agrupa linhas por data com cabecalho de grupo e saldo do dia', () => {
    type DateRow = { descricao: string; valor: number; tipo: 'entrada' | 'saida'; data: string };
    const dateRows: DateRow[] = [
      { descricao: 'Salario', valor: 5000, tipo: 'entrada', data: '2026-07-24' },
      { descricao: 'Aluguel', valor: 1500, tipo: 'saida', data: '2026-07-24' },
      { descricao: 'Netflix', valor: 55.9, tipo: 'saida', data: '2026-07-23' },
    ];
    const cols: PrintColumn<DateRow>[] = [
      { header: 'Data', value: (r) => r.data },
      { header: 'Descricao', value: (r) => r.descricao },
      { header: 'Valor (R$)', value: (r) => r.valor.toFixed(2), align: 'right' },
    ];
    openPrintReport({
      title: 'Extrato',
      columns: cols,
      rows: dateRows,
      groupByDate: true,
      dateValue: (r) => r.data,
      signedValue: (r) => r.tipo === 'entrada' ? r.valor : -r.valor,
    });
    const html: string = vi.mocked(shared.openInWindow).mock.calls[0][0];
    expect(html).toContain('date-group-header');
    expect(html).toContain('dg-date');
    expect(html).toContain('24 jul');
    expect(html).toContain('23 jul');
    const saldo24 = 5000 - 1500;
    expect(html).toContain(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldo24));
  });

  it('funciona com lista de linhas vazia', () => {
    openPrintReport({ ...baseDef, rows: [] });
    const html: string = vi.mocked(shared.openInWindow).mock.calls[0][0];
    expect(html).toContain('Extrato Mensal');
    expect(html).toContain('0 registro');
  });

  it('passa win como segundo argumento para openInWindow quando fornecido', () => {
    const fakeWin = { document: { write: vi.fn(), close: vi.fn() } } as unknown as Window;
    openPrintReport(baseDef, fakeWin);
    expect(vi.mocked(shared.openInWindow)).toHaveBeenCalledWith(expect.any(String), fakeWin);
  });
});

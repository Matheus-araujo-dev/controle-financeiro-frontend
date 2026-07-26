import { printDashboard } from './printDashboard';
import type { DashboardPrintData } from './printDashboard';
import * as shared from './printReportShared';

vi.mock('./printReportShared', () => ({
  esc: (s: unknown) => String(s ?? ''),
  fmtCurrency: (v: number) => v.toFixed(2),
  buildNowString: () => '25/07/2026 12:00',
  openInWindow: vi.fn(),
}));

const BASE: DashboardPrintData = {
  referenceMonth: '2026-07',
  saldoAtual: 1000,
  totalAPagar: 500,
  totalAReceber: 200,
  saldoProjetado: 700,
  receitas: 3000,
  despesas: 2000,
  resultadoMes: 1000,
  contas: [{ nome: 'Nubank', banco: 'Nubank', saldoAtual: 1000 }],
  agenda: [{
    descricao: 'Aluguel',
    pessoaNome: 'Imob',
    dataVencimento: '2026-07-28',
    valor: 1500,
    tipoLancamento: 'ContaPagar',
  }],
  movimentacoes: [{
    dataMovimentacao: '2026-07-24',
    observacaoResumida: 'Supermercado',
    natureza: 'Alimentação',
    tipo: 'Saida',
    valor: 200,
  }],
  despesasCategorias: [
    { descricao: 'Alimentação', valorTotal: 1500, meta: 1000 },
    { descricao: 'Transporte', valorTotal: 500, meta: null },
  ],
};

function captureHtml() {
  return vi.mocked(shared.openInWindow).mock.calls[0][0] as string;
}

describe('printDashboard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls openInWindow with generated HTML and the win reference', () => {
    const win = {} as Window;
    printDashboard(BASE, win);
    expect(shared.openInWindow).toHaveBeenCalledWith(expect.stringContaining('Dashboard Financeiro'), win);
  });

  it('positive saldoAtual → pos class', () => {
    printDashboard(BASE, null);
    expect(captureHtml()).toContain('kpi-value pos');
  });

  it('negative saldoAtual → neg class', () => {
    printDashboard({ ...BASE, saldoAtual: -100 }, null);
    expect(captureHtml()).toContain('kpi-value neg');
  });

  it('negative saldoProjetado → warn class', () => {
    printDashboard({ ...BASE, saldoProjetado: -1 }, null);
    expect(captureHtml()).toContain('kpi-value warn');
  });

  it('zero receitas+despesas → 50% bar fallback', () => {
    printDashboard({ ...BASE, receitas: 0, despesas: 0 }, null);
    expect(captureHtml()).toContain('width:50%');
  });

  it('negative resultadoMes → neg class', () => {
    printDashboard({ ...BASE, resultadoMes: -500 }, null);
    expect(captureHtml()).toContain('res-value neg');
  });

  it('positive resultadoMes → pos class', () => {
    printDashboard({ ...BASE, resultadoMes: 100 }, null);
    expect(captureHtml()).toContain('res-value pos');
  });

  it('negative conta saldo → neg class in row', () => {
    printDashboard({ ...BASE, contas: [{ nome: 'X', banco: 'B', saldoAtual: -50 }] }, null);
    expect(captureHtml()).toContain('r neg');
  });

  it('categoria with meta over 100% → bar-over', () => {
    printDashboard({ ...BASE, despesasCategorias: [{ descricao: 'Alim', valorTotal: 1500, meta: 1000 }] }, null);
    expect(captureHtml()).toContain('bar-over');
  });

  it('categoria with meta 80-100% → bar-warn', () => {
    printDashboard({ ...BASE, despesasCategorias: [{ descricao: 'Alim', valorTotal: 850, meta: 1000 }] }, null);
    expect(captureHtml()).toContain('bar-warn');
  });

  it('categoria with meta <80% → bar-ok', () => {
    printDashboard({ ...BASE, despesasCategorias: [{ descricao: 'Alim', valorTotal: 500, meta: 1000 }] }, null);
    expect(captureHtml()).toContain('bar-ok');
  });

  it('categoria with null meta → no bar element', () => {
    printDashboard({ ...BASE, despesasCategorias: [{ descricao: 'Alim', valorTotal: 500, meta: null }] }, null);
    expect(captureHtml()).not.toContain('<div class="bar-wrap"');
  });

  it('empty agenda → agenda section omitted', () => {
    printDashboard({ ...BASE, agenda: [] }, null);
    expect(captureHtml()).not.toContain('Próximos Vencimentos');
  });

  it('agenda ContaReceber → receber badge and pos value', () => {
    printDashboard({
      ...BASE,
      agenda: [{ descricao: 'Salário', pessoaNome: 'Emp', dataVencimento: '2026-08-01', valor: 5000, tipoLancamento: 'ContaReceber' }],
    }, null);
    const html = captureHtml();
    expect(html).toContain('tipo-receber');
    expect(html).toContain('pos');
  });

  it('empty movimentacoes → movs section omitted', () => {
    printDashboard({ ...BASE, movimentacoes: [] }, null);
    expect(captureHtml()).not.toContain('Lançamentos Recentes');
  });

  it('movimentacao Entrada → entrada badge and + prefix', () => {
    printDashboard({
      ...BASE,
      movimentacoes: [{ dataMovimentacao: '2026-07-01', observacaoResumida: null, natureza: 'Transf', tipo: 'Entrada', valor: 100 }],
    }, null);
    const html = captureHtml();
    expect(html).toContain('tipo-entrada');
    expect(html).toContain('+');
  });

  it('movimentacao null observacaoResumida → em dash placeholder', () => {
    printDashboard({
      ...BASE,
      movimentacoes: [{ dataMovimentacao: '2026-07-01', observacaoResumida: null, natureza: 'Transf', tipo: 'Saida', valor: 50 }],
    }, null);
    expect(captureHtml()).toContain('—');
  });

  it('formats referenceMonth correctly in header', () => {
    printDashboard({ ...BASE, referenceMonth: '2026-01' }, null);
    expect(captureHtml()).toContain('janeiro de 2026');
  });
});

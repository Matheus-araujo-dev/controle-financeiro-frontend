import { buildMobilePrintHtml, openMobilePrintReport, type MobilePrintDefinition } from './printReportMobile';

type Row = { date: string; desc: string; account: string; value: number };

const rows: Row[] = [
  { date: '2026-07-25', desc: 'Conta de luz', account: 'Nubank', value: -130 },
  { date: '2026-07-24', desc: 'Salário julho', account: 'Inter PF', value: 3500 },
  { date: '2026-07-24', desc: 'Supermercado', account: 'Bradesco', value: -287.5 },
];

const baseDef: MobilePrintDefinition<Row> = {
  title: 'Extrato de Movimentações',
  rows,
  dateValue: (r) => r.date,
  descriptionValue: (r) => r.desc,
  subtitleValue: (r) => r.account,
  signedValue: (r) => r.value,
};


describe('buildMobilePrintHtml', () => {
  it('contém o título no HTML gerado', () => {
    const html = buildMobilePrintHtml(baseDef);
    expect(html).toContain('Extrato de Movimentações');
  });

  it('agrupa linhas por data e mostra cabeçalho de data', () => {
    const html = buildMobilePrintHtml(baseDef);
    expect(html).toContain('25 jul');
    expect(html).toContain('24 jul');
  });

  it('mostra descrição e conta de cada lançamento', () => {
    const html = buildMobilePrintHtml(baseDef);
    expect(html).toContain('Conta de luz');
    expect(html).toContain('Nubank');
    expect(html).toContain('Salário julho');
    expect(html).toContain('Inter PF');
  });

  it('aplica classe pos para valores positivos e neg para negativos', () => {
    const html = buildMobilePrintHtml(baseDef);
    const posCount = (html.match(/class="tx-dot pos"/g) ?? []).length;
    const negCount = (html.match(/class="tx-dot neg"/g) ?? []).length;
    expect(posCount).toBe(1);
    expect(negCount).toBe(2);
  });

  it('calcula saldo diário correto para dia com múltiplos lançamentos', () => {
    const html = buildMobilePrintHtml(baseDef);
    const saldoDia = 3500 - 287.5;
    expect(html).toContain(
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldoDia)
    );
  });

  it('escapa caracteres HTML especiais em descrições', () => {
    const defXss: MobilePrintDefinition<{ date: string; desc: string; value: number }> = {
      title: 'Teste',
      rows: [{ date: '2026-07-01', desc: '<script>alert(1)</script>', value: 10 }],
      dateValue: (r) => r.date,
      descriptionValue: (r) => r.desc,
      signedValue: (r) => r.value,
    };
    const html = buildMobilePrintHtml(defXss);
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('inclui bloco de filtros quando fornecidos', () => {
    const def: MobilePrintDefinition<Row> = {
      ...baseDef,
      filters: [['Período:', '01/07/2026 – 31/07/2026']],
    };
    const html = buildMobilePrintHtml(def);
    expect(html).toContain('Período:');
    expect(html).toContain('01/07/2026');
  });

  it('inclui cards de resumo quando fornecidos', () => {
    const def: MobilePrintDefinition<Row> = {
      ...baseDef,
      summary: [
        { label: 'Entradas', value: 'R$ 3.500,00', type: 'pos' },
        { label: 'Saídas', value: 'R$ 417,50', type: 'neg' },
      ],
    };
    const html = buildMobilePrintHtml(def);
    expect(html).toContain('Entradas');
    expect(html).toContain('Saídas');
  });

  it('não inclui bloco de resumo quando não fornecido', () => {
    const html = buildMobilePrintHtml(baseDef);
    expect(html).not.toContain('class="summary"');
  });

  it('usa orientação retrato no @page', () => {
    const html = buildMobilePrintHtml(baseDef);
    expect(html).toContain('size:A4 portrait');
  });

  it('contém contagem de registros no rodapé', () => {
    const html = buildMobilePrintHtml(baseDef);
    expect(html).toContain('3 registros');
  });

  it('usa borda esmeralda #2bf58e no separador de grupo', () => {
    const html = buildMobilePrintHtml(baseDef);
    expect(html).toContain('border-bottom:1.5px solid #2bf58e');
  });

  it('renderiza linha de total com label e valor correto', () => {
    const html = buildMobilePrintHtml(baseDef);
    expect(html).toContain('<div class="total-row">');
    expect(html).toContain('Total do período');
    const grandTotal = -130 + 3500 + -287.5; // 3082.5
    const fmtGrand = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(grandTotal);
    expect(html).toContain(fmtGrand);
  });

  it('usa classe pos no total quando grandTotal positivo', () => {
    const html = buildMobilePrintHtml(baseDef);
    expect(html).toContain('total-value pos');
  });

  it('usa classe neg no total quando grandTotal negativo', () => {
    const defNeg: MobilePrintDefinition<Row> = {
      ...baseDef,
      rows: [{ date: '2026-07-25', desc: 'Despesa', account: 'Nubank', value: -500 }],
    };
    const html = buildMobilePrintHtml(defNeg);
    expect(html).toContain('total-value neg');
  });

  it('respeita totalLabel personalizado', () => {
    const def: MobilePrintDefinition<Row> = { ...baseDef, totalLabel: 'Resultado do mês' };
    const html = buildMobilePrintHtml(def);
    expect(html).toContain('Resultado do mês');
  });

  it('nao renderiza linha de total quando rows estiver vazio', () => {
    const html = buildMobilePrintHtml({ ...baseDef, rows: [] });
    expect(html).not.toContain('<div class="total-row">');
  });

  it('usa borda esmeralda #2bf58e na linha de total', () => {
    const html = buildMobilePrintHtml(baseDef);
    expect(html).toContain('border-top:2px solid #2bf58e');
  });
});

describe('openMobilePrintReport', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('abre nova janela com blob URL', () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-url');
    vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);
    vi.useFakeTimers();
    const openSpy = vi.spyOn(window, 'open').mockReturnValue({} as Window);

    openMobilePrintReport(baseDef);

    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(openSpy).toHaveBeenCalledWith('blob:fake-url', '_blank', 'noopener,noreferrer');

    vi.useRealTimers();
  });

  it('usa URL de blob como fallback quando window.open retorna null', () => {
    vi.spyOn(window, 'open').mockReturnValue(null);
    const createObjectURL = vi.fn(() => 'blob:fake-url');
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL: vi.fn() });
    const a = { href: '', target: '', rel: '', click: vi.fn(), remove: vi.fn() };
    vi.spyOn(document, 'createElement').mockReturnValue(a as unknown as HTMLElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => a as unknown as Node);

    openMobilePrintReport(baseDef);

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(a.click).toHaveBeenCalledOnce();
  });
});

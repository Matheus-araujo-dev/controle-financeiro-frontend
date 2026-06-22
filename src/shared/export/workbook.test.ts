import { createCsvBlob, createXlsxBlob, downloadBlob, sanitizeSheetName } from './workbook';

async function blobText(blob: Blob) {
  return blob.text();
}

async function blobBytes(blob: Blob) {
  return new Uint8Array(await blob.arrayBuffer());
}

describe('workbook export helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-21T12:34:56Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('sanitizes worksheet names to the Excel-compatible limit', () => {
    expect(sanitizeSheetName('Faturas:Cartao/Junho*2026?[extra longo demais]')).toBe(
      'Faturas Cartao Junho 2026  extr'
    );
    expect(sanitizeSheetName(':/?*[]')).toBe('Relatorio');
  });

  it('creates an xlsx blob with workbook metadata, sheets, cells, columns and merges', async () => {
    const blob = createXlsxBlob({
      title: 'Relatorio & fechamento',
      subject: 'Faturas <cartao>',
      author: 'Financeiro',
      createdAt: new Date('2026-06-20T08:00:00Z'),
      sheets: [
        {
          name: 'Faturas: Junho',
          columnWidths: [2, 120],
          merges: [{ startRow: 0, startColumn: 0, endRow: 0, endColumn: 1 }],
          rows: [
            ['Descricao & valor', 'Pago'],
            ['Mercado', 123.45],
            [new Date('2026-06-19T00:00:00Z'), true],
            ['', null]
          ]
        },
        {
          name: 'Resumo',
          rows: [[undefined, false]]
        }
      ]
    });

    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    const text = await blobText(blob);
    expect(text).toContain('[Content_Types].xml');
    expect(text).toContain('xl/worksheets/sheet1.xml');
    expect(text).toContain('xl/worksheets/sheet2.xml');
    expect(text).toContain('Relatorio &amp; fechamento');
    expect(text).toContain('Faturas &lt;cartao&gt;');
    expect(text).toContain('Faturas  Junho');
    expect(text).toContain('Descricao &amp; valor');
    expect(text).toContain('<c r="B2"><v>123.45</v></c>');
    expect(text).toContain('<c r="B3" t="b"><v>1</v></c>');
    expect(text).toContain('<c r="B1"');
    expect(text).toContain('width="4"');
    expect(text).toContain('width="80"');
    expect(text).toContain('<mergeCell ref="A1:B1"/>');
    expect(text).toContain('<vt:i4>2</vt:i4>');
  });

  it('creates a default empty sheet when no sheets are provided', async () => {
    const blob = createXlsxBlob({ sheets: [] });

    const text = await blobText(blob);
    expect(text).toContain('Dados');
    expect(text).toContain('xl/worksheets/sheet1.xml');
  });

  it('creates a semicolon csv blob with bom and escaped values', async () => {
    const blob = createCsvBlob([
      ['Descricao', 'Valor', 'Observacao'],
      ['Mercado; central', 120.5, 'Pago "com desconto"'],
      [new Date('2026-06-18T00:00:00Z'), null, undefined],
      ['linha\nquebrada', true, false]
    ]);

    expect(blob.type).toBe('text/csv;charset=utf-8');
    const bytes = await blobBytes(blob);
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
    await expect(blobText(blob)).resolves.toBe(
      'Descricao;Valor;Observacao\r\n' +
        '"Mercado; central";120.5;"Pago ""com desconto"""\r\n' +
        '2026-06-18T00:00:00.000Z;;\r\n' +
        '"linha\nquebrada";true;false'
    );
  });

  it('downloads a blob and revokes the temporary object url', () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:export');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const click = vi.fn();
    const appendChild = vi.spyOn(document.body, 'appendChild');
    const originalCreateElement = document.createElement.bind(document);

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName === 'a') {
        vi.spyOn(element, 'click').mockImplementation(click);
      }
      return element;
    });

    const blob = new Blob(['conteudo'], { type: 'text/plain' });
    downloadBlob(blob, 'relatorio.csv');

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(appendChild).toHaveBeenCalled();
    expect(click).toHaveBeenCalledTimes(1);
    expect(document.querySelector('a[download="relatorio.csv"]')).not.toBeInTheDocument();

    vi.runOnlyPendingTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:export');
  });
});

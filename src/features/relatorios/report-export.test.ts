import { buildReportWorkbook, sanitizeReportFilename } from './report-export';

describe('report-export', () => {
  it('builds a workbook with title, filters, rows and column widths', () => {
    const workbook = buildReportWorkbook({
      title: 'Relatorio financeiro',
      filename: 'relatorio-financeiro',
      generatedAt: new Date('2026-06-19T00:00:00Z'),
      sheets: [
        {
          name: 'Inadimplencia',
          title: 'Relatorio de inadimplencia',
          filters: [['Mes de referencia', '2026-06']],
          rows: [
            {
              Descricao: 'Aluguel vencido',
              Pessoa: 'Imobiliaria',
              Valor: 250
            }
          ]
        }
      ]
    });

    expect(workbook.sheets).toHaveLength(1);
    expect(workbook.sheets[0].name).toBe('Inadimplencia');
    expect(workbook.sheets[0].rows[0]).toEqual(['Relatorio de inadimplencia']);
    expect(workbook.sheets[0].rows[1]).toEqual(['Mes de referencia', '2026-06']);
    expect(workbook.sheets[0].rows[3]).toEqual(['Descricao', 'Pessoa', 'Valor']);
    expect(workbook.sheets[0].rows[4]).toEqual(['Aluguel vencido', 'Imobiliaria', 250]);
    expect(workbook.sheets[0].columnWidths).toHaveLength(3);
    expect(workbook.sheets[0].merges).toEqual([{ startRow: 0, startColumn: 0, endRow: 0, endColumn: 2 }]);
  });

  it('sanitizes report filenames for downloads', () => {
    expect(sanitizeReportFilename('Relatorio de Inadimplencia 06/2026')).toBe('relatorio-de-inadimplencia-06-2026');
  });
});

import { createXlsxBlob, downloadBlob, STYLE, type AnyCell, type WorkbookCell, type StyledCell } from './workbook';

export type RichColumn<T> = {
  header: string;
  value: (row: T) => WorkbookCell;
  /** Per-cell style index or function returning one. Defaults to DATA_TEXT. */
  cellStyle?: number | ((row: T) => number);
  /** Aggregated value for the totals row. Omit to show blank. */
  totalValue?: (rows: T[]) => WorkbookCell;
  /** Style for the totals cell. Defaults to TOTAL_CURRENCY for numeric totals, TOTAL_LABEL otherwise. */
  totalStyle?: number;
  /** Column width in characters. */
  width?: number;
};

export type RichExportDefinition<T> = {
  title: string;
  filename: string;
  sheetName?: string;
  /** Pairs of [label, value] shown as metadata rows below the title. */
  filters?: Array<[string, string]>;
  columns: RichColumn<T>[];
  rows: T[];
  /** Whether to append a totals row after the data. Default false. */
  showTotals?: boolean;
};

function sc(value: WorkbookCell, style: number): StyledCell {
  return { v: value, s: style };
}

function sanitizeFilename(name: string) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function buildRichWorkbook<T>(def: RichExportDefinition<T>) {
  const { title, filters = [], columns, rows, sheetName, showTotals = false } = def;
  const numCols = columns.length;
  const sheetRows: AnyCell[][] = [];

  // Title row (merged): only first cell carries the style; continuation cells are blank
  sheetRows.push([sc(title, STYLE.TITLE), ...Array<string>(numCols - 1).fill('')]);

  // "Generated at" metadata
  const generatedAt = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  sheetRows.push([sc('Gerado em:', STYLE.META_LABEL), sc(generatedAt, STYLE.META_VALUE)]);

  for (const [label, value] of filters) {
    sheetRows.push([sc(label, STYLE.META_LABEL), sc(value, STYLE.META_VALUE)]);
  }

  // Empty spacer row
  sheetRows.push([]);

  // Column header row
  sheetRows.push(columns.map((col) => sc(col.header, STYLE.COL_HEADER)));

  // Data rows
  for (const row of rows) {
    sheetRows.push(
      columns.map((col) => {
        const value = col.value(row);
        const style =
          typeof col.cellStyle === 'function'
            ? col.cellStyle(row)
            : (col.cellStyle ?? STYLE.DATA_TEXT);
        return style === STYLE.DEFAULT ? value : sc(value, style);
      }),
    );
  }

  // Totals row
  if (showTotals && rows.length > 0) {
    const totalRow: AnyCell[] = columns.map((col, i) => {
      if (i === 0) return sc('TOTAL', STYLE.TOTAL_LABEL);
      if (col.totalValue) {
        const totalVal = col.totalValue(rows);
        return sc(totalVal, col.totalStyle ?? STYLE.TOTAL_CURRENCY);
      }
      return sc('', STYLE.TOTAL_LABEL);
    });
    sheetRows.push(totalRow);
  }

  const merges = [{ startRow: 0, startColumn: 0, endRow: 0, endColumn: numCols - 1 }];
  const columnWidths = columns.map((col) => col.width ?? 18);

  return createXlsxBlob({
    title: def.title,
    subject: 'Exportação de dados financeiros',
    author: 'Controle Financeiro',
    createdAt: new Date(),
    sheets: [{ name: sheetName ?? 'Dados', rows: sheetRows, columnWidths, merges }],
  });
}

export function downloadRichExport<T>(def: RichExportDefinition<T>) {
  const blob = buildRichWorkbook(def);
  const stamp = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `${sanitizeFilename(def.filename)}-${stamp}.xlsx`);
}

import {
  createXlsxBlob,
  downloadBlob,
  sanitizeSheetName,
  type WorkbookDefinition,
  type WorkbookSheet
} from '../../shared/export/workbook';

export type ReportCell = string | number | boolean | null | undefined;

export type ReportSheet = {
  name: string;
  title: string;
  subtitle?: string;
  filters?: Array<[string, ReportCell]>;
  rows: Array<Record<string, ReportCell>>;
  columns?: string[];
};

export type ReportWorkbookDefinition = {
  title: string;
  filename: string;
  generatedAt?: Date;
  sheets: ReportSheet[];
};

export function sanitizeReportFilename(filename: string) {
  return filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function resolveColumns(sheet: ReportSheet) {
  if (sheet.columns?.length) {
    return sheet.columns;
  }

  return Array.from(new Set(sheet.rows.flatMap((row) => Object.keys(row))));
}

function normalizeCell(value: ReportCell) {
  return value ?? '';
}

function buildColumnWidths(columns: string[], rows: Array<Record<string, ReportCell>>) {
  return columns.map((column) => {
    const maxContentLength = rows.reduce((max, row) => {
      const value = normalizeCell(row[column]);
      return Math.max(max, String(value).length);
    }, column.length);

    return Math.min(Math.max(maxContentLength + 4, 14), 42);
  });
}

export function buildReportWorkbook(definition: ReportWorkbookDefinition): WorkbookDefinition {
  const sheets: WorkbookSheet[] = definition.sheets.map((sheet) => {
    const columns = resolveColumns(sheet);
    const rows = [
      [sheet.title],
      ...(sheet.subtitle ? [[sheet.subtitle]] : []),
      ...(sheet.filters?.length ? sheet.filters.map(([label, value]) => [label, normalizeCell(value)]) : []),
      [],
      columns,
      ...sheet.rows.map((row) => columns.map((column) => normalizeCell(row[column])))
    ];

    return {
      name: sanitizeSheetName(sheet.name),
      rows,
      columnWidths: buildColumnWidths(columns, sheet.rows),
      merges: [{ startRow: 0, startColumn: 0, endRow: 0, endColumn: Math.max(columns.length - 1, 0) }]
    };
  });

  return {
    title: definition.title,
    subject: 'Relatorio financeiro',
    author: 'Controle Financeiro',
    createdAt: definition.generatedAt ?? new Date(),
    sheets
  };
}

export function downloadReportWorkbook(definition: ReportWorkbookDefinition) {
  const workbook = buildReportWorkbook(definition);
  downloadBlob(createXlsxBlob(workbook), `${sanitizeReportFilename(definition.filename)}.xlsx`);
}

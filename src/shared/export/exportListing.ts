import { createCsvBlob, createXlsxBlob, downloadBlob, type WorkbookCell } from './workbook';

/**
 * Página de resultados paginados — estrutural para servir tanto PagedResult quanto PagedCadastro.
 */
export type PagedLike<T> = {
  items: T[];
  totalItems: number;
  totalPages: number;
};

export type PageQuery = {
  page: number;
  pageSize: number;
};

/** Definição de uma coluna exportável: cabeçalho + extrator de valor da linha. */
export type ExportColumn<T> = {
  header: string;
  value: (row: T) => string | number | boolean | null | undefined;
};

export type ExportFormat = 'xlsx' | 'csv';

/**
 * Busca TODAS as páginas do dataset aplicando os filtros atuais.
 * Itera a paginação até reunir todos os itens (respeita totalItems/totalPages),
 * com teto de segurança para não travar em datasets gigantes.
 */
export async function fetchAllRows<T, F extends PageQuery>(
  fetchPage: (filters: F) => Promise<PagedLike<T>>,
  filters: F,
  options?: { pageSize?: number; maxRows?: number }
): Promise<T[]> {
  const pageSize = options?.pageSize ?? 200;
  const maxRows = options?.maxRows ?? 50000;
  const rows: T[] = [];
  let page = 1;

  for (;;) {
    const result = await fetchPage({ ...filters, page, pageSize });
    rows.push(...result.items);

    const reachedTotal = rows.length >= result.totalItems;
    const emptyPage = result.items.length === 0;
    const reachedCap = rows.length >= maxRows;
    const reachedLastPage = page >= result.totalPages;

    if (reachedTotal || emptyPage || reachedCap || reachedLastPage) {
      break;
    }

    page += 1;
  }

  return rows.slice(0, maxRows);
}

/** Gera e dispara o download de um arquivo XLSX/CSV a partir das linhas + colunas. */
export function downloadRows<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  filename: string,
  format: ExportFormat = 'xlsx'
): void {
  const table: WorkbookCell[][] = [
    columns.map((column) => column.header),
    ...rows.map((row) => columns.map((column) => column.value(row) ?? ''))
  ];
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === 'csv') {
    downloadBlob(createCsvBlob(table), `${filename}-${stamp}.csv`);
    return;
  }

  downloadBlob(createXlsxBlob({ title: filename, sheets: [{ name: 'Dados', rows: table }] }), `${filename}-${stamp}.xlsx`);
}

/**
 * Exporta a listagem inteira (todas as páginas com os filtros atuais) para XLSX/CSV.
 * Retorna a quantidade de linhas exportadas.
 */
export async function exportListing<T, F extends PageQuery>(args: {
  fetchPage: (filters: F) => Promise<PagedLike<T>>;
  filters: F;
  columns: ExportColumn<T>[];
  filename: string;
  format?: ExportFormat;
  maxRows?: number;
}): Promise<number> {
  const rows = await fetchAllRows(args.fetchPage, args.filters, { maxRows: args.maxRows });
  downloadRows(rows, args.columns, args.filename, args.format ?? 'xlsx');
  return rows.length;
}

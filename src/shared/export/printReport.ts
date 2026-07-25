import {
  type PrintSummaryCard,
  SHARED_CSS,
  buildHeader, buildSummary, buildFiltersBar, buildFooter,
  buildNowString, buildPeriodStr, openInWindow, esc,
  parseDateGroupHeader, fmtCurrency,
} from './printReportShared';

export type { PrintSummaryCard };

export type PrintColumn<T> = {
  header: string;
  value: (row: T) => string;
  /** 'pos' = verde, 'neg' = vermelho */
  cellClass?: (row: T) => string;
  align?: 'left' | 'right';
  totalValue?: (rows: T[]) => string;
};

export type PrintReportDefinition<T> = {
  title: string;
  filters?: Array<[string, string]>;
  summary?: PrintSummaryCard[];
  columns: PrintColumn<T>[];
  rows: T[];
  showTotals?: boolean;
  /** Agrupa linhas por data e exibe saldo do dia no cabeçalho do grupo */
  groupByDate?: boolean;
  dateValue?: (row: T) => string;
  signedValue?: (row: T) => number;
};

function buildPrintHtml<T>(def: PrintReportDefinition<T>): string {
  const { title, filters = [], summary = [], columns, rows, showTotals = false,
          groupByDate = false, dateValue, signedValue } = def;

  const now = buildNowString();
  const periodStr = buildPeriodStr(filters);

  const thHtml = columns.map((col) =>
    `<th class="${col.align === 'right' ? 'right' : ''}">${esc(col.header)}</th>`
  ).join('');

  function renderDataRow(row: T): string {
    return `<tr>${columns.map((col) => {
      const val = col.value(row);
      const cls = [col.align === 'right' ? 'right' : '', col.cellClass?.(row) ?? ''].filter(Boolean).join(' ');
      return `<td${cls ? ` class="${cls}"` : ''}>${esc(val)}</td>`;
    }).join('')}</tr>`;
  }

  let tbodyHtml: string;
  if (groupByDate && dateValue) {
    const groups = new Map<string, { label: string; rows: T[]; daily: number }>();
    for (const row of rows) {
      const iso = dateValue(row);
      if (!groups.has(iso)) groups.set(iso, { label: parseDateGroupHeader(iso), rows: [], daily: 0 });
      const g = groups.get(iso)!;
      g.rows.push(row);
      if (signedValue) g.daily += signedValue(row);
    }
    tbodyHtml = Array.from(groups.values()).map((g) => {
      const dailyClass = g.daily >= 0 ? 'pos' : 'neg';
      const dailyStr = signedValue ? fmtCurrency(g.daily) : '';
      return `<tr class="date-group-header"><td colspan="${columns.length}"><div class="dg-label"><span class="dg-date">${esc(g.label)}</span>${dailyStr ? `<span class="dg-total ${dailyClass}">${esc(dailyStr)}</span>` : ''}</div></td></tr>${g.rows.map(renderDataRow).join('')}`;
    }).join('');
  } else {
    tbodyHtml = rows.map(renderDataRow).join('');
  }

  const totalHtml = showTotals && rows.length > 0
    ? `<tr class="total-row">${columns.map((col, i) => {
        if (i === 0) return `<td><strong>TOTAL</strong></td>`;
        const val = col.totalValue ? col.totalValue(rows) : '';
        return `<td${col.align === 'right' ? ' class="right"' : ''}><strong>${esc(val)}</strong></td>`;
      }).join('')}</tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${esc(title)}</title>
<style>
body{font-family:'Segoe UI',Calibri,Arial,sans-serif;font-size:11pt;color:#1a1a1a;background:#fff}
${SHARED_CSS}
.data-section{padding:0 24px 24px}
table{width:100%;border-collapse:collapse;margin-top:16px;font-size:10pt}
thead th{background:#1f2329;color:#2bf58e;font-weight:700;padding:8px 10px;text-align:left;font-size:9pt;letter-spacing:.02em}
thead th.right{text-align:right}
tbody tr:nth-child(even){background:#f8fafc}
tbody td{padding:6px 10px;border-bottom:1px solid #f1f5f9}
td.right{text-align:right}
td.pos{color:#059669;font-weight:600}
td.neg{color:#dc2626;font-weight:600}
.total-row td{font-weight:700;border-top:2px solid #2bf58e!important;border-bottom:none;padding-top:8px}
.date-group-header td{background:#f1f5f9;padding:4px 10px;border-bottom:0.5px solid #e5e7eb}
.dg-label{display:flex;justify-content:space-between;align-items:baseline}
.dg-date{font-size:8.5pt;font-weight:700;color:#374151;letter-spacing:.01em}
.dg-total{font-size:9pt;font-weight:700}
.dg-total.pos{color:#059669}
.dg-total.neg{color:#dc2626}
@media print{
  .doc-header,.sum-card,thead th,tbody tr:nth-child(even){-webkit-print-color-adjust:exact;print-color-adjust:exact}
  @page{margin:0;size:A4 landscape}
  body{font-size:10pt}
}
</style>
</head>
<body>

${buildHeader(title, now, periodStr)}
${buildSummary(summary)}
${buildFiltersBar(filters)}

<div class="data-section">
  <table>
    <thead><tr>${thHtml}</tr></thead>
    <tbody>${tbodyHtml}${totalHtml}</tbody>
  </table>
</div>

${buildFooter(rows.length)}

<script>window.onload=function(){setTimeout(function(){window.print()},400)}</script>
</body>
</html>`;
}

export function openPrintReport<T>(def: PrintReportDefinition<T>): void {
  openInWindow(buildPrintHtml(def));
}

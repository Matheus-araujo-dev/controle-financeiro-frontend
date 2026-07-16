export type PrintColumn<T> = {
  header: string;
  value: (row: T) => string;
  /** 'pos' = verde, 'neg' = vermelho, '' = padrão */
  cellClass?: (row: T) => string;
  align?: 'left' | 'right';
  totalValue?: (rows: T[]) => string;
};

export type PrintSummaryCard = {
  label: string;
  value: string;
  type?: 'pos' | 'neg' | 'neutral';
};

export type PrintReportDefinition<T> = {
  title: string;
  filters?: Array<[string, string]>;
  summary?: PrintSummaryCard[];
  columns: PrintColumn<T>[];
  rows: T[];
  showTotals?: boolean;
};

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildPrintHtml<T>(def: PrintReportDefinition<T>): string {
  const { title, filters = [], summary = [], columns, rows, showTotals = false } = def;

  const now = new Date().toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const periodFilter = filters.find(([k]) => k === 'Período:');
  const periodStr = periodFilter ? ` &nbsp;·&nbsp; ${esc(periodFilter[1])}` : '';

  const summaryHtml = summary.length > 0
    ? `<div class="summary">${summary.map((s) =>
        `<div class="sum-card">
          <div class="sum-label">${esc(s.label)}</div>
          <div class="sum-value ${s.type ?? ''}">${esc(s.value)}</div>
        </div>`
      ).join('')}</div>`
    : '';

  const filtersHtml = filters.length > 0
    ? `<div class="filters-bar">${filters.map(([k, v]) =>
        `<strong>${esc(k)}</strong> ${esc(v)}`
      ).join(' &nbsp;·&nbsp; ')}</div>`
    : '';

  const thHtml = columns.map((col) =>
    `<th class="${col.align === 'right' ? 'right' : ''}">${esc(col.header)}</th>`
  ).join('');

  const tbodyHtml = rows.map((row) =>
    `<tr>${columns.map((col) => {
      const val = col.value(row);
      const cls = [col.align === 'right' ? 'right' : '', col.cellClass?.(row) ?? ''].filter(Boolean).join(' ');
      return `<td${cls ? ` class="${cls}"` : ''}>${esc(val)}</td>`;
    }).join('')}</tr>`
  ).join('');

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
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Calibri,Arial,sans-serif;font-size:11pt;color:#1a1a1a;background:#fff}

.doc-header{background:#1f2329;padding:14px 24px;display:flex;justify-content:space-between;align-items:center}
.brand{font-size:16pt;font-weight:700;color:#2bf58e;letter-spacing:-.02em}
.brand span{color:#e8eae9}
.doc-meta{text-align:right}
.doc-meta h1{font-size:13pt;font-weight:700;color:#e8eae9}
.doc-meta .sub{font-size:9pt;color:#98a09d;margin-top:3px}

.summary{display:flex;border-bottom:1px solid #e5e7eb}
.sum-card{flex:1;padding:10px 24px;border-right:1px solid #e5e7eb}
.sum-card:last-child{border-right:none}
.sum-label{font-size:8pt;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;font-weight:700}
.sum-value{font-size:14pt;font-weight:700;margin-top:3px}
.sum-value.pos{color:#059669}
.sum-value.neg{color:#dc2626}

.filters-bar{padding:6px 24px;font-size:9pt;color:#6b7280;background:#f8fafc;border-bottom:1px solid #e5e7eb}
.filters-bar strong{color:#374151}

.data-section{padding:0 24px 24px}
table{width:100%;border-collapse:collapse;margin-top:16px;font-size:10pt}
thead th{background:#374151;color:#f9fafb;font-weight:700;padding:8px 10px;text-align:left;font-size:9pt;letter-spacing:.02em}
thead th.right{text-align:right}
tbody tr:nth-child(even){background:#f8fafc}
tbody td{padding:6px 10px;border-bottom:1px solid #f1f5f9}
td.right{text-align:right}
td.pos{color:#059669;font-weight:600}
td.neg{color:#dc2626;font-weight:600}
.total-row td{font-weight:700;border-top:2px solid #2bf58e!important;border-bottom:none;padding-top:8px}

.doc-footer{padding:10px 24px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:8pt;color:#9ca3af;margin-top:auto}

@media print{
  .doc-header,.sum-card,thead th,tbody tr:nth-child(even){-webkit-print-color-adjust:exact;print-color-adjust:exact}
  @page{margin:0;size:A4 landscape}
  body{font-size:10pt}
}
</style>
</head>
<body>

<div class="doc-header">
  <div class="brand">controle<span>financeiro</span></div>
  <div class="doc-meta">
    <h1>${esc(title)}</h1>
    <div class="sub">Gerado em ${esc(now)}${periodStr}</div>
  </div>
</div>

${summaryHtml}
${filtersHtml}

<div class="data-section">
  <table>
    <thead><tr>${thHtml}</tr></thead>
    <tbody>${tbodyHtml}${totalHtml}</tbody>
  </table>
</div>

<div class="doc-footer">
  <span>controle<strong>financeiro</strong>.app</span>
  <span>${rows.length} registro${rows.length !== 1 ? 's' : ''}</span>
</div>

<script>window.onload=function(){setTimeout(function(){window.print()},400)}<\/script>
</body>
</html>`;
}

export function openPrintReport<T>(def: PrintReportDefinition<T>): void {
  const html = buildPrintHtml(def);
  const win = window.open('', '_blank', 'noopener,noreferrer');
  if (win) {
    win.document.write(html);
    win.document.close();
    return;
  }
  // Fallback: blob URL (blocked popups)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

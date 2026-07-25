import { type PrintSummaryCard } from './printReport';

export type MobilePrintDefinition<T> = {
  title: string;
  filters?: Array<[string, string]>;
  summary?: PrintSummaryCard[];
  rows: T[];
  dateValue: (row: T) => string;
  descriptionValue: (row: T) => string;
  subtitleValue?: (row: T) => string;
  signedValue: (row: T) => number;
};

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

function parseDateGroupHeader(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${d} ${MONTHS_PT[m - 1]} · ${DAYS_PT[date.getDay()]}`;
}

export function buildMobilePrintHtml<T>(def: MobilePrintDefinition<T>): string {
  const { title, filters = [], summary = [], rows, dateValue, descriptionValue, subtitleValue, signedValue } = def;

  const groups = new Map<string, { label: string; rows: T[]; daily: number }>();
  for (const row of rows) {
    const iso = dateValue(row);
    if (!groups.has(iso)) {
      groups.set(iso, { label: parseDateGroupHeader(iso), rows: [], daily: 0 });
    }
    const g = groups.get(iso)!;
    g.rows.push(row);
    g.daily += signedValue(row);
  }

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

  const groupsHtml = Array.from(groups.entries()).map(([, g]) => {
    const daily = g.daily;
    const dailyClass = daily >= 0 ? 'pos' : 'neg';
    const rowsHtml = g.rows.map((row) => {
      const val = signedValue(row);
      const valClass = val >= 0 ? 'pos' : 'neg';
      const sub = subtitleValue ? subtitleValue(row) : '';
      return `<div class="tx-row">
        <div class="tx-dot ${valClass}"></div>
        <div class="tx-info">
          <div class="tx-desc">${esc(descriptionValue(row))}</div>
          ${sub ? `<div class="tx-sub">${esc(sub)}</div>` : ''}
        </div>
        <div class="tx-val ${valClass}">${esc(fmtCurrency(val))}</div>
      </div>`;
    }).join('');

    return `<div class="group">
      <div class="group-header">
        <span class="group-date">${esc(g.label)}</span>
        <span class="group-daily ${dailyClass}">${esc(fmtCurrency(daily))}</span>
      </div>
      ${rowsHtml}
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Calibri,Arial,sans-serif;font-size:12pt;color:#1a1a1a;background:#fff}

.doc-header{background:#1f2329;padding:12px 20px;display:flex;justify-content:space-between;align-items:center}
.brand{font-size:15pt;font-weight:700;color:#2bf58e;letter-spacing:-.02em}
.brand span{color:#e8eae9}
.doc-meta{text-align:right}
.doc-meta h1{font-size:12pt;font-weight:700;color:#e8eae9}
.doc-meta .sub{font-size:8.5pt;color:#98a09d;margin-top:2px}

.summary{display:flex;border-bottom:1px solid #e5e7eb}
.sum-card{flex:1;padding:10px 16px;border-right:1px solid #e5e7eb}
.sum-card:last-child{border-right:none}
.sum-label{font-size:7.5pt;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;font-weight:700}
.sum-value{font-size:13pt;font-weight:700;margin-top:2px}
.sum-value.pos{color:#059669}
.sum-value.neg{color:#dc2626}

.filters-bar{padding:5px 20px;font-size:8.5pt;color:#6b7280;background:#f8fafc;border-bottom:1px solid #e5e7eb}
.filters-bar strong{color:#374151}

.content{padding:10px 16px 20px}

.group{margin-bottom:12px}
.group-header{display:flex;justify-content:space-between;align-items:baseline;padding:6px 4px 4px;border-bottom:1.5px solid #1f2329}
.group-date{font-size:9pt;font-weight:700;color:#374151;letter-spacing:.01em}
.group-daily{font-size:9.5pt;font-weight:700}
.group-daily.pos{color:#059669}
.group-daily.neg{color:#dc2626}

.tx-row{display:flex;align-items:center;padding:5px 4px;gap:8px;border-bottom:0.5px solid #f1f5f9}
.tx-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.tx-dot.pos{background:#059669}
.tx-dot.neg{background:#dc2626}
.tx-info{flex:1;min-width:0}
.tx-desc{font-size:10pt;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tx-sub{font-size:8pt;color:#9ca3af;margin-top:1px}
.tx-val{font-size:10.5pt;font-weight:700;flex-shrink:0;white-space:nowrap}
.tx-val.pos{color:#059669}
.tx-val.neg{color:#dc2626}

.doc-footer{padding:8px 16px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:8pt;color:#9ca3af}

@media print{
  .doc-header,.sum-card{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  @page{margin:0;size:A4 portrait}
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

<div class="content">
  ${groupsHtml}
</div>

<div class="doc-footer">
  <span>controle<strong>financeiro</strong>.app</span>
  <span>${rows.length} registro${rows.length !== 1 ? 's' : ''}</span>
</div>

<script>window.onload=function(){setTimeout(function(){window.print()},400)}</script>
</body>
</html>`;
}

export function openMobilePrintReport<T>(def: MobilePrintDefinition<T>): void {
  const html = buildMobilePrintHtml(def);
  const win = window.open('', '_blank', 'noopener,noreferrer');
  if (win) {
    win.document.write(html);
    win.document.close();
    return;
  }
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

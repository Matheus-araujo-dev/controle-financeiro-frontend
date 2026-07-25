import {
  type PrintSummaryCard,
  SHARED_CSS,
  buildHeader, buildSummary, buildFiltersBar, buildFooter,
  buildNowString, buildPeriodStr, openInWindow, esc,
  parseDateGroupHeader, fmtCurrency,
} from './printReportShared';

export type { PrintSummaryCard };

export type MobilePrintDefinition<T> = {
  title: string;
  filters?: Array<[string, string]>;
  summary?: PrintSummaryCard[];
  rows: T[];
  dateValue: (row: T) => string;
  descriptionValue: (row: T) => string;
  subtitleValue?: (row: T) => string;
  signedValue: (row: T) => number;
  /** Label da linha de total no rodapé do conteúdo. Default: 'Total do período' */
  totalLabel?: string;
};

export function buildMobilePrintHtml<T>(def: MobilePrintDefinition<T>): string {
  const {
    title, filters = [], summary = [], rows,
    dateValue, descriptionValue, subtitleValue, signedValue,
    totalLabel = 'Total do período',
  } = def;

  const now = buildNowString();
  const periodStr = buildPeriodStr(filters);

  const groups = new Map<string, { label: string; rows: T[]; daily: number }>();
  let grandTotal = 0;
  for (const row of rows) {
    const iso = dateValue(row);
    if (!groups.has(iso)) {
      groups.set(iso, { label: parseDateGroupHeader(iso), rows: [], daily: 0 });
    }
    const g = groups.get(iso)!;
    g.rows.push(row);
    const val = signedValue(row);
    g.daily += val;
    grandTotal += val;
  }

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

  const totalClass = grandTotal >= 0 ? 'pos' : 'neg';
  const totalRowHtml = rows.length > 0
    ? `<div class="total-row">
        <span class="total-label">${esc(totalLabel)}</span>
        <span class="total-value ${totalClass}">${esc(fmtCurrency(grandTotal))}</span>
      </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>
body{font-family:'Segoe UI',Calibri,Arial,sans-serif;font-size:12pt;color:#1a1a1a;background:#fff}
${SHARED_CSS}
.doc-header{padding:12px 20px}
.doc-meta h1{font-size:12pt}
.doc-meta .sub{font-size:8.5pt}
.sum-card{padding:10px 16px}
.sum-value{font-size:13pt}
.filters-bar{padding:5px 20px;font-size:8.5pt}
.content{padding:10px 16px 20px}
.group{margin-bottom:12px}
.group-header{display:flex;justify-content:space-between;align-items:baseline;padding:6px 4px 4px;border-bottom:1.5px solid #2bf58e}
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
.total-row{display:flex;justify-content:space-between;align-items:baseline;margin-top:12px;padding-top:8px;border-top:2px solid #2bf58e}
.total-label{font-size:9pt;font-weight:700;color:#374151}
.total-value{font-size:11pt;font-weight:700}
.total-value.pos{color:#059669}
.total-value.neg{color:#dc2626}
.doc-footer{padding:8px 16px}
@media print{
  .doc-header,.sum-card{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  @page{margin:0;size:A4 portrait}
}
</style>
</head>
<body>

${buildHeader(title, now, periodStr)}
${buildSummary(summary)}
${buildFiltersBar(filters)}

<div class="content">
  ${groupsHtml}
  ${totalRowHtml}
</div>

${buildFooter(rows.length)}

<script>window.onload=function(){setTimeout(function(){window.print()},400)}</script>
</body>
</html>`;
}

export function openMobilePrintReport<T>(def: MobilePrintDefinition<T>): void {
  openInWindow(buildMobilePrintHtml(def));
}

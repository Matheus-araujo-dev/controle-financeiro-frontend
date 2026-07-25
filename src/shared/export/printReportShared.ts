export type PrintSummaryCard = {
  label: string;
  value: string;
  type?: 'pos' | 'neg' | 'neutral';
};

export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** CSS compartilhado entre web e mobile — header, summary, filters-bar, footer. */
export const SHARED_CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

.doc-header{background:#1f2329;padding:14px 24px;display:flex;justify-content:space-between;align-items:center}
.brand{font-size:16pt;font-weight:700;color:#2bf58e;letter-spacing:-.02em}
.brand span{color:#e8eae9}
.doc-meta{text-align:right}
.doc-meta h1{font-size:13pt;font-weight:700;color:#e8eae9}
.doc-meta .sub{font-size:9pt;color:#98a09d;margin-top:3px}

.summary{display:flex;border-bottom:1px solid #e5e7eb}
.sum-card{flex:1;padding:10px 24px;border-right:1px solid #e5e7eb}
.sum-card:last-child{border-right:none}
.sum-label{font-size:7.5pt;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;font-weight:700}
.sum-value{font-size:14pt;font-weight:700;margin-top:3px}
.sum-value.pos{color:#059669}
.sum-value.neg{color:#dc2626}

.filters-bar{padding:6px 24px;font-size:9pt;color:#6b7280;background:#f8fafc;border-bottom:1px solid #e5e7eb}
.filters-bar strong{color:#374151}

.doc-footer{padding:10px 24px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:8pt;color:#9ca3af;margin-top:auto}
`;

export function buildHeader(title: string, now: string, periodStr: string): string {
  return `<div class="doc-header">
  <div class="brand">controle<span>financeiro</span></div>
  <div class="doc-meta">
    <h1>${esc(title)}</h1>
    <div class="sub">Gerado em ${esc(now)}${periodStr}</div>
  </div>
</div>`;
}

export function buildSummary(summary: PrintSummaryCard[]): string {
  if (summary.length === 0) return '';
  return `<div class="summary">${summary.map((s) =>
    `<div class="sum-card">
      <div class="sum-label">${esc(s.label)}</div>
      <div class="sum-value ${s.type ?? ''}">${esc(s.value)}</div>
    </div>`
  ).join('')}</div>`;
}

export function buildFiltersBar(filters: Array<[string, string]>): string {
  if (filters.length === 0) return '';
  return `<div class="filters-bar">${filters.map(([k, v]) =>
    `<strong>${esc(k)}</strong> ${esc(v)}`
  ).join(' &nbsp;·&nbsp; ')}</div>`;
}

export function buildFooter(rowCount: number): string {
  return `<div class="doc-footer">
  <span>controle<strong>financeiro</strong>.app</span>
  <span>${rowCount} registro${rowCount !== 1 ? 's' : ''}</span>
</div>`;
}

export function buildNowString(): string {
  return new Date().toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function buildPeriodStr(filters: Array<[string, string]>): string {
  const periodFilter = filters.find(([k]) => k === 'Período:');
  return periodFilter ? ` &nbsp;·&nbsp; ${esc(periodFilter[1])}` : '';
}

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function parseDateGroupHeader(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${d} ${MONTHS_PT[m - 1]} · ${DAYS_PT[date.getDay()]}`;
}

export function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}


export function openInWindow(html: string): void {
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

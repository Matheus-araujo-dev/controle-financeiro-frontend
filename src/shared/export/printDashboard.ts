import { esc, fmtCurrency, buildNowString, openInWindow } from './printReportShared';

export interface DashboardPrintData {
  referenceMonth: string;
  saldoAtual: number;
  totalAPagar: number;
  totalAReceber: number;
  saldoProjetado: number;
  receitas: number;
  despesas: number;
  resultadoMes: number;
  contas: Array<{ nome: string; banco: string; saldoAtual: number }>;
  agenda: Array<{
    descricao: string;
    pessoaNome: string;
    dataVencimento: string;
    valor: number;
    tipoLancamento: 'ContaPagar' | 'ContaReceber';
  }>;
  movimentacoes: Array<{
    dataMovimentacao: string;
    observacaoResumida: string | null;
    natureza: string;
    tipo: 'Entrada' | 'Saida';
    valor: number;
  }>;
  despesasCategorias: Array<{
    descricao: string;
    valorTotal: number;
    meta: number | null;
  }>;
}

const MONTHS_LONG = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

function formatRefMonth(yyyyMM: string): string {
  const [y, m] = yyyyMM.split('-').map(Number);
  return `${MONTHS_LONG[m - 1]} de ${y}`;
}

function fmtDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
@page{size:A4 portrait;margin:14mm 12mm}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:9pt;color:#111827;background:#fff}

.doc-header{background:#1f2329;padding:14px 20px;display:flex;justify-content:space-between;align-items:center}
.brand{font-size:15pt;font-weight:700;color:#2bf58e;letter-spacing:-.02em}
.brand span{color:#e8eae9}
.doc-meta{text-align:right}
.doc-meta h1{font-size:12pt;font-weight:700;color:#e8eae9}
.doc-meta .sub{font-size:8pt;color:#98a09d;margin-top:3px}

.body{padding:14px 0 0}

.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px}
.kpi-card{border:1px solid #e5e7eb;border-radius:8px;padding:9px 12px}
.kpi-label{font-size:6.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;margin-bottom:4px}
.kpi-value{font-size:13pt;font-weight:800;line-height:1.1}
.kpi-value.pos{color:#059669}
.kpi-value.neg{color:#dc2626}
.kpi-value.neutral{color:#1f2329}
.kpi-value.warn{color:#d97706}

.res-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}
.res-card{border:1px solid #e5e7eb;border-radius:8px;padding:9px 12px}
.res-label{font-size:6.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;margin-bottom:4px}
.res-value{font-size:14pt;font-weight:800;line-height:1.1}
.res-value.pos{color:#059669}
.res-value.neg{color:#dc2626}
.res-bar{display:flex;height:5px;border-radius:4px;overflow:hidden;margin-top:6px;background:#f3f4f6}
.res-bar-pos{background:#059669}
.res-bar-neg{background:#dc2626}

.two-col{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}
.section{margin-bottom:14px}
.sec-title{font-size:7.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#374151;border-bottom:1.5px solid #1f2329;padding-bottom:4px;margin-bottom:8px}

table{width:100%;border-collapse:collapse}
th{background:#1f2329;color:#e8eae9;padding:5px 8px;text-align:left;font-size:7pt;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
th.r{text-align:right}
td{padding:5px 8px;border-bottom:.5px solid #f3f4f6;font-size:8.5pt;vertical-align:middle}
tr:last-child td{border-bottom:none}
tr:nth-child(even) td{background:#f9fafb}
.r{text-align:right}
.pos{color:#059669;font-weight:700}
.neg{color:#dc2626;font-weight:700}
.muted{color:#6b7280}
.tipo-badge{display:inline-block;padding:1px 5px;border-radius:4px;font-size:7pt;font-weight:700;text-transform:uppercase}
.tipo-pagar{background:#fee2e2;color:#dc2626}
.tipo-receber{background:#d1fae5;color:#059669}
.tipo-saida{background:#fee2e2;color:#dc2626}
.tipo-entrada{background:#d1fae5;color:#059669}

.bar-wrap{background:#e5e7eb;border-radius:3px;height:5px;margin-top:3px;overflow:hidden}
.bar-ok{background:#059669}
.bar-warn{background:#d97706}
.bar-over{background:#dc2626}

.doc-footer{margin-top:16px;padding-top:8px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:7pt;color:#9ca3af}
`;

function kpiCard(label: string, value: number, cls: 'pos' | 'neg' | 'neutral' | 'warn'): string {
  return `<div class="kpi-card">
    <div class="kpi-label">${esc(label)}</div>
    <div class="kpi-value ${cls}">${esc(fmtCurrency(value))}</div>
  </div>`;
}

function buildKpis(d: DashboardPrintData): string {
  return `<div class="kpi-grid">
    ${kpiCard('Saldo Atual', d.saldoAtual, d.saldoAtual >= 0 ? 'pos' : 'neg')}
    ${kpiCard('A Pagar', d.totalAPagar, 'neg')}
    ${kpiCard('A Receber', d.totalAReceber, 'pos')}
    ${kpiCard('Projetado (Fim de Mês)', d.saldoProjetado, d.saldoProjetado >= 0 ? 'pos' : 'warn')}
  </div>`;
}

function buildResultado(d: DashboardPrintData): string {
  const total = d.receitas + d.despesas;
  const pctR = total > 0 ? (d.receitas / total) * 100 : 50;
  const pctD = 100 - pctR;
  return `<div class="res-grid">
    <div class="res-card">
      <div class="res-label">Receitas</div>
      <div class="res-value pos">${esc(fmtCurrency(d.receitas))}</div>
      <div class="res-bar"><div class="res-bar-pos" style="width:${pctR.toFixed(0)}%"></div></div>
    </div>
    <div class="res-card">
      <div class="res-label">Despesas</div>
      <div class="res-value neg">${esc(fmtCurrency(d.despesas))}</div>
      <div class="res-bar"><div class="res-bar-neg" style="width:${pctD.toFixed(0)}%"></div></div>
    </div>
    <div class="res-card">
      <div class="res-label">Resultado do Mês</div>
      <div class="res-value ${d.resultadoMes >= 0 ? 'pos' : 'neg'}">${esc(fmtCurrency(d.resultadoMes))}</div>
    </div>
  </div>`;
}

function buildContas(contas: DashboardPrintData['contas']): string {
  const ativas = [...contas].sort((a, b) => b.saldoAtual - a.saldoAtual);
  const total = ativas.reduce((s, c) => s + c.saldoAtual, 0);
  const rows = ativas.map((c) =>
    `<tr>
      <td>${esc(c.nome)}</td>
      <td class="muted">${esc(c.banco)}</td>
      <td class="r ${c.saldoAtual >= 0 ? 'pos' : 'neg'}">${esc(fmtCurrency(c.saldoAtual))}</td>
    </tr>`
  ).join('');
  return `<div class="section">
    <div class="sec-title">Saldo por Conta</div>
    <table>
      <thead><tr><th>Conta</th><th>Banco</th><th class="r">Saldo</th></tr></thead>
      <tbody>
        ${rows}
        <tr style="font-weight:700;background:#f9fafb">
          <td colspan="2" style="font-weight:700">Total</td>
          <td class="r ${total >= 0 ? 'pos' : 'neg'}">${esc(fmtCurrency(total))}</td>
        </tr>
      </tbody>
    </table>
  </div>`;
}

function buildCategorias(categorias: DashboardPrintData['despesasCategorias']): string {
  const sorted = [...categorias].sort((a, b) => b.valorTotal - a.valorTotal);
  const rows = sorted.map((c) => {
    const pct = c.meta ? (c.valorTotal / c.meta) * 100 : null;
    const barClass = pct === null ? '' : pct > 100 ? 'bar-over' : pct >= 80 ? 'bar-warn' : 'bar-ok';
    const pctStr = pct !== null ? `<div class="bar-wrap"><div class="${barClass}" style="width:${Math.min(pct, 100).toFixed(0)}%"></div></div>` : '';
    const metaStr = c.meta !== null ? `<span class="muted"> / ${esc(fmtCurrency(c.meta))}</span>` : '';
    return `<tr>
      <td>${esc(c.descricao)}</td>
      <td class="r"><span class="neg">${esc(fmtCurrency(c.valorTotal))}</span>${metaStr}${pctStr}</td>
    </tr>`;
  }).join('');
  return `<div class="section">
    <div class="sec-title">Despesas por Categoria</div>
    <table>
      <thead><tr><th>Categoria</th><th class="r">Realizado / Meta</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function buildAgenda(agenda: DashboardPrintData['agenda']): string {
  if (agenda.length === 0) return '';
  const rows = agenda.map((a) => {
    const badge = a.tipoLancamento === 'ContaPagar'
      ? `<span class="tipo-badge tipo-pagar">Pagar</span>`
      : `<span class="tipo-badge tipo-receber">Receber</span>`;
    const valClass = a.tipoLancamento === 'ContaPagar' ? 'neg' : 'pos';
    return `<tr>
      <td>${esc(fmtDate(a.dataVencimento))}</td>
      <td>${esc(a.descricao)}</td>
      <td class="muted">${esc(a.pessoaNome)}</td>
      <td>${badge}</td>
      <td class="r ${valClass}">${esc(fmtCurrency(a.valor))}</td>
    </tr>`;
  }).join('');
  return `<div class="section">
    <div class="sec-title">Agenda — Próximos Vencimentos (${agenda.length})</div>
    <table>
      <thead><tr><th>Data</th><th>Descrição</th><th>Pessoa</th><th>Tipo</th><th class="r">Valor</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function buildMovimentacoes(movs: DashboardPrintData['movimentacoes']): string {
  if (movs.length === 0) return '';
  const rows = movs.map((m) => {
    const badge = m.tipo === 'Entrada'
      ? `<span class="tipo-badge tipo-entrada">Entrada</span>`
      : `<span class="tipo-badge tipo-saida">Saída</span>`;
    const valClass = m.tipo === 'Entrada' ? 'pos' : 'neg';
    const prefix = m.tipo === 'Entrada' ? '+' : '−';
    return `<tr>
      <td>${esc(fmtDate(m.dataMovimentacao))}</td>
      <td>${esc(m.observacaoResumida ?? '—')}</td>
      <td class="muted">${esc(m.natureza)}</td>
      <td>${badge}</td>
      <td class="r ${valClass}">${prefix} ${esc(fmtCurrency(m.valor))}</td>
    </tr>`;
  }).join('');
  return `<div class="section">
    <div class="sec-title">Lançamentos Recentes (${movs.length})</div>
    <table>
      <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Tipo</th><th class="r">Valor</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function buildDashboardHtml(d: DashboardPrintData): string {
  const now = buildNowString();
  const monthLabel = formatRefMonth(d.referenceMonth);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Dashboard — ${esc(monthLabel)}</title>
<style>${CSS}</style>
</head>
<body>
<div class="doc-header">
  <div class="brand">controle<span>financeiro</span></div>
  <div class="doc-meta">
    <h1>Dashboard Financeiro</h1>
    <div class="sub">${esc(monthLabel)} &nbsp;·&nbsp; Gerado em ${esc(now)}</div>
  </div>
</div>
<div class="body">
  ${buildKpis(d)}
  ${buildResultado(d)}
  <div class="two-col">
    ${buildContas(d.contas)}
    ${buildCategorias(d.despesasCategorias)}
  </div>
  ${buildAgenda(d.agenda)}
  ${buildMovimentacoes(d.movimentacoes)}
  <div class="doc-footer">
    <span>controle<strong>financeiro</strong>.app</span>
    <span>Dashboard · ${esc(monthLabel)}</span>
  </div>
</div>
</body>
</html>`;
}

export function printDashboard(data: DashboardPrintData, win?: Window | null): void {
  openInWindow(buildDashboardHtml(data), win);
}

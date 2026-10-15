export type ColumnLayout = 'text' | 'date' | 'money' | 'number' | 'compact' | 'status' | 'actions';
type Column = { key?: string; dataIndex?: string | number | readonly (string | number)[]; title?: unknown; width?: number | string; layout?: ColumnLayout; mobileRole?: string };
const minimums: Record<ColumnLayout, number> = { text: 140, compact: 140, date: 132, money: 148, number: 104, status: 128, actions: 104 };
const widths: Partial<Record<ColumnLayout, string>> = { compact: 'clamp(140px, 10cqi, 200px)', date: 'clamp(132px, 8cqi, 156px)', money: 'clamp(148px, 10cqi, 184px)', number: '104px', status: '128px', actions: '104px' };
export function resolveColumnLayout(column: Column) {
  const key = String(column.key ?? column.dataIndex ?? '').toLowerCase();
  const role: ColumnLayout = column.layout ?? (
    ['acoes', 'actions'].includes(key) ? 'actions' :
    column.mobileRole === 'value' || /^(valor|saldo|limite|receitas$|despesas$|entradas|saidas|total(receita|despesa|pagar|receber))/.test(key) ? 'money' :
    column.mobileRole === 'date' || /^(data|vencimento|fechamento|competencia|inicio$|fim$|mes$)/.test(key) ? 'date' :
    column.mobileRole === 'status' || /^(status|ativo|situacao)/.test(key) ? 'status' :
    /^(formapagamento|tipo|bandeira)/.test(key) ? 'compact' :
    /^(quantidade|numero(parcela|itens)|parcela|percentual|dias|itens$|dia$)/.test(key) ? 'number' : 'text');
  return { role, width: typeof column.width === 'number' ? `${column.width}px` : column.width ?? widths[role], minimum: typeof column.width === 'number' ? column.width : minimums[role] };
}
export function tableMinimumWidth(columns: Column[]) {
  return columns.reduce((total, column) => total + resolveColumnLayout(column).minimum, 0);
}

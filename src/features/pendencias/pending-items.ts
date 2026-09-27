export type PendingAccount = { id: string; descricao: string; dataVencimento: string; valorLiquido: number; valorPago?: number | null; statusCodigo: string; pessoaNome?: string };
export type PendingImport = { id: string; statusCodigo: string; quantidadePendentes: number; nomeArquivo?: string | null };
export type PendingItem = { id: string; descricao: string; pessoaNome?: string; vencimento?: string; valor: number | null; motivo: string; href: string; tipo: 'pagar' | 'receber' | 'importacao' };

function utcDay(value: string): number {
  const date = new Date(`${value}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error('Data de vencimento inválida');
  return date.getTime();
}

export function buildPendingItems(input: { pagar: PendingAccount[]; receber: PendingAccount[]; importacoes: PendingImport[] }, today: string): PendingItem[] {
  const todayTime = utcDay(today);
  const lastTime = todayTime + 6 * 86400000;
  const items = new Map<string, PendingItem>();
  for (const tipo of ['pagar', 'receber'] as const) {
    for (const account of input[tipo]) {
      if (!['PENDENTE', 'VENCIDA', 'PARCIAL'].includes(account.statusCodigo)) continue;
      if (!Number.isFinite(account.valorLiquido) || !Number.isFinite(account.valorPago ?? 0)) throw new Error('Valor financeiro inválido');
      const due = utcDay(account.dataVencimento);
      const remaining = Math.round((account.valorLiquido - (account.valorPago ?? 0)) * 100) / 100;
      if (due > lastTime || remaining <= 0) continue;
      const id = `${tipo}:${account.id}`;
      items.set(id, { id, tipo, descricao: account.descricao, pessoaNome: account.pessoaNome, vencimento: account.dataVencimento, valor: remaining, motivo: due < todayTime ? 'Vencida' : due === todayTime ? 'Vence hoje' : 'Próximos 7 dias', href: `/contas-${tipo}/${encodeURIComponent(account.id)}` });
    }
  }
  const financial = [...items.values()].sort((a, b) => a.vencimento!.localeCompare(b.vencimento!) || a.id.localeCompare(b.id));
  const imports = input.importacoes.filter(item => ['PENDENTE_REVISAO', 'EXTRAIDO_COM_SUCESSO'].includes(item.statusCodigo) && item.quantidadePendentes > 0);
  for (const item of imports) {
    const id = `importacao:${item.id}`;
    if (items.has(id)) continue;
    const row: PendingItem = { id, tipo: 'importacao', descricao: item.nomeArquivo || 'Importação WhatsApp', valor: null, motivo: `${item.quantidadePendentes} itens para revisar`, href: `/importacoes-whatsapp/${encodeURIComponent(item.id)}` };
    items.set(id, row);
    financial.push(row);
  }
  return financial;
}


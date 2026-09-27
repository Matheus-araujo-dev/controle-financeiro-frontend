import { financeiroApi } from '../../services/http/financeiro-api';
import { importacoesWhatsappApi } from '../../services/http/importacoes-whatsapp-api';
import { buildPendingItems } from './pending-items';

export async function loadPendingPages<T>(fetch: (page: number) => Promise<{ items: T[]; totalPages: number; totalItems: number }>): Promise<T[]> {
  const first = await fetch(1);
  const inconsistent = () => new Error('Pendências alteradas durante a consulta. Atualize a lista.');
  if (!Number.isSafeInteger(first.totalPages) || first.totalPages < 0 || !Number.isSafeInteger(first.totalItems) || first.totalItems < 0 || first.totalPages > Math.max(1, first.totalItems)) throw inconsistent();
  const rows = [...first.items];
  for (let page = 2; page <= first.totalPages; page++) {
    const next = await fetch(page);
    if (next.totalItems !== first.totalItems || next.totalPages !== first.totalPages) throw new Error('Pendências alteradas durante a consulta. Atualize a lista.');
    rows.push(...next.items);
  }
  if (rows.length !== first.totalItems) throw new Error('Pendências alteradas durante a consulta. Atualize a lista.');
  const ids = rows.map(row => typeof row === 'object' && row !== null && 'id' in row ? row.id : row);
  if (new Set(ids).size !== rows.length) throw inconsistent();
  return rows;
}

export async function loadPendingItems(today: string) {
  const end = new Date(`${today}T12:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 6);
  const filter = { pageSize: 100, search: '', statusCodigo: ['PENDENTE', 'VENCIDA', 'PARCIAL'] as ('PENDENTE' | 'VENCIDA' | 'PARCIAL')[], dataFinal: end.toISOString().slice(0, 10) };
  const [pagar, receber, revisar, extraidas] = await Promise.all([
    loadPendingPages(page => financeiroApi.contasPagar.listar({ ...filter, page })),
    loadPendingPages(page => financeiroApi.contasReceber.listar({ ...filter, page })),
    loadPendingPages(page => importacoesWhatsappApi.listar({ page, pageSize: 100, statusCodigo: 'PENDENTE_REVISAO' })),
    loadPendingPages(page => importacoesWhatsappApi.listar({ page, pageSize: 100, statusCodigo: 'EXTRAIDO_COM_SUCESSO' })),
  ]);
  return buildPendingItems({ pagar: pagar.map(item => ({ ...item, pessoaNome: item.recebedorNome })), receber: receber.map(item => ({ ...item, pessoaNome: item.pagadorNome })), importacoes: [...revisar, ...extraidas] }, today);
}


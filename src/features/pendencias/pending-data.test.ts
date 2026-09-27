import { describe, expect, it, vi } from 'vitest';
import { financeiroApi } from '../../services/http/financeiro-api';
import { importacoesWhatsappApi } from '../../services/http/importacoes-whatsapp-api';
import type { ContaPagarResumo, ContaReceberResumo } from '../../types/financeiro';
import { loadPendingItems, loadPendingPages } from './pending-data';

describe('paginação das pendências', () => {
  it('busca todas as páginas e mantém a ordem', async () => {
    const fetch = vi.fn().mockResolvedValueOnce({ items: ['a'], totalPages: 2, totalItems: 2 }).mockResolvedValueOnce({ items: ['b'], totalPages: 2, totalItems: 2 });
    expect(await loadPendingPages(fetch)).toEqual(['a', 'b']);
    expect(fetch.mock.calls).toEqual([[1], [2]]);
  });
  it('não transforma falha de uma página em uma lista parcial', async () => {
    const fetch = vi.fn().mockResolvedValueOnce({ items: ['a'], totalPages: 2, totalItems: 2 }).mockRejectedValueOnce(new Error('offline'));
    await expect(loadPendingPages(fetch)).rejects.toThrow('offline');
  });
  it('recusa totais inconsistentes e oferece recarregar em vez de omitir itens', async () => {
    await expect(loadPendingPages(vi.fn().mockResolvedValue({ items: ['a'], totalPages: 1, totalItems: 2 }))).rejects.toThrow('alteradas');
  });
  it('aceita uma lista realmente vazia', async () => {
    expect(await loadPendingPages(vi.fn().mockResolvedValue({ items: [], totalPages: 0, totalItems: 0 }))).toEqual([]);
  });
});

it('integra as fontes com saldo parcial, pessoa e limite de vencimento corretos', async () => {
  const pagar = { id: 'p', descricao: 'Internet', dataVencimento: '2026-09-10', valorLiquido: 100, valorPago: 40, statusCodigo: 'PARCIAL', recebedorNome: 'Operadora' } as ContaPagarResumo;
  const receber = { id: 'r', descricao: 'Reembolso', dataVencimento: '2026-09-11', valorLiquido: 20, valorPago: null, statusCodigo: 'PENDENTE', pagadorNome: 'Pessoa' } as ContaReceberResumo;
  const page = <T,>(items: T[]) => ({ items, page: 1, pageSize: 100, totalItems: items.length, totalPages: 1 });
  const payments = vi.spyOn(financeiroApi.contasPagar, 'listar').mockResolvedValue(page([pagar]));
  vi.spyOn(financeiroApi.contasReceber, 'listar').mockResolvedValue(page([receber]));
  const imports = vi.spyOn(importacoesWhatsappApi, 'listar').mockResolvedValue(page([]));
  try {
    const rows = await loadPendingItems('2026-09-10');
    expect(rows.map(item => [item.tipo, item.valor, item.pessoaNome])).toEqual([['pagar', 60, 'Operadora'], ['receber', 20, 'Pessoa']]);
    expect(payments).toHaveBeenCalledWith(expect.objectContaining({ page: 1, dataFinal: '2026-09-16', statusCodigo: ['PENDENTE', 'VENCIDA', 'PARCIAL'] }));
    expect(imports.mock.calls.map(call => call[0].statusCodigo)).toEqual(['PENDENTE_REVISAO', 'EXTRAIDO_COM_SUCESSO']);
  } finally { vi.restoreAllMocks(); }
});

it('recusa páginas com IDs repetidos em vez de ocultar a inconsistência', async () => {
  const fetch = vi.fn().mockResolvedValue({ items: [{ id: 'same' }], totalPages: 2, totalItems: 2 });
  await expect(loadPendingPages(fetch)).rejects.toThrow('alteradas');
});
it.each([-1, 1.5, NaN])('recusa metadados de paginação inválidos (%s)', async totalPages => {
  await expect(loadPendingPages(vi.fn().mockResolvedValue({ items: [], totalPages, totalItems: 0 }))).rejects.toThrow('alteradas');
});
it('recusa mudanças entre páginas mesmo quando a contagem final coincide', async () => {
  const fetch = vi.fn().mockResolvedValueOnce({ items: ['a'], totalPages: 2, totalItems: 2 }).mockResolvedValueOnce({ items: ['b'], totalPages: 3, totalItems: 2 });
  await expect(loadPendingPages(fetch)).rejects.toThrow('alteradas');
});

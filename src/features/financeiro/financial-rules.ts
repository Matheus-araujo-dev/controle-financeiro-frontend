import type { ContaPagarResumo, ContaReceberResumo } from '../../types/financeiro';
import { financeiroApi } from '../../services/http/financeiro-api';

export type DuplicateItemSummary = {
  id: string;
  descricao: string;
  pessoaNome: string;
  valorLiquido: number;
  dataVencimento: string;
  statusNome: string;
  statusCodigo: string;
};

function mapPagar(item: ContaPagarResumo): DuplicateItemSummary {
  return {
    id: item.id,
    descricao: item.descricao,
    pessoaNome: item.recebedorNome,
    valorLiquido: item.valorLiquido,
    dataVencimento: item.dataVencimento,
    statusNome: item.statusNome,
    statusCodigo: item.statusCodigo
  };
}

function mapReceber(item: ContaReceberResumo): DuplicateItemSummary {
  return {
    id: item.id,
    descricao: item.descricao,
    pessoaNome: item.pagadorNome,
    valorLiquido: item.valorLiquido,
    dataVencimento: item.dataVencimento,
    statusNome: item.statusNome,
    statusCodigo: item.statusCodigo
  };
}

export async function checkContaPagarDuplicate(
  descricao: string,
  dataVencimento: string,
  recebedorId?: string,
  valor?: number
): Promise<DuplicateItemSummary[] | null> {
  if (!descricao.trim() || !dataVencimento) return null;
  const result = await financeiroApi.contasPagar.listar({
    page: 1,
    pageSize: 5,
    search: descricao.trim(),
    dataInicial: dataVencimento,
    dataFinal: dataVencimento,
    recebedorId: recebedorId || undefined,
    valorMinimo: valor !== undefined ? Math.max(0, valor - 0.01) : undefined,
    valorMaximo: valor !== undefined ? valor + 0.01 : undefined,
    statusCodigo: ['PENDENTE', 'VENCIDA', 'FUTURO', 'PARCIAL']
  });
  return result.totalItems > 0 ? result.items.map(mapPagar) : null;
}

export async function checkContaReceberDuplicate(
  descricao: string,
  dataVencimento: string,
  pagadorId?: string,
  valor?: number
): Promise<DuplicateItemSummary[] | null> {
  if (!descricao.trim() || !dataVencimento) return null;
  const result = await financeiroApi.contasReceber.listar({
    page: 1,
    pageSize: 5,
    search: descricao.trim(),
    dataInicial: dataVencimento,
    dataFinal: dataVencimento,
    pagadorId: pagadorId || undefined,
    valorMinimo: valor !== undefined ? Math.max(0, valor - 0.01) : undefined,
    valorMaximo: valor !== undefined ? valor + 0.01 : undefined,
    statusCodigo: ['PENDENTE', 'VENCIDA', 'FUTURO', 'PARCIAL']
  });
  return result.totalItems > 0 ? result.items.map(mapReceber) : null;
}

import { financeiroApi } from '../../services/http/financeiro-api';

export async function checkContaPagarDuplicate(descricao: string, dataVencimento: string): Promise<boolean> {
  if (!descricao.trim() || !dataVencimento) return false;
  const result = await financeiroApi.contasPagar.listar({
    page: 1,
    pageSize: 5,
    search: descricao.trim(),
    dataInicial: dataVencimento,
    dataFinal: dataVencimento,
    statusCodigo: ['PENDENTE', 'VENCIDA', 'FUTURO', 'PARCIAL']
  });
  return result.totalItems > 0;
}

export async function checkContaReceberDuplicate(descricao: string, dataVencimento: string): Promise<boolean> {
  if (!descricao.trim() || !dataVencimento) return false;
  const result = await financeiroApi.contasReceber.listar({
    page: 1,
    pageSize: 5,
    search: descricao.trim(),
    dataInicial: dataVencimento,
    dataFinal: dataVencimento,
    statusCodigo: ['PENDENTE', 'VENCIDA', 'FUTURO', 'PARCIAL']
  });
  return result.totalItems > 0;
}

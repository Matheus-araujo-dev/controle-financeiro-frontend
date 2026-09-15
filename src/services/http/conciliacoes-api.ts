import { apiClient } from './api-client';
import { cadastrosApi } from './cadastros-api';
import type { ConciliacaoResumoResponse, ConciliacaoDetalheResponse } from '../../types/generated/api';
import type {
  ConciliacaoDetalhe,
  ConciliacaoResumo,
  ConciliarItemPayload,
  PagedConciliacoes
} from '../../types/conciliacao';

function status(value?: string | null) {
  return value === 'EmRevisao' ? 'EmAndamento' as const : value === 'Concluida' ? 'Concluida' as const : 'Pendente' as const;
}
function resumo(dto: ConciliacaoResumoResponse, contaBancariaNome: string): ConciliacaoResumo {
  return { id: dto.id!, nomeArquivo: dto.nomeArquivo!, contaBancariaId: dto.contaBancariaId!, contaBancariaNome,
    periodoInicio: dto.dataInicio!, periodoFim: dto.dataFim!, dataCriacao: dto.criadoEmUtc!, totalItens: dto.totalItens!,
    itensConciliados: dto.itensConciliados!, status: status(dto.status) };
}
async function detalhe(dto: ConciliacaoDetalheResponse): Promise<ConciliacaoDetalhe> {
  const conta = await cadastrosApi.contasBancarias.obterPorId(dto.contaBancariaId!);
  const itens = (dto.itens ?? []).map(item => ({ id: item.id!, data: item.data!, descricao: item.descricao!, valor: item.valor!,
    tipo: (item.valor! < 0 ? 'Debito' : 'Credito') as 'Debito' | 'Credito',
    status: item.status as ConciliacaoDetalhe['itens'][number]['status'], movimentacaoVinculadaId: item.movimentacaoVinculadaId ?? null,
    movimentacaoVinculadaDescricao: null,
    sugestao: item.sugestaoMovimentacaoId ? { movimentacaoId: item.sugestaoMovimentacaoId, score: item.scoreSugestao ?? 0 } : null
  }));
  return { id: dto.id!, nomeArquivo: dto.nomeArquivo!, contaBancariaId: dto.contaBancariaId!, contaBancariaNome: conta.nome,
    periodoInicio: dto.dataInicio!, periodoFim: dto.dataFim!, totalItens: dto.totalItens!, itensConciliados: dto.itensConciliados!,
    itensIgnorados: itens.filter(i => i.status === 'Ignorado').length, itensPendentes: itens.filter(i => i.status === 'Pendente').length,
    status: status(dto.status), itens };
}
export const conciliacoesApi = {
  listar: async (params: { page: number; pageSize: number; search?: string }): Promise<PagedConciliacoes> => {
    const { data } = await apiClient.get<ConciliacaoResumoResponse[]>('/conciliacoes');
    const filtered = data.filter(x => !params.search || x.nomeArquivo?.toLocaleLowerCase().includes(params.search.toLocaleLowerCase()));
    const start = (params.page - 1) * params.pageSize;
    const page = filtered.slice(start, start + params.pageSize);
    const ids = [...new Set(page.map(x => x.contaBancariaId!))];
    const contas = await Promise.all(ids.map(async id => [id, (await cadastrosApi.contasBancarias.obterPorId(id)).nome] as const));
    const nomes = new Map(contas);
    return { items: page.map(x => resumo(x, nomes.get(x.contaBancariaId!)!)), totalCount: filtered.length, page: params.page, pageSize: params.pageSize };
  },
  obterPorId: async (id: string) => detalhe((await apiClient.get<ConciliacaoDetalheResponse>(`/conciliacoes/${id}`)).data),
  criar: async (contaBancariaId: string, arquivo: File) => {
    const formData = new FormData();
    formData.append('contaBancariaId', contaBancariaId); formData.append('arquivo', arquivo);
    return detalhe((await apiClient.post<ConciliacaoDetalheResponse>('/conciliacoes', formData)).data);
  },

  conciliarItem: async (conciliacaoId: string, itemId: string, payload: ConciliarItemPayload) => {
    const response = await apiClient.patch<void>(
      `/conciliacoes/${conciliacaoId}/itens/${itemId}/conciliar`,
      payload
    );
    return response.data;
  },

  ignorarItem: async (conciliacaoId: string, itemId: string) => {
    const response = await apiClient.patch<void>(
      `/conciliacoes/${conciliacaoId}/itens/${itemId}/ignorar`
    );
    return response.data;
  }
};
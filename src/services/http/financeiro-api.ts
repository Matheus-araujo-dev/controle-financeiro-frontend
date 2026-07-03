import { apiClient } from './api-client';
import { normalizeContaFilters, normalizeMovimentacaoFilters } from '../../shared/filters';
import type {
  ContaFinanceiraListSummary,
  ContaPagarDetalhe,
  ContaPagarFilters,
  ContaPagarPayload,
  ContaPagarResumo,
  ContaReceberDetalhe,
  ContaReceberFilters,
  ContaReceberPayload,
  ContaReceberResumo,
  EncerrarRecorrenciaPayload,
  FaturaDetalhe,
  FaturaFilters,
  FaturaListSummary,
  FaturaResumo,
  GerarOcorrenciasPayload,
  LiquidacaoPayload,
  CancelarContaPagarPayload,
  MovimentacaoDetalhe,
  MovimentacaoFilters,
  MovimentacaoListSummary,
  MovimentacaoResumo,
  PagarFaturaPayload,
  RecorrenciaFilters,
  RecorrenciaListItem,
  RecorrenciaListResponse,
  PagedFinanceiro
} from '../../types/financeiro';

// ── Tipos de importação de fatura ────────────────────────────────────────────

export interface ImportacaoFaturaItemPreview {
  dataTransacao: string;
  descricao: string;
  valor: number;
  jaImportado: boolean;
  chaveImportacao: string;
}

export interface ImportacaoFaturaPreview {
  itens: ImportacaoFaturaItemPreview[];
  valorTotal: number;
  totalItens: number;
  avisoFormato: string | null;
}

export interface ConfirmarImportacaoPayload {
  cartaoId: string;
  formaPagamentoId: string;
  recebedorPadraoId: string;
  contaGerencialPadraoId: string;
  itens: Array<{
    dataTransacao: string;
    descricao: string;
    valor: number;
    chaveImportacao: string;
  }>;
}

export interface ConfirmarImportacaoResponse {
  contasCriadas: number;
  contasDuplicadas: number;
}

// ─────────────────────────────────────────────────────────────────────────────

async function getPaged<T, TSummary = unknown>(url: string, params: Record<string, unknown>) {
  const response = await apiClient.get<PagedFinanceiro<T, TSummary>>(url, { params });
  return response.data;
}

async function getById<T>(url: string) {
  const response = await apiClient.get<T>(url);
  return response.data;
}

async function post<T>(url: string, payload?: unknown) {
  const response = await apiClient.post<T>(url, payload);
  return response.data;
}

async function put<T>(url: string, payload: unknown) {
  const response = await apiClient.put<T>(url, payload);
  return response.data;
}

export const financeiroApi = {
  contasPagar: {
    listar: (params: ContaPagarFilters) =>
      getPaged<ContaPagarResumo, ContaFinanceiraListSummary>('/contas-pagar', normalizeContaFilters(params)),
    obterPorId: (id: string) => getById<ContaPagarDetalhe>(`/contas-pagar/${id}`),
    criar: (payload: ContaPagarPayload) => post<ContaPagarDetalhe>('/contas-pagar', payload),
    atualizar: (id: string, payload: ContaPagarPayload) => put<ContaPagarDetalhe>(`/contas-pagar/${id}`, payload),
    alterarFuturas: (id: string, payload: ContaPagarPayload) => post<ContaPagarDetalhe>(`/contas-pagar/${id}/alterar-futuras`, payload),
    gerarOcorrencias: (id: string, payload: GerarOcorrenciasPayload) => post<ContaPagarDetalhe>(`/contas-pagar/${id}/gerar-ocorrencias`, payload),
    pausarRecorrencia: (id: string) => post<ContaPagarDetalhe>(`/contas-pagar/${id}/pausar-recorrencia`),
    encerrarRecorrencia: (id: string, payload: EncerrarRecorrenciaPayload) =>
      post<ContaPagarDetalhe>(`/contas-pagar/${id}/encerrar-recorrencia`, payload),
    liquidar: (id: string, payload: LiquidacaoPayload) => post<ContaPagarDetalhe>(`/contas-pagar/${id}/liquidar`, payload),
    estornar: (id: string) => post<ContaPagarDetalhe>(`/contas-pagar/${id}/estornar`),
    cancelar: (id: string, payload?: CancelarContaPagarPayload) => post<ContaPagarDetalhe>(`/contas-pagar/${id}/cancelar`, payload)
  },
  contasReceber: {
    listar: (params: ContaReceberFilters) =>
      getPaged<ContaReceberResumo, ContaFinanceiraListSummary>('/contas-receber', normalizeContaFilters(params)),
    obterPorId: (id: string) => getById<ContaReceberDetalhe>(`/contas-receber/${id}`),
    criar: (payload: ContaReceberPayload) => post<ContaReceberDetalhe>('/contas-receber', payload),
    atualizar: (id: string, payload: ContaReceberPayload) => put<ContaReceberDetalhe>(`/contas-receber/${id}`, payload),
    alterarFuturas: (id: string, payload: ContaReceberPayload) => post<ContaReceberDetalhe>(`/contas-receber/${id}/alterar-futuras`, payload),
    gerarOcorrencias: (id: string, payload: GerarOcorrenciasPayload) => post<ContaReceberDetalhe>(`/contas-receber/${id}/gerar-ocorrencias`, payload),
    pausarRecorrencia: (id: string) => post<ContaReceberDetalhe>(`/contas-receber/${id}/pausar-recorrencia`),
    encerrarRecorrencia: (id: string, payload: EncerrarRecorrenciaPayload) =>
      post<ContaReceberDetalhe>(`/contas-receber/${id}/encerrar-recorrencia`, payload),
    liquidar: (id: string, payload: LiquidacaoPayload) => post<ContaReceberDetalhe>(`/contas-receber/${id}/liquidar`, payload),
    estornar: (id: string) => post<ContaReceberDetalhe>(`/contas-receber/${id}/estornar`),
    cancelar: (id: string) => post<ContaReceberDetalhe>(`/contas-receber/${id}/cancelar`)
  },
  movimentacoes: {
    listar: (params: MovimentacaoFilters) =>
      getPaged<MovimentacaoResumo, MovimentacaoListSummary>('/movimentacoes', normalizeMovimentacaoFilters(params)),
    obterPorId: (id: string) => getById<MovimentacaoDetalhe>(`/movimentacoes/${id}`)
  },
  faturas: {
    listar: (params: FaturaFilters) => getPaged<FaturaResumo, FaturaListSummary>('/faturas', params),
    obterPorId: (id: string) => getById<FaturaDetalhe>(`/faturas/${id}`),
    pagar: (id: string, payload: PagarFaturaPayload) => post<FaturaDetalhe>(`/faturas/${id}/pagar`, payload),
    estornar: (id: string) => post<FaturaDetalhe>(`/faturas/${id}/estornar`),
    importar: {
      preview: async (cartaoId: string, arquivo: File): Promise<ImportacaoFaturaPreview> => {
        const form = new FormData();
        form.append('arquivo', arquivo);
        const { data } = await apiClient.post<ImportacaoFaturaPreview>(
          `/faturas/importar/preview?cartaoId=${cartaoId}`,
          form,
          { headers: { 'Content-Type': 'multipart/form-data' } });
        return data;
      },
      confirmar: (payload: ConfirmarImportacaoPayload): Promise<ConfirmarImportacaoResponse> =>
        post<ConfirmarImportacaoResponse>('/faturas/importar/confirmar', payload),
    },
  },
  recorrencias: {
    listar: (params: RecorrenciaFilters) =>
      getPaged<RecorrenciaListItem>('/recorrencias', params),
    listarAtivas: () => getById<RecorrenciaListResponse>('/recorrencias'),
    obter: (id: string) => getById<RecorrenciaListItem>(`/recorrencias/${id}`),
    pausar: (id: string) => post<RecorrenciaListItem>(`/recorrencias/${id}/pausar`, {}),
    retomar: (id: string) => post<RecorrenciaListItem>(`/recorrencias/${id}/retomar`, {}),
    encerrar: (tipoConta: 'ContaPagar' | 'ContaReceber', id: string) =>
      post<void>(`/${tipoConta === 'ContaPagar' ? 'contas-pagar' : 'contas-receber'}/${id}/encerrar-recorrencia`, {})
  }
};

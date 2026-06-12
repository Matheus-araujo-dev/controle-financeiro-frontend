import { apiClient } from './api-client';

export interface RecorrenciaListItemResponse {
  id: string;
  tipoPeriodicidade: number;
  tipoDia: number;
  diaOrdemMensal: number;
  dataInicio: string;
  dataFim: string | null;
  ativa: boolean;
  permiteEdicaoOcorrenciaIndividual: boolean;
  observacao: string | null;
  contaOrigemTipo: string;
  contaOrigemId: string;
  descricao: string;
  valorLiquido: number;
  pessoaNome: string;
  responsavelNome: string | null;
}

export interface RecorrenciaListSummaryResponse {
  totalRegistros: number;
  valorTotal: number;
}

export interface RecorrenciaListResponse {
  items: RecorrenciaListItemResponse[];
  summary: RecorrenciaListSummaryResponse;
}

export async function listarAtivas(): Promise<RecorrenciaListResponse> {
  const { data } = await apiClient.get<RecorrenciaListResponse>('/recorrencias');
  return data;
}
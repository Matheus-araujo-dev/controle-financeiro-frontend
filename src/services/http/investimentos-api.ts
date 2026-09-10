import type * as Api from '../../types/generated/api';
import type { TipoInvestimento, LiquidezInvestimento } from '../../types/investimentos';
import { apiClient } from './api-client';
import type {
  IndicadoresBcb,
  InvestimentoListQuery,
  InvestimentoPayload,
  InvestimentoResumo,
  InvestimentoUpdatePayload
} from '../../types/investimentos';

const tipos: Record<Api.TipoInvestimento, TipoInvestimento> = {
  RendaFixa: 1, RendaVariavel: 2, FundoImobiliario: 3, Criptomoeda: 4, Outro: 5,
};
const liquidez: Record<Api.LiquidezInvestimento, LiquidezInvestimento> = {
  Diaria: 1, Vencimento: 2, Iliquido: 3,
};
type InvestimentoWire = Omit<InvestimentoResumo, 'tipo' | 'liquidez'> & {
  tipo: Api.TipoInvestimento | TipoInvestimento;
  liquidez: Api.LiquidezInvestimento | LiquidezInvestimento;
};
// Keep numeric select values in the UI; the JSON API serializes enum names.
function normalizeInvestment(data: InvestimentoWire): InvestimentoResumo {
  return {
    ...data,
    tipo: typeof data.tipo === 'string' ? tipos[data.tipo] : data.tipo,
    liquidez: typeof data.liquidez === 'string' ? liquidez[data.liquidez] : data.liquidez,
  };
}

type PagedInvestimentos = {
  items: InvestimentoResumo[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export const investimentosApi = {
  listar: async (params: InvestimentoListQuery): Promise<PagedInvestimentos> => {
    const { data } = await apiClient.get<Omit<PagedInvestimentos, 'items'> & { items: InvestimentoWire[] }>('/investimentos', { params });
    return { ...data, items: data.items.map(normalizeInvestment) };
  },
  obterPorId: async (id: string): Promise<InvestimentoResumo> => {
    const { data } = await apiClient.get<InvestimentoWire>(`/investimentos/${id}`);
    return normalizeInvestment(data);
  },
  criar: async (payload: InvestimentoPayload): Promise<InvestimentoResumo> => {
    const { data } = await apiClient.post<InvestimentoWire>('/investimentos', payload);
    return normalizeInvestment(data);
  },
  atualizar: async (id: string, payload: InvestimentoUpdatePayload): Promise<InvestimentoResumo> => {
    const { data } = await apiClient.put<InvestimentoWire>(`/investimentos/${id}`, payload);
    return normalizeInvestment(data);
  },
  atualizarValorAtual: async (id: string, valorAtual: number): Promise<InvestimentoResumo> => {
    const { data } = await apiClient.post<InvestimentoWire>(`/investimentos/${id}/atualizar-valor`, { valorAtual });
    return normalizeInvestment(data);
  },
  encerrar: async (id: string, valorResgate: number): Promise<InvestimentoResumo> => {
    const { data } = await apiClient.post<InvestimentoWire>(`/investimentos/${id}/encerrar`, { valorResgate });
    return normalizeInvestment(data);
  },
  obterIndicadoresBcb: async (): Promise<IndicadoresBcb> => {
    const { data } = await apiClient.get<IndicadoresBcb>('/investimentos/indicadores-bcb');
    return data;
  }
};

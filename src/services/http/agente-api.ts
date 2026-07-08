import { apiClient } from './api-client';

export interface AgentePerguntarRequest {
  mensagem: string;
  conversaId?: string;
}

export interface AgentePerguntarResponse {
  resposta: string;
  conversaId: string;
  tokensUsados: number;
}

export interface WhatsappStatusResponse {
  telefone: string | null;
  ativo: boolean;
  verificadoEm: string | null;
}

export interface WhatsappRegistrarRequest {
  telefone: string;
}

export interface WhatsappAlertasResponse {
  receberVencimento: boolean;
  diasAntecedenciaVencimento: number;
  receberLimiteCategoria: boolean;
  receberLimiteResponsavel: boolean;
}

export interface AgenteInsight {
  tipo: 'ALERTA' | 'POSITIVO' | 'DICA' | 'INFO';
  mensagem: string;
  valor?: string;
}

export interface AgenteInsightsResponse {
  insights: AgenteInsight[];
  tokensUsados: number;
}

export interface AgenteCategorizacaoItem {
  descricao: string;
  contaGerencialId: string | null;
  contaGerencialDescricao: string | null;
  confianca: number;
}

export interface AgenteCategorizarResponse {
  itens: AgenteCategorizacaoItem[];
}

export const agenteApi = {
  perguntar: async (request: AgentePerguntarRequest): Promise<AgentePerguntarResponse> => {
    const { data } = await apiClient.post<AgentePerguntarResponse>('/agente/perguntar', request);
    return data;
  },

  obterStatusWhatsapp: async (): Promise<WhatsappStatusResponse> => {
    const { data } = await apiClient.get<WhatsappStatusResponse>('/perfil/whatsapp');
    return data;
  },

  registrarWhatsapp: async (request: WhatsappRegistrarRequest): Promise<WhatsappStatusResponse> => {
    const { data } = await apiClient.put<WhatsappStatusResponse>('/perfil/whatsapp', request);
    return data;
  },

  desativarWhatsapp: async (): Promise<void> => {
    await apiClient.delete('/perfil/whatsapp');
  },

  obterAlertasWhatsapp: async (): Promise<WhatsappAlertasResponse> => {
    const { data } = await apiClient.get<WhatsappAlertasResponse>('/perfil/whatsapp/alertas');
    return data;
  },

  salvarAlertasWhatsapp: async (request: WhatsappAlertasResponse): Promise<WhatsappAlertasResponse> => {
    const { data } = await apiClient.put<WhatsappAlertasResponse>('/perfil/whatsapp/alertas', request);
    return data;
  },

  obterInsights: async (mesReferencia: string): Promise<AgenteInsightsResponse> => {
    // validateStatus: () => true evita que qualquer status (500, timeout etc.) dispare
    // o interceptor de erro global e mostre o toast "Falha na comunicação com a API".
    // O card de IA trata a ausência de insights silenciosamente na UI.
    const { data } = await apiClient.post<AgenteInsightsResponse>(
      '/agente/insights',
      { mesReferencia },
      { timeout: 60_000, validateStatus: () => true } as never
    );
    return data?.insights ? data : { insights: [], tokensUsados: 0 };
  },

  categorizar: async (descricoes: string[]): Promise<AgenteCategorizarResponse> => {
    const { data } = await apiClient.post<AgenteCategorizarResponse>('/agente/categorizar', { descricoes });
    return data;
  },
};

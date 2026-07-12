import { apiClient } from './api-client';
import type {
  ConfiguracaoNotificacao,
  SalvarConfiguracaoNotificacaoPayload,
  PushSubscriptionRecord,
  RegistrarPushSubscriptionPayload,
  VapidPublicKeyResponse
} from '../../types/alertas';

export const alertasApi = {
  configuracao: {
    obter: async (): Promise<ConfiguracaoNotificacao> => {
      const { data } = await apiClient.get<ConfiguracaoNotificacao>('/alertas/configuracao');
      return data;
    },
    salvar: async (payload: SalvarConfiguracaoNotificacaoPayload): Promise<ConfiguracaoNotificacao> => {
      const { data } = await apiClient.put<ConfiguracaoNotificacao>('/alertas/configuracao', payload);
      return data;
    }
  },
  push: {
    obterVapidKey: async (): Promise<VapidPublicKeyResponse> => {
      const { data } = await apiClient.get<VapidPublicKeyResponse>('/alertas/push/vapid-key');
      return data;
    },
    listarSubscriptions: async (): Promise<PushSubscriptionRecord[]> => {
      const { data } = await apiClient.get<PushSubscriptionRecord[]>('/alertas/push/subscriptions');
      return data;
    },
    registrarSubscription: async (payload: RegistrarPushSubscriptionPayload): Promise<PushSubscriptionRecord> => {
      const { data } = await apiClient.post<PushSubscriptionRecord>('/alertas/push/subscriptions', payload);
      return data;
    },
    removerSubscription: async (id: string): Promise<void> => {
      await apiClient.delete(`/alertas/push/subscriptions/${id}`);
    }
  }
};

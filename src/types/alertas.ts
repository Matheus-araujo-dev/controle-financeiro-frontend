export type ConfiguracaoNotificacao = {
  emailAtivo: boolean;
  emailDestinatario: string | null;
  emailVencimento: boolean;
  emailDiasAntecedencia: number;
  emailLimiteCategoria: boolean;
  pushAtivo: boolean;
  pushVencimento: boolean;
  pushDiasAntecedencia: number;
  pushLimiteCategoria: boolean;
};

export type SalvarConfiguracaoNotificacaoPayload = ConfiguracaoNotificacao;

export type PushSubscriptionRecord = {
  id: string;
  endpoint: string;
  ativo: boolean;
};

export type RegistrarPushSubscriptionPayload = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type VapidPublicKeyResponse = {
  publicKey: string;
};

import type * as Api from './generated/api';
import type { ApiContract } from './api-contract';

export type ConfiguracaoNotificacao = ApiContract<Api.ConfiguracaoNotificacaoResponse, 'emailDestinatario'>;

export type SalvarConfiguracaoNotificacaoPayload = ConfiguracaoNotificacao;

export type PushSubscriptionRecord = ApiContract<Api.PushSubscriptionResponse>;

export type RegistrarPushSubscriptionPayload = ApiContract<Api.RegistrarPushSubscriptionRequest>;

export type VapidPublicKeyResponse = ApiContract<Api.VapidPublicKeyResponse>;

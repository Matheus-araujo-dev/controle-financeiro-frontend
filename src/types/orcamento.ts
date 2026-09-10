import type * as Api from './generated/api';
import type { ApiContract } from './api-contract';

export type OrcamentoItem = ApiContract<Api.OrcamentoItemResponse, 'metaId' | 'contaPaiId' | 'contaGerencialCodigo' | 'valorMeta' | 'percentualConsumido'>;

export type OrcamentoCompetencia = Omit<ApiContract<Api.OrcamentoCompetenciaResponse, 'percentualConsumido'>, 'itens'> & {
  itens: OrcamentoItem[];
};

export type UpsertMetaOrcamentoPayload = ApiContract<Api.UpsertMetaOrcamentoRequest>;

export type MetaOrcamento = ApiContract<Api.MetaOrcamentoResponse>;

import type * as Api from './generated/api';
import type { ApiContract } from './api-contract';
import type { CriarReembolsoPayload, RecorrenciaPayload } from './financeiro';

export type ReembolsoFatura = Omit<CriarReembolsoPayload, 'contaOrigemId'>;
export type VincularItemFatura = Omit<ApiContract<Api.VincularItemFaturaRequest, 'reembolso', 'aprender' | 'camposParaAprender' | 'reembolso'>, 'reembolso'> & { reembolso?: ReembolsoFatura | null };
export type ContaConciliacao = Omit<ApiContract<Api.ContaConciliacaoResponse, 'responsavelCompraId' | 'regraRecorrenciaId' | 'grupoReembolsoId'>, 'rateios'> & {
  rateios: ApiContract<Api.RateioConciliacaoResponse>[];
};
export type PreferenciasFatura = Omit<ApiContract<Api.PreferenciasFaturaResponse, keyof Api.PreferenciasFaturaResponse>, 'rateios'> & {
  rateios: ApiContract<Api.RateioMemoriaResponse>[] | null;
};
export type ItemFaturaConciliacao = Omit<ApiContract<Api.ItemFaturaConciliacaoResponse,
  'contaPagarVinculadaId' | 'valorAnteriorSistema' | 'preferencias', 'preferencias' | 'rascunho' | 'atualizadoEmUtc'>,
  'preferencias' | 'rascunho' | 'candidatos'> & {
  preferencias?: PreferenciasFatura | null; rascunho?: unknown;
  candidatos: ApiContract<Api.CandidatoConciliacaoResponse>[];
};
export type ConciliacaoFatura = Omit<ApiContract<Api.ConciliacaoFaturaResponse, 'avisoLeitura' | 'totalDocumento', 'avisoLeitura' | 'totalDocumento'>, 'itens' | 'contasSistema'> & {
  itens: ItemFaturaConciliacao[]; contasSistema: ContaConciliacao[];
};
export type CriarItemFatura = Omit<ApiContract<Api.CriarItemFaturaRequest, 'responsavelCompraId' | 'observacao'>,
  'rateios' | 'recorrencia' | 'reembolso' | 'responsaveisAdicionaisIds' | 'valoresPorResponsavel'> & {
  rateios: ApiContract<Api.RateioRequest>[]; recorrencia: RecorrenciaPayload | null; reembolso: ReembolsoFatura | null;
  responsaveisAdicionaisIds?: string[]; valoresPorResponsavel?: number[];
};
export type RevisaoFaturaResumo = ApiContract<Api.RevisaoFaturaResumoResponse>;
export type SugestaoItemConciliacao = ApiContract<Api.SugestaoItemConciliacaoResponse, 'descricao' | 'recebedorId' | 'responsavelCompraId' | 'contaGerencialId' | 'contaPagarId' | 'justificativa', 'contaPagarId' | 'justificativa'>;
export type SugestoesConciliacao = { sugestoes: SugestaoItemConciliacao[] };

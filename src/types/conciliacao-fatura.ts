import type * as Api from './generated/api';
import type { ApiContract } from './api-contract';
import type { CriarReembolsoPayload, RecorrenciaPayload } from './financeiro';

export type ReembolsoFatura = Omit<CriarReembolsoPayload, 'contaOrigemId'>;
export type VincularItemFatura = Omit<ApiContract<Api.VincularItemFaturaRequest, 'reembolso', 'aprender' | 'camposParaAprender' | 'reembolso'>, 'reembolso'> & { reembolso?: ReembolsoFatura | null };
export type ContaConciliacao = Omit<ApiContract<Api.ContaConciliacaoResponse, 'pagadorId' | 'regraRecorrenciaId' | 'grupoReembolsoId'>, 'rateios'> & {
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
export type CriarItemFatura = Omit<ApiContract<Api.CriarItemFaturaRequest, 'pagadorId' | 'observacao'>,
  'rateios' | 'recorrencia' | 'reembolso' | 'pagadoresAdicionaisIds' | 'valoresPorPagador'> & {
  rateios: ApiContract<Api.RateioRequest>[]; recorrencia: RecorrenciaPayload | null; reembolso: ReembolsoFatura | null;
  pagadoresAdicionaisIds?: string[]; valoresPorPagador?: number[];
};
export type RevisaoFaturaResumo = ApiContract<Api.RevisaoFaturaResumoResponse>;
export type SugestaoItemConciliacao = ApiContract<Api.SugestaoItemConciliacaoResponse, 'descricao' | 'recebedorId' | 'pagadorId' | 'contaGerencialId' | 'contaPagarId' | 'justificativa', 'contaPagarId' | 'justificativa'>;
export type SugestoesConciliacao = { sugestoes: SugestaoItemConciliacao[] };

import type * as Api from './generated/api';
import type { ApiContract } from './api-contract';

import type { PagedResult } from './api';

export type TipoOrigemImportacaoWhatsappCodigo = 'TEXTO' | 'IMAGEM' | 'PDF' | 'ARQUIVO';
export type StatusImportacaoWhatsappCodigo =
  | 'RECEBIDO'
  | 'EM_PROCESSAMENTO'
  | 'EXTRAIDO_COM_SUCESSO'
  | 'PENDENTE_REVISAO'
  | 'CONFIRMADO'
  | 'REJEITADO'
  | 'ERRO_EXTRACAO';
export type TipoSugestaoImportacaoWhatsappCodigo =
  | 'CONTA_PAGAR'
  | 'CONTA_RECEBER'
  | 'COMPRA_CARTAO'
  | 'MOVIMENTACAO'
  | 'ITEM_EXTRATO';
export type StatusItemImportadoWhatsappCodigo = 'SUGERIDO' | 'CONFIRMADO' | 'REJEITADO';

export type PredicaoClassificacaoImportacaoWhatsapp = ApiContract<Api.PredicaoClassificacaoImportacaoWhatsappResponse, 'contaGerencialId' | 'contaGerencialDescricao' | 'responsavelId' | 'responsavelNome' | 'descricaoAjustada'>;

export type ImportacoesWhatsappFilters = {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'Asc' | 'Desc';
  tipoOrigemCodigo?: TipoOrigemImportacaoWhatsappCodigo | '';
  statusCodigo?: StatusImportacaoWhatsappCodigo | '';
  remetente?: string;
  nomeArquivo?: string;
  mimeType?: string;
  confiancaExtracaoMin?: number | string;
  confiancaExtracaoMax?: number | string;
  recebidoEmInicial?: string;
  recebidoEmFinal?: string;
  processadoEmInicial?: string;
  processadoEmFinal?: string;
};

export type ImportacaoWhatsappResumo = Omit<ApiContract<Api.ImportacaoWhatsappResumoResponse, 'textoBruto' | 'nomeArquivo' | 'mimeType' | 'confiancaExtracao' | 'processadoEmUtc'>, 'tipoOrigemCodigo' | 'statusCodigo'> & {
  tipoOrigemCodigo: TipoOrigemImportacaoWhatsappCodigo;
  statusCodigo: StatusImportacaoWhatsappCodigo;
};

export type ItemImportadoWhatsapp = Omit<ApiContract<Api.ItemImportadoWhatsappResponse, 'descricaoAjustada' | 'contaGerencialId' | 'contaGerencialDescricao' | 'responsavelId' | 'responsavelNome' | 'contaReceberId' | 'statusPrevisaoNome' | 'observacao' | 'confirmadoEmUtc' | 'rejeitadoEmUtc'>, 'tipoSugestaoCodigo' | 'statusCodigo' | 'statusPrevisaoCodigo' | 'predicao'> & {
  tipoSugestaoCodigo: TipoSugestaoImportacaoWhatsappCodigo;
  statusCodigo: StatusItemImportadoWhatsappCodigo;
  statusPrevisaoCodigo: 'PREVISTO' | 'NAO_PREVISTO' | null;
  predicao: PredicaoClassificacaoImportacaoWhatsapp | null;
};

export type ImportacaoWhatsappDetalhe = Omit<ImportacaoWhatsappResumo, 'quantidadeItens' | 'quantidadePendentes'> & {
  caminhoArquivo: string | null;
  mensagemErro: string | null;
  confirmadoEmUtc: string | null;
  rejeitadoEmUtc: string | null;
  possuiGeracaoFinanceira?: boolean;
  itens: ItemImportadoWhatsapp[];
};

export type RevisarItemImportadoPayload = ApiContract<Api.RevisarItemImportadoWhatsappRequest, 'observacao' | 'descricaoAjustada' | 'contaGerencialId' | 'responsavelId' | 'dataVencimentoContaReceber'>;

export type AprovarImportacaoWhatsappPayload = Omit<ApiContract<Api.AprovarImportacaoWhatsappRequest, 'recebedorFaturaId' | 'responsavelPagamentoFaturaId'>, 'cartaoIds'> & {
  cartaoIds: string[];
};

export type PagedImportacoesWhatsapp<T> = PagedResult<T>;

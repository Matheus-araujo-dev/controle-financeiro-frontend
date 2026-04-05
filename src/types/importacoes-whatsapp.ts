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

export type ImportacoesWhatsappFilters = {
  page: number;
  pageSize: number;
  search?: string;
  statusCodigo?: StatusImportacaoWhatsappCodigo | '';
};

export type ImportacaoWhatsappResumo = {
  id: string;
  tipoOrigemCodigo: TipoOrigemImportacaoWhatsappCodigo;
  tipoOrigemNome: string;
  remetente: string;
  textoBruto: string | null;
  nomeArquivo: string | null;
  mimeType: string | null;
  statusCodigo: StatusImportacaoWhatsappCodigo;
  statusNome: string;
  confiancaExtracao: number | null;
  quantidadeItens: number;
  quantidadePendentes: number;
  recebidoEmUtc: string;
  processadoEmUtc: string | null;
};

export type ItemImportadoWhatsapp = {
  id: string;
  importacaoWhatsappId: string;
  tipoSugestaoCodigo: TipoSugestaoImportacaoWhatsappCodigo;
  tipoSugestaoNome: string;
  payloadSugeridoJson: string;
  statusCodigo: StatusItemImportadoWhatsappCodigo;
  statusNome: string;
  observacao: string | null;
  confirmadoEmUtc: string | null;
  rejeitadoEmUtc: string | null;
};

export type ImportacaoWhatsappDetalhe = Omit<ImportacaoWhatsappResumo, 'quantidadeItens' | 'quantidadePendentes'> & {
  caminhoArquivo: string | null;
  mensagemErro: string | null;
  confirmadoEmUtc: string | null;
  rejeitadoEmUtc: string | null;
  itens: ItemImportadoWhatsapp[];
};

export type RevisarItemImportadoPayload = {
  observacao: string | null;
};

export type PagedImportacoesWhatsapp<T> = PagedResult<T>;

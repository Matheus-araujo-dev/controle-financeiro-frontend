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

export type PredicaoClassificacaoImportacaoWhatsapp = {
  contaGerencialId: string | null;
  contaGerencialDescricao: string | null;
  responsavelId: string | null;
  responsavelNome: string | null;
  descricaoAjustada: string | null;
  gerarContaReceber: boolean;
  marcarComoRecorrente: boolean;
  quantidadeOcorrencias: number;
  confiancaHistorico: number;
};

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
  descricaoAjustada: string | null;
  marcarComoRecorrente: boolean;
  contaGerencialId: string | null;
  contaGerencialDescricao: string | null;
  responsavelId: string | null;
  responsavelNome: string | null;
  contaReceberId: string | null;
  statusPrevisaoCodigo: 'PREVISTO' | 'NAO_PREVISTO' | null;
  statusPrevisaoNome: string | null;
  observacao: string | null;
  confirmadoEmUtc: string | null;
  rejeitadoEmUtc: string | null;
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

export type RevisarItemImportadoPayload = {
  observacao: string | null;
  descricaoAjustada: string | null;
  contaGerencialId: string | null;
  responsavelId: string | null;
  dataVencimentoContaReceber: string | null;
  gerarContaReceber: boolean;
  marcarComoRecorrente: boolean;
};

export type AprovarImportacaoWhatsappPayload = {
  recebedorFaturaId: string | null;
  responsavelPagamentoFaturaId: string | null;
  cartaoIds: string[];
};

export type PagedImportacoesWhatsapp<T> = PagedResult<T>;

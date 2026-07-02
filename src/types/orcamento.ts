export type OrcamentoItem = {
  metaId: string | null;
  contaGerencialId: string;
  contaPaiId: string | null;
  contaGerencialCodigo: string | null;
  contaGerencialDescricao: string;
  valorMeta: number | null;
  valorRealizado: number;
  percentualConsumido: number | null;
  estourado: boolean;
  aceitaLancamentos: boolean;
};

export type OrcamentoCompetencia = {
  competencia: string;
  totalMeta: number;
  totalRealizado: number;
  percentualConsumido: number | null;
  possuiEstouro: boolean;
  itens: OrcamentoItem[];
};

export type UpsertMetaOrcamentoPayload = {
  contaGerencialId: string;
  competencia: string;
  valorMeta: number;
};

export type MetaOrcamento = {
  id: string;
  contaGerencialId: string;
  competencia: string;
  valorMeta: number;
};

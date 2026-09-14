export type StatusConciliacao = 'Pendente' | 'EmAndamento' | 'Concluida';
export type StatusItemConciliacao = 'Pendente' | 'Conciliado' | 'Ignorado';

export type ConciliacaoResumo = {
  id: string;
  nomeArquivo: string;
  contaBancariaId: string;
  contaBancariaNome: string;
  periodoInicio: string;
  periodoFim: string;
  totalItens: number;
  itensConciliados: number;
  itensIgnorados: number;
  itensPendentes: number;
  status: StatusConciliacao;
  dataCriacao: string;
};

export type SugestaoConciliacao = {
  movimentacaoId: string;
  descricao: string;
  valor: number;
  data: string;
  score: number;
};

export type ItemConciliacao = {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  tipo: 'Credito' | 'Debito';
  status: StatusItemConciliacao;
  movimentacaoVinculadaId: string | null;
  movimentacaoVinculadaDescricao: string | null;
  sugestao: SugestaoConciliacao | null;
};

export type ConciliacaoDetalhe = {
  id: string;
  nomeArquivo: string;
  contaBancariaId: string;
  contaBancariaNome: string;
  periodoInicio: string;
  periodoFim: string;
  totalItens: number;
  itensConciliados: number;
  itensIgnorados: number;
  itensPendentes: number;
  status: StatusConciliacao;
  dataCriacao: string;
  itens: ItemConciliacao[];
};

export type ConciliarItemPayload = {
  movimentacaoId: string | null;
};

export type PagedConciliacoes = {
  items: ConciliacaoResumo[];
  totalCount: number;
  page: number;
  pageSize: number;
};
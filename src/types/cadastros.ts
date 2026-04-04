import type { PagedResult } from './api';

export type PessoaTipo = 'Fisica' | 'Juridica';
export type FormaPagamentoTipo =
  | 'Dinheiro'
  | 'Pix'
  | 'Boleto'
  | 'Transferencia'
  | 'Debito'
  | 'Credito'
  | 'Outro';
export type ContaGerencialTipo = 'Receita' | 'Despesa';

export type ListQueryBase = {
  page: number;
  pageSize: number;
  search?: string;
};

export type PessoaResumo = {
  id: string;
  nome: string;
  tipoPessoa: PessoaTipo;
  cpfCnpj: string | null;
  email: string | null;
  telefone: string | null;
  ativo: boolean;
};

export type PessoaDetalhe = PessoaResumo & {
  observacao: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type PessoaPayload = {
  nome: string;
  tipoPessoa: PessoaTipo;
  cpfCnpj: string;
  email: string;
  telefone: string;
  observacao: string;
};

export type PessoaFilters = ListQueryBase & {
  tipoPessoa?: PessoaTipo;
  ativo?: boolean;
};

export type FormaPagamentoResumo = {
  id: string;
  nome: string;
  tipo: FormaPagamentoTipo;
  ehCartao: boolean;
  baixarAutomaticamente: boolean;
  ativo: boolean;
};

export type FormaPagamentoDetalhe = FormaPagamentoResumo & {
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type FormaPagamentoPayload = Omit<FormaPagamentoResumo, 'id'>;

export type FormaPagamentoFilters = ListQueryBase & {
  tipo?: FormaPagamentoTipo;
  ehCartao?: boolean;
  baixarAutomaticamente?: boolean;
  ativo?: boolean;
};

export type ContaBancariaResumo = {
  id: string;
  nome: string;
  banco: string;
  agencia: string | null;
  numeroConta: string | null;
  tipoConta: string | null;
  saldoInicial: number;
  dataSaldoInicial: string;
  ativo: boolean;
};

export type ContaBancariaDetalhe = ContaBancariaResumo & {
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type ContaBancariaPayload = Omit<ContaBancariaResumo, 'id'>;

export type ContaBancariaFilters = ListQueryBase & {
  banco?: string;
  ativo?: boolean;
};

export type CartaoResumo = {
  id: string;
  nome: string;
  bandeira: string;
  numeroFinal: string;
  diaFechamentoFatura: number;
  diaVencimentoFatura: number;
  contaBancariaPagamentoPadraoId: string | null;
  limiteCredito: number | null;
  ativo: boolean;
};

export type CartaoDetalhe = CartaoResumo & {
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type CartaoPayload = Omit<CartaoResumo, 'id'>;

export type CartaoFilters = ListQueryBase & {
  bandeira?: string;
  ativo?: boolean;
};

export type ContaGerencialResumo = {
  id: string;
  codigo: string | null;
  descricao: string;
  tipo: ContaGerencialTipo;
  contaPaiId: string | null;
  contaPaiDescricao: string | null;
  ativo: boolean;
};

export type ContaGerencialDetalhe = ContaGerencialResumo & {
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type ContaGerencialPayload = Omit<ContaGerencialResumo, 'id' | 'contaPaiDescricao'>;

export type ContaGerencialFilters = ListQueryBase & {
  tipo?: ContaGerencialTipo;
  contaPaiId?: string;
  ativo?: boolean;
};

export type PagedCadastro<T> = PagedResult<T>;

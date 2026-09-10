import type * as Api from './generated/api';
import type { ApiContract } from './api-contract';

import type { PagedResult } from './api';

export type PessoaTipo = Api.PessoaTipo;
export type PessoaChavePixTipo = Api.PessoaChavePixTipo;
export type FormaPagamentoTipo = Api.FormaPagamentoTipo;
export type ContaGerencialTipo = Api.ContaGerencialTipo;

export type ListQueryBase = {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'Asc' | 'Desc';
};

export type PessoaResumo = Omit<ApiContract<Api.PessoaResumoResponse, 'cpfCnpj' | 'email' | 'telefone' | 'contaGerencialDespesaId' | 'contaGerencialReceitaId'>, 'tipoPessoa'> & {
  tipoPessoa: PessoaTipo;
};

export type PessoaChavePix = Omit<ApiContract<Api.PessoaChavePixResponse>, 'tipo'> & {
  tipo: PessoaChavePixTipo;
};

export type PessoaDetalhe = PessoaResumo & ApiContract<Pick<Api.PessoaDetalheResponse, 'observacao' | 'createdAtUtc' | 'updatedAtUtc'>, 'observacao'> & {
  chavesPix: PessoaChavePix[];
};

export type PessoaPayload = Omit<ApiContract<Api.CriarPessoaRequest>, 'tipoPessoa' | 'chavesPix'> & {
  tipoPessoa: PessoaTipo;
  chavesPix: PessoaChavePix[];
};

export type PessoaFilters = ListQueryBase & {
  tipoPessoa?: PessoaTipo;
  tiposPessoa?: PessoaTipo[];
  ativo?: boolean;
  ehPagador?: boolean;
  ehRecebedor?: boolean;
  ehResponsavel?: boolean;
  documento?: string;
  email?: string;
  telefone?: string;
};

export type PessoaListSummary = ApiContract<Api.PessoaListSummaryResponse>;

export type FormaPagamentoResumo = Omit<ApiContract<Api.FormaPagamentoResumoResponse>, 'tipo'> & {
  tipo: FormaPagamentoTipo;
};

export type FormaPagamentoDetalhe = FormaPagamentoResumo & ApiContract<Pick<Api.FormaPagamentoDetalheResponse, 'createdAtUtc' | 'updatedAtUtc'>>;

export type FormaPagamentoPayload = Omit<FormaPagamentoResumo, 'id'>;

export type FormaPagamentoFilters = ListQueryBase & {
  tipo?: FormaPagamentoTipo;
  tipos?: FormaPagamentoTipo[];
  ehCartao?: boolean;
  baixarAutomaticamente?: boolean;
  ativo?: boolean;
};

export type ContaBancariaResumo = ApiContract<Api.ContaBancariaResumoResponse, 'agencia' | 'numeroConta' | 'tipoConta' | 'limiteCartoesCompartilhado' | 'limiteCartoesDisponivel' | 'icone' | 'cor'>;

export type ContaBancariaDetalhe = ContaBancariaResumo & ApiContract<Pick<Api.ContaBancariaDetalheResponse, 'createdAtUtc' | 'updatedAtUtc'>>;

export type ContaBancariaPayload = ApiContract<Api.CriarContaBancariaRequest, 'limiteCartoesCompartilhado' | 'icone' | 'cor', 'icone' | 'cor'>;

export type ContaBancariaFilters = ListQueryBase & {
  banco?: string;
  agencia?: string;
  numeroConta?: string;
  tipoConta?: string;
  ativo?: boolean;
  tiposConta?: string[];
};

export type ContaBancariaListSummary = ApiContract<Api.ContaBancariaListSummaryResponse>;

export type CartaoResumo = ApiContract<Api.CartaoResumoResponse, 'contaBancariaPagamentoPadraoId' | 'limiteCredito' | 'limiteEfetivo' | 'limiteDisponivel' | 'icone' | 'cor' | 'recebedorPadraoFaturaId' | 'formaPagamentoPadraoFaturaId'>;

export type CartaoDetalhe = CartaoResumo & ApiContract<Pick<Api.CartaoDetalheResponse, 'createdAtUtc' | 'updatedAtUtc'>>;

export type CartaoPayload = ApiContract<Api.CriarCartaoRequest, 'contaBancariaPagamentoPadraoId' | 'limiteCredito' | 'icone' | 'cor' | 'recebedorPadraoFaturaId' | 'formaPagamentoPadraoFaturaId', 'icone' | 'cor' | 'recebedorPadraoFaturaId' | 'formaPagamentoPadraoFaturaId'>;

export type CartaoFilters = ListQueryBase & {
  bandeira?: string;
  numeroFinal?: string;
  diaFechamentoFatura?: number | string;
  diaVencimentoFatura?: number | string;
  contaBancariaPagamentoPadraoId?: string;
  ativo?: boolean;
};

export type ContaGerencialResumo = Omit<ApiContract<Api.ContaGerencialResumoResponse, 'codigo' | 'contaPaiId' | 'contaPaiDescricao' | 'responsavelPadraoId' | 'responsavelPadraoNome' | 'contaGerencialContrariaId' | 'contaGerencialContrariaNome'>, 'tipo'> & {
  tipo: ContaGerencialTipo;
};

export type ContaGerencialDetalhe = ContaGerencialResumo & ApiContract<Pick<Api.ContaGerencialDetalheResponse, 'createdAtUtc' | 'updatedAtUtc'>>;

export type ContaGerencialPayload = Omit<
  ContaGerencialResumo,
  'id' | 'contaPaiDescricao' | 'responsavelPadraoNome' | 'aceitaLancamentos' | 'contaGerencialContrariaNome'
>;

export type ContaGerencialFilters = ListQueryBase & {
  tipo?: ContaGerencialTipo;
  tipos?: ContaGerencialTipo[];
  contaPaiId?: string;
  contaPai?: string;
  responsavelPadraoId?: string;
  responsavelPadrao?: string;
  ativo?: boolean;
  aceitaLancamentos?: boolean;
  ehPadraoRecebimentoFaturaCartao?: boolean;
};

export type PagedCadastro<T> = PagedResult<T>;

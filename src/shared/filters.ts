import type {
  MovimentacaoFilters
} from '../types/financeiro';

export function normalizeContaFilters<
  T extends {
    numeroDocumento?: string;
    descricao?: string;
    statusCodigo?: string | string[];
    statusCodigos?: string[];
    recebedorId?: string;
    recebedorIds?: string[];
    pagadorId?: string;
    pagadorIds?: string[];
    formaPagamentoId?: string;
    formaPagamentoIds?: string[];
    dataEmissaoInicial?: string;
    dataEmissaoFinal?: string;
    dataInicial?: string;
    dataFinal?: string;
    valorMinimo?: number;
    valorMaximo?: number;
    ehRecorrente?: boolean;
  }
>(params: T): Record<string, unknown> {
  const nextStatusCodigo = Array.isArray(params.statusCodigo)
    ? params.statusCodigo.length
      ? params.statusCodigo.join(',')
      : undefined
    : params.statusCodigo;
  const nextStatusCodigos = Array.isArray(params.statusCodigos) && params.statusCodigos.length ? params.statusCodigos : undefined;
  const nextRecebedorIds = Array.isArray(params.recebedorIds) && params.recebedorIds.length ? params.recebedorIds : undefined;
  const nextPagadorIds = Array.isArray(params.pagadorIds) && params.pagadorIds.length ? params.pagadorIds : undefined;
  const nextFormaPagamentoIds =
    Array.isArray(params.formaPagamentoIds) && params.formaPagamentoIds.length ? params.formaPagamentoIds : undefined;

  const { dataInicial, dataFinal, dataEmissaoInicial, dataEmissaoFinal, numeroDocumento, descricao, ...rest } = params;

  return {
    ...rest,
    numeroDocumento: numeroDocumento?.trim() || undefined,
    descricao: descricao?.trim() || undefined,
    statusCodigos: nextStatusCodigos,
    statusCodigo: nextStatusCodigo,
    recebedorIds: nextRecebedorIds,
    pagadorIds: nextPagadorIds,
    formaPagamentoIds: nextFormaPagamentoIds,
    dataVencimentoInicial: dataInicial,
    dataVencimentoFinal: dataFinal,
    dataEmissaoInicial: dataEmissaoInicial || undefined,
    dataEmissaoFinal: dataEmissaoFinal || undefined
  };
}

export function normalizeMovimentacaoFilters(params: MovimentacaoFilters): Record<string, unknown> {
  const contaBancariaIds = Array.isArray(params.contaBancariaIds)
    ? params.contaBancariaIds.filter((value) => value.trim().length > 0)
    : [];
  const responsavelIds = Array.isArray(params.responsavelIds)
    ? params.responsavelIds.filter((value) => value.trim().length > 0)
    : [];
  const pessoaIds = Array.isArray(params.pessoaIds)
    ? params.pessoaIds.filter((value) => value.trim().length > 0)
    : [];

  return {
    ...params,
    contaBancariaIds: contaBancariaIds.length ? contaBancariaIds.join(',') : undefined,
    responsavelIds: responsavelIds.length ? responsavelIds.join(',') : undefined,
    pessoaIds: pessoaIds.length ? pessoaIds.join(',') : undefined
  };
}

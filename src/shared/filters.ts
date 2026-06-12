import type {
  ContaPagarFilters,
  ContaReceberFilters,
  MovimentacaoFilters
} from '../types/financeiro';

export function normalizeContaFilters<
  T extends { statusCodigo?: string | string[]; dataInicial?: string; dataFinal?: string }
>(params: T): Record<string, unknown> {
  const nextStatusCodigo = Array.isArray(params.statusCodigo)
    ? params.statusCodigo.length
      ? params.statusCodigo.join(',')
      : undefined
    : params.statusCodigo;

  const { dataInicial, dataFinal, ...rest } = params;

  return {
    ...rest,
    statusCodigo: nextStatusCodigo,
    dataVencimentoInicial: dataInicial,
    dataVencimentoFinal: dataFinal
  };
}

export function normalizeMovimentacaoFilters(params: MovimentacaoFilters): Record<string, unknown> {
  const contaBancariaIds = Array.isArray(params.contaBancariaIds)
    ? params.contaBancariaIds.filter((value) => value.trim().length > 0)
    : [];
  const responsavelIds = Array.isArray(params.responsavelIds)
    ? params.responsavelIds.filter((value) => value.trim().length > 0)
    : [];

  return {
    ...params,
    contaBancariaIds: contaBancariaIds.length ? contaBancariaIds.join(',') : undefined,
    responsavelIds: responsavelIds.length ? responsavelIds.join(',') : undefined
  };
}
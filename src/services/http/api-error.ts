import axios from 'axios';
import type { ApiErrorResponse } from '../../types/api';

const FALLBACK_MESSAGE = 'Não foi possível concluir a solicitação.';

export function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return error instanceof Error ? error.message : FALLBACK_MESSAGE;
  }

  return error.response?.data?.message ?? error.message ?? FALLBACK_MESSAGE;
}

export function getApiFieldErrors(error: unknown): Record<string, string[]> {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return {};
  }

  return error.response?.data?.errors ?? {};
}

export function isFaturaIndisponivelError(error: unknown): boolean {
  return axios.isAxiosError<ApiErrorResponse>(error) &&
    error.response?.data?.code === 'FATURA_INDISPONIVEL';
}

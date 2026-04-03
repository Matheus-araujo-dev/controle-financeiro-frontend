import axios from 'axios';
import type { ApiErrorResponse } from '../../types/api';

const FALLBACK_MESSAGE = 'Nao foi possivel concluir a solicitacao.';

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

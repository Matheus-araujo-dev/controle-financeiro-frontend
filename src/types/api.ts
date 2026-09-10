import type * as Api from './generated/api';
import type { ApiContract } from './api-contract';

export type ApiErrorResponse = Omit<ApiContract<Api.ApiErrorResponse>, 'errors'> & {
  errors: Record<string, string[]>;
};

export type PagedResult<T, TSummary = unknown> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  summary?: TSummary;
};

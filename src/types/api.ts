export type ApiErrorResponse = {
  code: string;
  message: string;
  errors: Record<string, string[]>;
  traceId: string;
};

export type PagedResult<T, TSummary = unknown> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  summary?: TSummary;
};

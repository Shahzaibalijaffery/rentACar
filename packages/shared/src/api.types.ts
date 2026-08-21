export type ApiResponse<T> = {
  data: T;
};

export type PaginatedMeta = {
  page: number;
  pageSize: number;
  total: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginatedMeta;
};

export type ApiErrorBody = {
  statusCode: number;
  message: string;
  errorCode?: string;
  details?: unknown;
};

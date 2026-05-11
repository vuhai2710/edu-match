import { PagedCollection } from '../types/paged-collection';

interface ApiResponseLike<T> {
  success?: boolean;
  message?: string | null;
  data?: T | null;
}

interface PagedDataLike<T> {
  items?: T[] | null;
  totalCount?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
}

export function unwrapApiResponse<T>(response: ApiResponseLike<T>): T {
  if (!response.success) {
    throw new Error(response.message || 'The API reported a failed response.');
  }

  if (response.data === null || response.data === undefined) {
    throw new Error(response.message || 'The API response did not contain a data payload.');
  }

  return response.data;
}

export function unwrapPagedResponse<T>(response: ApiResponseLike<PagedDataLike<T>>): PagedCollection<T> {
  const data = unwrapApiResponse(response);

  return {
    items: data.items ?? [],
    totalCount: data.totalCount ?? 0,
    page: data.page ?? 1,
    pageSize: data.pageSize ?? 0,
    totalPages: data.totalPages ?? 0,
    hasPreviousPage: data.hasPreviousPage ?? false,
    hasNextPage: data.hasNextPage ?? false
  };
}

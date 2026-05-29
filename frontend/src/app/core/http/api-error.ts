import { HttpErrorResponse } from '@angular/common/http';

export type ApiErrorMapValue = string | string[] | null | undefined;

export interface ApiErrorBody {
  success?: boolean;
  message?: string | null;
  title?: string | null;
  detail?: string | null;
  statusCode?: number | null;
  status?: number | null;
  errorCode?: string | null;
  traceId?: string | null;
  errors?: Record<string, ApiErrorMapValue> | string[] | string | null;
}

export interface ApiErrorDetails {
  message: string;
  status?: number;
  errorCode?: string | null;
  traceId?: string | null;
  errors?: ApiErrorBody['errors'];
  url?: string | null;
}

/** Thrown by unwrapApiData when the backend returns success=false (HTTP 200 business failure). */
export class ApiBusinessError extends Error {
  readonly errorCode: string | null;
  readonly statusCode: number | null;
  constructor(message: string, errorCode?: string | null, statusCode?: number | null) {
    super(message);
    this.name = 'ApiBusinessError';
    this.errorCode = errorCode ?? null;
    this.statusCode = statusCode ?? null;
  }
}

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Không thể xử lý yêu cầu. Vui lòng thử lại.',
): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as ApiErrorBody | string | null | undefined;
    const bodyMessage = getBodyMessage(body);

    if (bodyMessage) {
      return bodyMessage;
    }

    if (error.status === 0) {
      return 'Không kết nối được máy chủ.';
    }

    return fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function getApiErrorDetails(
  error: unknown,
  fallback = 'Không thể xử lý yêu cầu. Vui lòng thử lại.',
): ApiErrorDetails {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as ApiErrorBody | string | null | undefined;
    const errorCode = body && typeof body === 'object' ? (body.errorCode ?? null) : null;
    const traceId = body && typeof body === 'object' ? (body.traceId ?? null) : null;
    const errors = body && typeof body === 'object' ? (body.errors ?? null) : null;
    const bodyStatus =
      body && typeof body === 'object' ? (body.statusCode ?? body.status ?? null) : null;

    return {
      message: getApiErrorMessage(error, fallback),
      status: bodyStatus ?? error.status,
      errorCode,
      traceId,
      errors,
      url: error.url ?? null,
    };
  }

  // HTTP-200 business failure thrown by unwrapApiData
  if (error instanceof ApiBusinessError) {
    return {
      message: error.message || fallback,
      status: error.statusCode ?? undefined,
      errorCode: error.errorCode,
    };
  }

  if (error instanceof Error) {
    return { message: error.message || fallback };
  }

  return { message: fallback };
}

export function unwrapApiData<T>(response: { success?: boolean; data?: T; message?: string | null; errorCode?: string | null; statusCode?: number | null }): T {
  if (!response.success || response.data == null) {
    throw new ApiBusinessError(
      response.message ?? 'API không trả về dữ liệu.',
      response.errorCode,
      response.statusCode,
    );
  }

  return response.data;
}

function getBodyMessage(body: ApiErrorBody | string | null | undefined): string | null {
  if (typeof body === 'string') {
    return body.trim() || null;
  }

  if (!body || typeof body !== 'object') {
    return null;
  }

  const validationMessage = formatValidationErrors(body.errors);
  if (validationMessage) {
    return validationMessage;
  }

  return firstNonEmpty(body.message, body.detail, body.title);
}

function formatValidationErrors(errors: ApiErrorBody['errors']): string | null {
  if (!errors) {
    return null;
  }

  if (typeof errors === 'string') {
    return errors.trim() || null;
  }

  if (Array.isArray(errors)) {
    return joinMessages(errors);
  }

  const messages = Object.entries(errors).flatMap(([field, value]) => {
    const fieldMessages = Array.isArray(value) ? value : [value];

    return fieldMessages
      .filter(
        (message): message is string => typeof message === 'string' && Boolean(message.trim()),
      )
      .map((message) => {
        const trimmed = message.trim();
        return field ? `${field}: ${trimmed}` : trimmed;
      });
  });

  return joinMessages(messages);
}

function joinMessages(messages: string[]): string | null {
  const normalized = messages.map((message) => message.trim()).filter(Boolean);
  return normalized.length ? normalized.join('\n') : null;
}

function firstNonEmpty(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

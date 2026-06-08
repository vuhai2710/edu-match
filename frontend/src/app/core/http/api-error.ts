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

const ERROR_MESSAGE_TRANSLATIONS: Record<string, string> = {
  // English messages
  'success': 'Thành công',
  'success.': 'Thành công.',
  'failed': 'Thất bại',
  'error': 'Đã xảy ra lỗi',
  'invalid input': 'Dữ liệu đầu vào không hợp lệ',
  'not found': 'Không tìm thấy',
  'created successfully': 'Tạo thành công',
  'updated successfully': 'Cập nhật thành công',
  'deleted successfully': 'Xóa thành công',
  'saved successfully': 'Lưu thành công',
  'please try again later': 'Vui lòng thử lại sau',
  'internal server error': 'Lỗi máy chủ nội bộ',
  'unauthorized': 'Không có quyền truy cập',
  'forbidden': 'Bị từ chối truy cập',
  'bad request': 'Yêu cầu không hợp lệ',
  // Unaccented Vietnamese
  'thanh cong': 'Thành công',
  'that bai': 'Thất bại',
  'loi': 'Đã xảy ra lỗi',
  'dang nhap': 'Đăng nhập',
  'dang ky': 'Đăng ký',
  'dang nhap thanh cong': 'Đăng nhập thành công',
  'dang ky thanh cong': 'Đăng ký thành công',
  'xoa thanh cong': 'Xóa thành công',
  'cap nhat thanh cong': 'Cập nhật thành công',
  'tao thanh cong': 'Tạo thành công',
  'khong tim thay': 'Không tìm thấy',
  'du lieu khong hop le': 'Dữ liệu không hợp lệ',
  'vui long thu lai': 'Vui lòng thử lại',
  'mat khau': 'Mật khẩu',
  'tai khoan': 'Tài khoản',
  'khong the xu ly yeu cau. vui long thu lai.': 'Không thể xử lý yêu cầu. Vui lòng thử lại.',
};

function translateMessage(msg: string | null | undefined): string | null {
  if (!msg) return msg ?? null;
  const trimmed = msg.trim();
  const lowerMsg = trimmed.toLowerCase();

  // Exact match
  if (ERROR_MESSAGE_TRANSLATIONS[lowerMsg]) {
    return ERROR_MESSAGE_TRANSLATIONS[lowerMsg];
  }

  // Partial replacement fallback
  let translatedMsg = trimmed;
  for (const [key, value] of Object.entries(ERROR_MESSAGE_TRANSLATIONS)) {
    if (translatedMsg.toLowerCase() === key) {
      return value;
    }
  }

  return trimmed;
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
      translateMessage(response.message) ?? 'API không trả về dữ liệu.',
      response.errorCode,
      response.statusCode,
    );
  }

  return response.data;
}

function getBodyMessage(body: ApiErrorBody | string | null | undefined): string | null {
  if (typeof body === 'string') {
    return translateMessage(body) || null;
  }

  if (!body || typeof body !== 'object') {
    return null;
  }

  const validationMessage = formatValidationErrors(body.errors);
  if (validationMessage) {
    return translateMessage(validationMessage);
  }

  return translateMessage(firstNonEmpty(body.message, body.detail, body.title));
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

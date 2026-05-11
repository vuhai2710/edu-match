import { HttpErrorResponse } from '@angular/common/http';

export function extractHttpErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'Cannot reach the EduMatch backend. Start the ASP.NET API and check CORS / HTTPS settings.';
    }

    if (typeof error.error === 'string' && error.error.trim().length > 0) {
      return error.error;
    }

    if (error.error && typeof error.error === 'object') {
      const candidate =
        ('message' in error.error && typeof error.error.message === 'string' && error.error.message) ||
        ('Message' in error.error && typeof error.error.Message === 'string' && error.error.Message) ||
        ('title' in error.error && typeof error.error.title === 'string' && error.error.title);

      if (candidate) {
        return candidate;
      }
    }

    return error.message || `Request failed with status ${error.status}.`;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Unexpected client error while calling the API.';
}

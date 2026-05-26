import { ErrorHandler, Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { getApiErrorDetails } from '../http/api-error';

@Injectable()
export class AppErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    const normalizedError = this.unwrapError(error);

    if (normalizedError instanceof HttpErrorResponse) {
      const details = getApiErrorDetails(normalizedError);
      console.error('[API error]', {
        message: details.message,
        status: details.status,
        errorCode: details.errorCode,
        traceId: details.traceId,
        url: details.url,
      });
      return;
    }

    console.error(normalizedError);
  }

  private unwrapError(error: unknown): unknown {
    if (error && typeof error === 'object' && 'rejection' in error) {
      return (error as { rejection?: unknown }).rejection ?? error;
    }

    return error;
  }
}

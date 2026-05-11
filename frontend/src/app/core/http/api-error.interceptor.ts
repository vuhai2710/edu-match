import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { ApiErrorService } from './api-error.service';
import { extractHttpErrorMessage } from './http-error.utils';

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const apiErrors = inject(ApiErrorService);

  return next(request).pipe(
    catchError((error) => {
      apiErrors.setError(extractHttpErrorMessage(error));
      return throwError(() => error);
    })
  );
};

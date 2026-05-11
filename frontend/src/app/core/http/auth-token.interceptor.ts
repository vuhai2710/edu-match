import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { TokenStorageService } from '../auth/token-storage.service';

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const tokenStorage = inject(TokenStorageService);
  const token = tokenStorage.getAccessToken();

  if (!token || request.headers.has('Authorization')) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    })
  );
};

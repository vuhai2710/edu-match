import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthApiService } from '../../api/facades/auth-api';
import { SessionService } from '../auth/session';
import { unwrapApiData } from './api-error';

const AUTH_REFRESH_ATTEMPTED = new HttpContextToken<boolean>(() => false);

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionService);
  const authApi = inject(AuthApiService);
  const router = inject(Router);
  const accessToken = session.accessToken();

  const authenticatedRequest = accessToken
    ? request.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      const tokens = session.tokens();
      const url = request.url.toLowerCase();
      const canRefresh =
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        tokens?.refreshToken &&
        !request.context.get(AUTH_REFRESH_ATTEMPTED) &&
        !url.includes('/api/auth/login') &&
        !url.includes('/api/auth/google') &&
        !url.includes('/api/auth/logout') &&
        !url.includes('/api/auth/refresh-token');

      if (!canRefresh || !tokens) {
        return throwError(() => error);
      }

      return authApi.refreshToken(tokens).pipe(
        switchMap((response) => {
          const refreshed = unwrapApiData(response);
          session.bootstrapFromLogin(refreshed);

          return next(
            request.clone({
              context: request.context.set(AUTH_REFRESH_ATTEMPTED, true),
              setHeaders: {
                Authorization: `Bearer ${refreshed.accessToken}`,
              },
            }),
          );
        }),
        catchError((refreshError: unknown) => {
          session.clear();
          void router.navigateByUrl('/auth/login');
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};

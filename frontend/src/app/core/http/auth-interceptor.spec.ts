import { HttpErrorResponse, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';

import { AuthApiService } from '../../api/facades/auth-api';
import { SessionService } from '../auth/session';
import { UserRole } from '../auth/session.models';
import { authInterceptor } from './auth-interceptor';

describe('authInterceptor', () => {
  const authApi = {
    refreshToken: vi.fn(),
  };

  beforeEach(() => {
    window.localStorage.clear();
    authApi.refreshToken.mockReset();
    TestBed.configureTestingModule({
      providers: [
        SessionService,
        provideRouter([]),
        { provide: AuthApiService, useValue: authApi },
      ],
    });
  });

  it('attaches bearer token when a session exists', () => {
    const session = TestBed.inject(SessionService);
    session.setTokens({ accessToken: 'secure-token', refreshToken: 'refresh-token' });
    session.setUser({
      id: 11,
      fullName: 'Admin User',
      email: 'admin@gmail.com',
      role: UserRole.Admin,
      isActive: true,
    });

    const source = new HttpRequest('GET', '/api/demo');
    let forwarded: HttpRequest<unknown> | undefined;

    TestBed.runInInjectionContext(() =>
      authInterceptor(source, (request) => {
        forwarded = request;
        return of(new HttpResponse({ status: 200 }));
      }).subscribe(),
    );

    expect(forwarded?.headers.get('Authorization')).toBe('Bearer secure-token');
  });

  it('passes the original request through when there is no token', () => {
    const source = new HttpRequest('GET', '/api/demo');
    let forwarded: HttpRequest<unknown> | undefined;

    TestBed.runInInjectionContext(() =>
      authInterceptor(source, (request) => {
        forwarded = request;
        return of(new HttpResponse({ status: 200 }));
      }).subscribe(),
    );

    expect(forwarded?.headers.has('Authorization')).toBe(false);
  });

  it('refreshes once on 401 and retries the original request', async () => {
    const session = TestBed.inject(SessionService);
    const refreshedUser = {
      id: 11,
      fullName: 'Admin User',
      email: 'admin@gmail.com',
      role: UserRole.Admin,
      isActive: true,
    };
    session.setTokens({ accessToken: 'expired-token', refreshToken: 'refresh-token' });
    session.setUser(refreshedUser);
    authApi.refreshToken.mockReturnValue(
      of({
        success: true,
        message: 'refreshed',
        data: {
          accessToken: 'fresh-token',
          refreshToken: 'fresh-refresh',
          user: refreshedUser,
        },
      }),
    );

    const source = new HttpRequest('GET', '/api/demo');
    const forwarded: HttpRequest<unknown>[] = [];

    await TestBed.runInInjectionContext(() =>
      firstValueFrom(
        authInterceptor(source, (request) => {
          forwarded.push(request);
          if (forwarded.length === 1) {
            return throwError(() => new HttpErrorResponse({ status: 401 }));
          }

          return of(new HttpResponse({ status: 200 }));
        }),
      ),
    );

    expect(authApi.refreshToken).toHaveBeenCalledWith({
      accessToken: 'expired-token',
      refreshToken: 'refresh-token',
    });
    expect(forwarded).toHaveLength(2);
    expect(forwarded[1].headers.get('Authorization')).toBe('Bearer fresh-token');
    expect(session.accessToken()).toBe('fresh-token');
  });
});

import { HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { SessionService } from '../auth/session';
import { UserRole } from '../auth/session.models';
import { authInterceptor } from './auth-interceptor';

describe('authInterceptor', () => {
  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({
      providers: [SessionService],
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
});

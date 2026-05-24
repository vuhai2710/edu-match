import { TestBed } from '@angular/core/testing';
import { Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';

import { SessionService } from '../auth/session';
import { UserRole } from '../auth/session.models';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({
      providers: [SessionService, provideRouter([])],
    });
  });

  it('redirects anonymous users to login with returnUrl', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard(
        {} as never,
        { url: '/student/dashboard' } as RouterStateSnapshot,
      ),
    );

    expect(result instanceof UrlTree).toBe(true);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe(
      '/auth/login?returnUrl=%2Fstudent%2Fdashboard',
    );
  });

  it('allows authenticated users through', () => {
    const session = TestBed.inject(SessionService);
    session.setTokens({ accessToken: 'token', refreshToken: 'refresh' });
    session.setUser({
      id: 1,
      fullName: 'Student User',
      email: 'student@gmail.com',
      role: UserRole.Student,
      isActive: true,
    });

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/student/dashboard' } as RouterStateSnapshot),
    );

    expect(result).toBe(true);
  });
});

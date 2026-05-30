import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, UrlTree, provideRouter } from '@angular/router';

import { SessionService } from '../auth/session';
import { UserRole } from '../auth/session.models';
import { roleGuard } from './role.guard';

describe('roleGuard', () => {
  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({
      providers: [SessionService, provideRouter([])],
    });
  });

  it('allows matching roles', () => {
    const session = TestBed.inject(SessionService);
    session.setUser({
      id: 2,
      fullName: 'Tutor User',
      email: 'tutor@gmail.com',
      role: UserRole.Tutor,
      isActive: true,
    });

    const result = TestBed.runInInjectionContext(() =>
      roleGuard({
        data: { roles: [UserRole.Tutor] },
      } as unknown as ActivatedRouteSnapshot, {} as never),
    );

    expect(result).toBe(true);
  });

  it('redirects non matching roles to home', () => {
    const session = TestBed.inject(SessionService);
    session.setUser({
      id: 3,
      fullName: 'Student User',
      email: 'student@gmail.com',
      role: UserRole.Student,
      isActive: true,
    });

    const result = TestBed.runInInjectionContext(() =>
      roleGuard({
        data: { roles: [UserRole.Admin] },
      } as unknown as ActivatedRouteSnapshot, {} as never),
    );

    expect(result instanceof UrlTree).toBe(true);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/');
  });
});

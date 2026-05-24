import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SessionService } from '../auth/session';
import { UserRole } from '../auth/session.models';

export const roleGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const session = inject(SessionService);
  const allowedRoles = (route.data?.['roles'] as UserRole[] | undefined) ?? [];
  const activeRole = session.role();

  if (activeRole != null && allowedRoles.includes(activeRole)) {
    return true;
  }

  return router.createUrlTree(['/']);
};

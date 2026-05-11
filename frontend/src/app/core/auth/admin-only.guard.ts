import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthSessionService } from './auth-session.service';

export const adminOnlyGuard: CanActivateFn = (_route, state) => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  if (authSession.isAdmin()) {
    return true;
  }

  return router.createUrlTree(['/auth/login'], {
    queryParams: {
      redirect: state.url
    }
  });
};

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SessionService } from '../auth/session';

export const authGuard: CanActivateFn = (_, state) => {
  const router = inject(Router);
  const session = inject(SessionService);

  if (session.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/auth/login'], {
    queryParams: {
      returnUrl: state.url,
    },
  });
};

import { Routes } from '@angular/router';

import { UserRole } from './core/auth/session.models';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./features/public/routes').then((module) => module.PUBLIC_ROUTES),
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/routes').then((module) => module.AUTH_ROUTES),
  },
  {
    path: 'student',
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.Student] },
    loadChildren: () =>
      import('./features/student/routes').then((module) => module.STUDENT_ROUTES),
  },
  {
    path: 'tutor',
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.Tutor] },
    loadChildren: () =>
      import('./features/tutor/routes').then((module) => module.TUTOR_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.Admin] },
    loadChildren: () =>
      import('./features/admin/routes').then((module) => module.ADMIN_ROUTES),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found').then((module) => module.NotFoundPage),
  },
];

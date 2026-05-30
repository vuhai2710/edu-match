import { Routes } from '@angular/router';

import { UserRole } from './core/auth/session.models';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { PublicShellComponent } from './shared/layout/public-shell';
import { WorkspaceShellComponent } from './shared/layout/workspace-shell';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/routes').then((module) => module.AUTH_ROUTES),
  },
  {
    path: 'reset-password',
    component: PublicShellComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/auth/reset-password/reset-password').then(
            (module) => module.ResetPasswordPage,
          ),
      },
      {
        path: ':token',
        loadComponent: () =>
          import('./features/auth/reset-password/reset-password').then(
            (module) => module.ResetPasswordPage,
          ),
      },
    ],
  },
  {
    path: 'student',
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.Student] },
    loadChildren: () =>
      import('./features/student/routes').then((module) => module.STUDENT_ROUTES),
  },
  {
    path: 'learning-requests',
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.Student] },
    component: WorkspaceShellComponent,
    children: [
      {
        path: ':id',
        loadComponent: () =>
          import('./features/student/learning-request-detail/learning-request-detail').then(
            (module) => module.LearningRequestDetailPage,
          ),
      },
    ],
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
    path: '',
    loadChildren: () =>
      import('./features/public/routes').then((module) => module.PUBLIC_ROUTES),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found').then((module) => module.NotFoundPage),
  },
];

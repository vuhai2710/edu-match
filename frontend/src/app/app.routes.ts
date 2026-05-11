import { Routes } from '@angular/router';
import { adminOnlyGuard } from './core/auth/admin-only.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'tutors'
  },
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/pages/login/login-page.component').then((m) => m.LoginPageComponent)
  },
  {
    path: 'tutors',
    loadComponent: () =>
      import('./features/tutors/pages/tutor-list/tutor-list-page.component').then((m) => m.TutorListPageComponent)
  },
  {
    path: 'tutor-requests',
    loadComponent: () =>
      import('./features/tutor-requests/pages/tutor-request-list/tutor-request-list-page.component').then(
        (m) => m.TutorRequestListPageComponent
      )
  },
  {
    path: 'admin/payments',
    canActivate: [adminOnlyGuard],
    loadComponent: () =>
      import('./features/admin/payments/pages/admin-payments/admin-payments-page.component').then(
        (m) => m.AdminPaymentsPageComponent
      )
  },
  {
    path: '**',
    redirectTo: 'tutors'
  }
];

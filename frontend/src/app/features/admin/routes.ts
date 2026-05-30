import { Routes } from '@angular/router';

import { WorkspaceShellComponent } from '../../shared/layout/workspace-shell';
import { AdminDashboardPage } from './dashboard/dashboard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: WorkspaceShellComponent,
    children: [
      {
        path: 'dashboard',
        component: AdminDashboardPage,
      },
      {
        path: 'users',
        loadComponent: () => import('./users/users').then((m) => m.AdminUsersPage),
      },
      {
        path: 'users/:id',
        loadComponent: () => import('./users/user-detail').then((m) => m.AdminUserDetailPage),
      },
      {
        path: 'subjects',
        loadComponent: () => import('./subjects/subjects').then((m) => m.AdminSubjectsPage),
      },
      {
        path: 'deposit-policy',
        loadComponent: () =>
          import('./deposit-policy/deposit-policy').then((m) => m.AdminDepositPolicyPage),
      },
      {
        path: 'classes',
        loadComponent: () => import('./classes/classes').then((m) => m.AdminClassesPage),
      },
      {
        path: 'classes/:id',
        loadComponent: () =>
          import('./classes/class-detail').then((m) => m.AdminClassDetailPage),
      },
      {
        path: 'cancellation-requests',
        loadComponent: () =>
          import('./cancellation-requests/cancellation-requests').then(
            (m) => m.AdminCancellationRequestsPage,
          ),
      },
      {
        path: 'cancellation-requests/:id',
        loadComponent: () =>
          import('./cancellation-requests/cancellation-request-detail').then(
            (m) => m.AdminCancellationRequestDetailPage,
          ),
      },
      {
        path: 'payments',
        loadComponent: () => import('./payments/payments').then((m) => m.AdminPaymentsPage),
      },
      {
        path: 'payments/:id',
        loadComponent: () =>
          import('./payments/payment-detail').then((m) => m.AdminPaymentDetailPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./profile-settings/profile-settings').then((m) => m.AdminProfileSettingsPage),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('../student/notifications/notification-center').then(m => m.NotificationCenterPage),
      },
      {
        path: 'chat',
        loadComponent: () =>
          import('../student/chat/chat').then(m => m.ChatPage),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
    ],
  },
];

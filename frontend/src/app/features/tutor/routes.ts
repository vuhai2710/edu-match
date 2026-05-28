import { Routes } from '@angular/router';

import { WorkspaceShellComponent } from '../../shared/layout/workspace-shell';
import { TutorDashboardPage } from './dashboard/dashboard';

export const TUTOR_ROUTES: Routes = [
  {
    path: '',
    component: WorkspaceShellComponent,
    children: [
      {
        path: 'dashboard',
        component: TutorDashboardPage,
      },
      {
        path: 'requests',
        loadComponent: () =>
          import('./learning-requests/learning-requests').then(m => m.TutorLearningRequestsPage),
      },
      {
        path: 'requests/:id',
        loadComponent: () =>
          import('./request-detail/request-detail').then(m => m.TutorRequestDetailPage),
      },
      {
        path: 'classes',
        loadComponent: () =>
          import('./classes/classes').then(m => m.TutorClassesPage),
      },
      {
        path: 'classes/:id',
        loadComponent: () =>
          import('./class-detail/class-detail').then(m => m.TutorClassDetailPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./profile-settings/profile-settings').then(m => m.TutorProfileSettingsPage),
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

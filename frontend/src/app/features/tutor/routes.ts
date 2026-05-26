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
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
    ],
  },
];

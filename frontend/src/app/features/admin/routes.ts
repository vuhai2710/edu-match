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
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
    ],
  },
];

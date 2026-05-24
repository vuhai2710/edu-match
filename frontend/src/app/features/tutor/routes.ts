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
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
    ],
  },
];

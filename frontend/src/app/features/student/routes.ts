import { Routes } from '@angular/router';

import { WorkspaceShellComponent } from '../../shared/layout/workspace-shell';
import { StudentDashboardPage } from './dashboard/dashboard';

export const STUDENT_ROUTES: Routes = [
  {
    path: '',
    component: WorkspaceShellComponent,
    children: [
      {
        path: 'dashboard',
        component: StudentDashboardPage,
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
    ],
  },
];

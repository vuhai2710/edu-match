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
        path: 'discover',
        loadComponent: () =>
          import('./discover-tutors/discover-tutors').then(m => m.DiscoverTutorsPage),
      },
      {
        path: 'tutor/:id',
        loadComponent: () =>
          import('./tutor-profile/tutor-profile').then(m => m.TutorProfilePage),
      },
      {
        path: 'booking/:tutorId',
        loadComponent: () =>
          import('./create-booking/create-booking').then(m => m.CreateBookingPage),
      },
      {
        path: 'booking-success',
        loadComponent: () =>
          import('./booking-success/booking-success').then(m => m.BookingSuccessPage),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./notifications/notification-center').then(m => m.NotificationCenterPage),
      },
      {
        path: 'chat',
        loadComponent: () =>
          import('./chat/chat').then(m => m.ChatPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./profile-settings/profile-settings').then(m => m.ProfileSettingsPage),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
    ],
  },
];

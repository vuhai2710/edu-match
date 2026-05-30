import { Routes } from '@angular/router';

import { PublicShellComponent } from '../../shared/layout/public-shell';
import { ForgotPasswordPage } from './forgot-password/forgot-password';
import { LoginPage } from './login/login';
import { RegisterChoicePage } from './register-choice/register-choice';
import { RegisterStudentPage } from './register-student/register-student';
import { RegisterTutorPage } from './register-tutor/register-tutor';
import { ResetPasswordPage } from './reset-password/reset-password';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: PublicShellComponent,
    children: [
      {
        path: 'login',
        component: LoginPage,
      },
      {
        path: 'register',
        component: RegisterChoicePage,
      },
      {
        path: 'register/student',
        component: RegisterStudentPage,
      },
      {
        path: 'register/tutor',
        component: RegisterTutorPage,
      },
      {
        path: 'forgot-password',
        component: ForgotPasswordPage,
      },
      {
        path: 'reset-password',
        component: ResetPasswordPage,
      },
      {
        path: 'reset-password/:token',
        component: ResetPasswordPage,
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login',
      },
    ],
  },
];

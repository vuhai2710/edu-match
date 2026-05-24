import { Routes } from '@angular/router';

import { PublicShellComponent } from '../../shared/layout/public-shell';
import { HomePage } from './home/home';
import { PaymentCancelPage } from './payment-cancel/payment-cancel';
import { PaymentSuccessPage } from './payment-success/payment-success';

export const PUBLIC_ROUTES: Routes = [
  {
    path: '',
    component: PublicShellComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: HomePage,
      },
      {
        path: 'payment/success',
        component: PaymentSuccessPage,
      },
      {
        path: 'payment/cancel',
        component: PaymentCancelPage,
      },
    ],
  },
];

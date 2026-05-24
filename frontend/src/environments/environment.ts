import { AppEnv } from '../app/core/config/app-env';

export const environment: AppEnv = {
  production: false,
  appName: 'EduMatch',
  appBaseUrl: 'http://localhost:4200',
  apiBaseUrl: 'https://localhost:7001',
  hubBaseUrl: 'https://localhost:7001',
  paymentReturnRoutes: {
    success: '/payment/success',
    cancel: '/payment/cancel',
  },
  realtime: {
    notifications: '/hubs/notifications',
    chat: '/hubs/chat',
  },
};

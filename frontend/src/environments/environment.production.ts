import { AppEnv } from '../app/core/config/app-env';

export const environment: AppEnv = {
  production: true,
  appName: 'EduMatch',
  appBaseUrl: 'https://edumatch.app',
  apiBaseUrl: 'https://localhost:7001',
  hubBaseUrl: 'https://localhost:7001',
  googleClientId: '156523713376-8gk7ckvh0332kjgcpbb2qjvq2o4br68i.apps.googleusercontent.com',
  paymentReturnRoutes: {
    success: '/payment/success',
    cancel: '/payment/cancel',
  },
  realtime: {
    notifications: '/hubs/notifications',
    chat: '/hubs/chat',
  },
};

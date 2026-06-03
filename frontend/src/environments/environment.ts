import { AppEnv } from '../app/core/config/app-env';

export const environment: AppEnv = {
  production: false,
  appName: 'EduMatch',
  appBaseUrl: 'https://www.edumatch.online',
  apiBaseUrl: 'https://api.edumatch.online',
  hubBaseUrl: 'https://api.edumatch.online',
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

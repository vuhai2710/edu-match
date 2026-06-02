import { AppEnv } from '../app/core/config/app-env';

export const environment: AppEnv = {
  production: false,
  appName: 'EduMatch',
  appBaseUrl: 'https://calm-mushroom-074f88300.7.azurestaticapps.net',
  apiBaseUrl: 'https://edumatch-api-gdagajg2gue9atb0.southeastasia-01.azurewebsites.net/',
  hubBaseUrl: 'https://edumatch-api-gdagajg2gue9atb0.southeastasia-01.azurewebsites.net/',
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

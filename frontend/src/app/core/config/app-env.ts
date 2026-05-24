import {
  EnvironmentProviders,
  InjectionToken,
  makeEnvironmentProviders,
} from '@angular/core';

export interface PaymentReturnRoutes {
  success: string;
  cancel: string;
}

export interface RealtimeHubConfig {
  notifications: string;
  chat: string;
}

export interface AppEnv {
  production: boolean;
  appName: string;
  appBaseUrl: string;
  apiBaseUrl: string;
  hubBaseUrl: string;
  paymentReturnRoutes: PaymentReturnRoutes;
  realtime: RealtimeHubConfig;
}

export const APP_ENV = new InjectionToken<AppEnv>('APP_ENV');

export function provideAppEnv(environment: AppEnv): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: APP_ENV, useValue: environment }]);
}

import {
  ApplicationConfig,
  ErrorHandler,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeVi from '@angular/common/locales/vi';

import { environment } from '../environments/environment';
import { provideEduMatchApi } from './api/generated/provider';
import { provideAppEnv } from './core/config/app-env';
import { AppErrorHandler } from './core/error/app-error-handler';
import { authInterceptor } from './core/http/auth-interceptor';
import { routes } from './app.routes';

registerLocaleData(localeVi);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: ErrorHandler, useClass: AppErrorHandler },
    { provide: LOCALE_ID, useValue: 'vi-VN' },
    provideAppEnv(environment),
    provideEduMatchApi(environment),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled',
      }),
    ),
  ],
};

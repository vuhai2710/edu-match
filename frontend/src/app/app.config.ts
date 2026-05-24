import {
  APP_INITIALIZER,
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { environment } from '../environments/environment';
import { provideEduMatchApi } from './api/generated/provider';
import { ProfileBootstrapService } from './core/auth/profile-bootstrap';
import { provideAppEnv } from './core/config/app-env';
import { authInterceptor } from './core/http/auth-interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
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
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [ProfileBootstrapService],
      useFactory: (bootstrap: ProfileBootstrapService) => () => bootstrap.bootstrap(),
    },
  ],
};

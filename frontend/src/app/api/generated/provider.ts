import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';

import { AppEnv } from '../../core/config/app-env';
import { provideNgOpenapi } from './client/providers';

export function provideEduMatchApi(environment: AppEnv): EnvironmentProviders {
  return makeEnvironmentProviders([provideNgOpenapi({ basePath: environment.apiBaseUrl })]);
}

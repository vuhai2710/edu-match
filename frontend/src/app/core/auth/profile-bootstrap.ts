import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthApiService } from '../../api/facades/auth-api';
import { SessionService } from './session';

@Injectable({ providedIn: 'root' })
export class ProfileBootstrapService {
  private readonly authApi = inject(AuthApiService);
  private readonly session = inject(SessionService);

  async bootstrap(): Promise<void> {
    this.session.hydrateFromStorage();

    if (!this.session.accessToken()) {
      return;
    }

    try {
      const me = await firstValueFrom(this.authApi.getCurrentUser());
      this.session.setUser(me.data ?? null);
      return;
    } catch {
      if (!this.session.tokens()) {
        this.session.clear();
        return;
      }
    }

    try {
      const refreshed = await firstValueFrom(
        this.authApi.refreshToken(this.session.tokens()!),
      );

      if (!refreshed.data) {
        throw new Error('Missing refresh token payload');
      }

      this.session.bootstrapFromLogin(refreshed.data);

      const me = await firstValueFrom(this.authApi.getCurrentUser());
      this.session.setUser(me.data ?? null);
    } catch {
      this.session.clear();
    }
  }
}

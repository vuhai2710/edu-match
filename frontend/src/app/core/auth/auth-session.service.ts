import { computed, inject, Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

import { AuthApi, LoginDto, LoginResponseDto, UserDto, UserRole } from '../../../api/generated';
import { unwrapApiResponse } from '../../shared/utils/api-response.utils';
import { AuthSession } from './auth-session.models';
import { TokenStorageService } from './token-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthSessionService {
  private readonly authApi = inject(AuthApi);
  private readonly tokenStorage = inject(TokenStorageService);

  private readonly sessionState = signal<AuthSession | null>(this.tokenStorage.load());

  readonly session = this.sessionState.asReadonly();
  readonly currentUser = computed(() => this.sessionState()?.user ?? null);
  readonly isAuthenticated = computed(() => Boolean(this.sessionState()?.accessToken));
  readonly isAdmin = computed(() => this.currentUser()?.role === UserRole.Admin);

  login(credentials: LoginDto): Observable<LoginResponseDto> {
    return this.authApi.login({ loginDto: credentials }).pipe(
      map((response) => unwrapApiResponse(response)),
      tap((response) => this.persistSession(response))
    );
  }

  refreshCurrentUser(): Observable<UserDto> {
    return this.authApi.getCurrentUser().pipe(
      map((response) => unwrapApiResponse(response)),
      tap((user) => {
        const currentSession = this.sessionState();
        if (!currentSession) {
          return;
        }

        const nextSession: AuthSession = {
          ...currentSession,
          user
        };
        this.tokenStorage.save(nextSession);
        this.sessionState.set(nextSession);
      })
    );
  }

  logout(): void {
    this.tokenStorage.clear();
    this.sessionState.set(null);
  }

  private persistSession(response: LoginResponseDto): void {
    if (!response.accessToken) {
      throw new Error('Backend login response did not include an access token.');
    }

    const session: AuthSession = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken ?? '',
      user: response.user ?? null
    };

    this.tokenStorage.save(session);
    this.sessionState.set(session);
  }
}

import { Injectable, computed, signal } from '@angular/core';

import { LoginResponseDto, SessionTokens, SessionUser, UserRole } from './session.models';

interface SessionState {
  tokens: SessionTokens | null;
  user: SessionUser | null;
  hydrated: boolean;
}

const STORAGE_KEYS = {
  tokens: 'edumatch.session.tokens',
  user: 'edumatch.session.user',
} as const;

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly state = signal<SessionState>({
    tokens: null,
    user: null,
    hydrated: false,
  });

  readonly tokens = computed(() => this.state().tokens);
  readonly user = computed(() => this.state().user);
  readonly accessToken = computed(() => this.state().tokens?.accessToken ?? null);
  readonly refreshToken = computed(() => this.state().tokens?.refreshToken ?? null);
  readonly role = computed(() => this.state().user?.role ?? null);
  readonly isAuthenticated = computed(() => Boolean(this.state().tokens?.accessToken));
  readonly isHydrated = computed(() => this.state().hydrated);

  constructor() {
    this.hydrateFromStorage();
  }

  hydrateFromStorage(): void {
    if (this.state().hydrated) {
      return;
    }

    const tokens = this.readJson<SessionTokens>(STORAGE_KEYS.tokens);
    const user = this.readJson<SessionUser>(STORAGE_KEYS.user);

    this.state.set({
      tokens,
      user,
      hydrated: true,
    });
  }

  bootstrapFromLogin(response: LoginResponseDto): void {
    this.setTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });
    this.setUser(response.user);
  }

  setTokens(tokens: SessionTokens | null): void {
    this.patchState({ tokens });
    this.writeJson(STORAGE_KEYS.tokens, tokens);
  }

  setUser(user: SessionUser | null): void {
    this.patchState({ user });
    this.writeJson(STORAGE_KEYS.user, user);
  }

  hasRole(role: UserRole): boolean {
    return this.role() === role;
  }

  clear(): void {
    this.patchState({ tokens: null, user: null });
    this.removeKey(STORAGE_KEYS.tokens);
    this.removeKey(STORAGE_KEYS.user);
  }

  private patchState(partial: Partial<SessionState>): void {
    this.state.update((current) => ({
      ...current,
      ...partial,
      hydrated: true,
    }));
  }

  private readJson<T>(key: string): T | null {
    if (!this.hasStorage()) {
      return null;
    }

    const value = window.localStorage.getItem(key);
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      window.localStorage.removeItem(key);
      return null;
    }
  }

  private writeJson(key: string, value: unknown): void {
    if (!this.hasStorage()) {
      return;
    }

    if (value == null) {
      window.localStorage.removeItem(key);
      return;
    }

    window.localStorage.setItem(key, JSON.stringify(value));
  }

  private removeKey(key: string): void {
    if (this.hasStorage()) {
      window.localStorage.removeItem(key);
    }
  }

  private hasStorage(): boolean {
    return typeof window !== 'undefined' && Boolean(window.localStorage);
  }
}

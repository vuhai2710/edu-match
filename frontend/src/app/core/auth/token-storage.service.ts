import { Injectable } from '@angular/core';

import { AuthSession } from './auth-session.models';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  private readonly storageKey = 'edumatch.auth-session';

  load(): AuthSession | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const rawValue = localStorage.getItem(this.storageKey);
    if (!rawValue) {
      return null;
    }

    try {
      return JSON.parse(rawValue) as AuthSession;
    } catch {
      this.clear();
      return null;
    }
  }

  save(session: AuthSession): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(this.storageKey, JSON.stringify(session));
  }

  clear(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.removeItem(this.storageKey);
  }

  getAccessToken(): string | null {
    return this.load()?.accessToken ?? null;
  }
}

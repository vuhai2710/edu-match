import { Injectable } from '@angular/core';

import { AuthSession } from './auth-session.models';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  private readonly storageKey = 'edumatch.auth-session';

  load(): AuthSession | null {
    const persistentStorage = this.getPersistentStorage();
    const sessionStorage = this.getSessionStorage();

    if (!persistentStorage && !sessionStorage) {
      return null;
    }

    const rawValue = persistentStorage?.getItem(this.storageKey) ?? sessionStorage?.getItem(this.storageKey);
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

  save(session: AuthSession, persist: boolean = true): void {
    const storage = persist ? this.getPersistentStorage() : this.getSessionStorage();
    if (!storage) {
      return;
    }

    this.clear();
    storage.setItem(this.storageKey, JSON.stringify(session));
  }

  clear(): void {
    this.getPersistentStorage()?.removeItem(this.storageKey);
    this.getSessionStorage()?.removeItem(this.storageKey);
  }

  getAccessToken(): string | null {
    return this.load()?.accessToken ?? null;
  }

  private getPersistentStorage(): Storage | null {
    return typeof localStorage === 'undefined' ? null : localStorage;
  }

  private getSessionStorage(): Storage | null {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  }
}

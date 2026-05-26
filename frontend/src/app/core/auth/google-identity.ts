import { inject, Injectable } from '@angular/core';

import { APP_ENV } from '../config/app-env';

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleTokenClient {
  requestAccessToken(overrideConfig?: { prompt?: string }): void;
}

interface GoogleTokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: GoogleTokenResponse) => void;
  error_callback?: (error: unknown) => void;
}

interface GoogleAccounts {
  oauth2?: {
    initTokenClient(config: GoogleTokenClientConfig): GoogleTokenClient;
  };
}

declare global {
  interface Window {
    google?: {
      accounts?: GoogleAccounts;
    };
  }
}

@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private static readonly googleScriptUrl = 'https://accounts.google.com/gsi/client';

  private readonly environment = inject(APP_ENV);
  private scriptLoadPromise: Promise<void> | null = null;

  get clientId(): string {
    return this.environment.googleClientId.trim();
  }

  isConfigured(): boolean {
    return Boolean(this.clientId);
  }

  requestCredential(): Promise<string> {
    if (!this.isConfigured()) {
      return Promise.reject(new Error('Google Client ID chưa được cấu hình.'));
    }

    if (typeof window === 'undefined') {
      return Promise.reject(new Error('Google login chỉ hỗ trợ trên trình duyệt.'));
    }

    return this.loadScript().then(() => new Promise<string>((resolve, reject) => {
      const oauth2 = window.google?.accounts?.oauth2;

      if (!oauth2) {
        reject(new Error('Không khởi tạo được Google Identity Services.'));
        return;
      }

      const tokenClient = oauth2.initTokenClient({
        client_id: this.clientId,
        scope: 'openid email profile',
        callback: (response) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }

          if (!response.access_token) {
            reject(new Error('Google không trả về access token.'));
            return;
          }

          resolve(response.access_token);
        },
        error_callback: () => {
          reject(new Error('Không mở được cửa sổ đăng nhập Google.'));
        },
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
    }));
  }

  private loadScript(): Promise<void> {
    if (window.google?.accounts?.oauth2) {
      return Promise.resolve();
    }

    if (this.scriptLoadPromise) {
      return this.scriptLoadPromise;
    }

    this.scriptLoadPromise = new Promise<void>((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        `script[src="${GoogleIdentityService.googleScriptUrl}"]`,
      );

      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener(
          'error',
          () => reject(new Error('Không tải được Google Identity Services.')),
          { once: true },
        );
        return;
      }

      const script = document.createElement('script');
      script.src = GoogleIdentityService.googleScriptUrl;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Không tải được Google Identity Services.'));
      document.head.appendChild(script);
    });

    return this.scriptLoadPromise;
  }
}
